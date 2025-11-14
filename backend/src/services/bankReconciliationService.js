const BankTransaction = require('../models/BankTransaction');
const Booking = require('../models/Booking');
const csv = require('csv-parser');
const fs = require('fs');
const { Readable } = require('stream');

class BankReconciliationService {
  
  /**
   * Parse CSV bank statement
   * Supports multiple formats - automatically detects columns
   */
  async parseCSV(fileBuffer, tenantId, userId) {
    const results = [];
    const importBatch = `import_${Date.now()}`;
    
    return new Promise((resolve, reject) => {
      const stream = Readable.from(fileBuffer.toString());
      
      stream
        .pipe(csv())
        .on('data', (row) => {
          try {
            const transaction = this.mapCSVRow(row, tenantId, userId, importBatch);
            if (transaction) {
              results.push(transaction);
            }
          } catch (error) {
            console.error('Error parsing CSV row:', error.message);
          }
        })
        .on('end', () => {
          resolve({ transactions: results, importBatch });
        })
        .on('error', reject);
    });
  }
  
  /**
   * Map CSV row to transaction object
   * Handles multiple column name variations
   */
  mapCSVRow(row, tenantId, userId, importBatch) {
    // Try to find date column (various possible names)
    const dateField = this.findField(row, ['date', 'transaction date', 'trans date', 'value date', 'posting date']);
    const descField = this.findField(row, ['description', 'details', 'narrative', 'transaction details', 'particulars']);
    const amountField = this.findField(row, ['amount', 'value', 'debit', 'credit', 'transaction amount']);
    const refField = this.findField(row, ['reference', 'ref', 'transaction reference', 'cheque no', 'reference number']);
    
    if (!dateField || !descField || !amountField) {
      console.warn('Missing required fields in row:', row);
      return null;
    }
    
    // Parse amount (handle both debit/credit columns or single amount column)
    let amount = 0;
    if (row['debit'] || row['credit']) {
      // Separate debit/credit columns
      amount = parseFloat(row['credit'] || 0) - parseFloat(row['debit'] || 0);
    } else {
      // Single amount column
      amount = parseFloat(amountField.replace(/[,$]/g, ''));
    }
    
    // Skip if amount is 0 or invalid
    if (isNaN(amount) || amount === 0) {
      return null;
    }
    
    return {
      tenant: tenantId,
      transactionDate: new Date(dateField),
      description: descField.trim(),
      amount,
      reference: refField ? refField.trim() : null,
      rawData: row,
      importBatch,
      importedBy: userId,
      status: 'unmatched'
    };
  }
  
  /**
   * Find field value by trying multiple possible column names
   */
  findField(row, possibleNames) {
    for (const name of possibleNames) {
      // Try exact match
      if (row[name]) return row[name];
      
      // Try case-insensitive match
      const key = Object.keys(row).find(k => k.toLowerCase() === name.toLowerCase());
      if (key && row[key]) return row[key];
    }
    return null;
  }
  
  /**
   * Parse OFX bank statement
   */
  async parseOFX(fileContent, tenantId, userId) {
    const importBatch = `import_${Date.now()}`;
    const transactions = [];
    
    // Simple OFX parsing (basic implementation)
    const stmtTrnRegex = /<STMTTRN>([\s\S]*?)<\/STMTTRN>/g;
    let match;
    
    while ((match = stmtTrnRegex.exec(fileContent)) !== null) {
      const trnBlock = match[1];
      
      const dateMatch = /<DTPOSTED>(\d{8})/i.exec(trnBlock);
      const amountMatch = /<TRNAMT>([\d.-]+)/i.exec(trnBlock);
      const nameMatch = /<NAME>(.*?)<\/NAME>/i.exec(trnBlock);
      const memoMatch = /<MEMO>(.*?)<\/MEMO>/i.exec(trnBlock);
      const fitidMatch = /<FITID>(.*?)<\/FITID>/i.exec(trnBlock);
      
      if (dateMatch && amountMatch) {
        const dateStr = dateMatch[1];
        const date = new Date(
          dateStr.substring(0, 4),
          parseInt(dateStr.substring(4, 6)) - 1,
          dateStr.substring(6, 8)
        );
        
        const description = [nameMatch?.[1], memoMatch?.[1]].filter(Boolean).join(' - ');
        
        transactions.push({
          tenant: tenantId,
          transactionDate: date,
          description: description.trim(),
          amount: parseFloat(amountMatch[1]),
          reference: fitidMatch?.[1] || null,
          rawData: { ofxBlock: trnBlock },
          importBatch,
          importedBy: userId,
          status: 'unmatched'
        });
      }
    }
    
    return { transactions, importBatch };
  }
  
  /**
   * Import bank transactions from file
   */
  async importBankStatement(file, tenantId, userId) {
    let parseResult;
    
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      parseResult = await this.parseCSV(file.buffer, tenantId, userId);
    } else if (file.originalname.endsWith('.ofx') || file.originalname.endsWith('.qfx')) {
      parseResult = await this.parseOFX(file.buffer.toString(), tenantId, userId);
    } else {
      throw new Error('Unsupported file format. Please upload CSV or OFX file.');
    }
    
    // Save transactions to database
    const saved = await BankTransaction.insertMany(parseResult.transactions);
    
    return {
      importBatch: parseResult.importBatch,
      imported: saved.length,
      transactions: saved
    };
  }
  
  /**
   * Auto-match transactions with bookings
   * Uses fuzzy matching algorithm with scoring
   */
  async autoMatchTransactions(tenantId, options = {}) {
    const { importBatch, minScore = 70 } = options;
    
    // Get unmatched transactions
    const query = { tenant: tenantId, status: 'unmatched' };
    if (importBatch) query.importBatch = importBatch;
    
    const transactions = await BankTransaction.find(query, null, { _skipPopulate: true });
    
    const matches = [];
    const unmatched = [];
    
    for (const transaction of transactions) {
      const match = await this.findBestMatch(transaction, tenantId);
      
      if (match && match.score >= minScore) {
        // Auto-match if score is high enough
        await transaction.matchWithBooking(
          match.booking._id,
          'automatic',
          null,
          match.score
        );
        matches.push({
          transaction: transaction._id,
          booking: match.booking._id,
          score: match.score
        });
      } else if (match && match.score >= 50) {
        // Suggest if score is moderate
        unmatched.push({
          transaction,
          suggestion: match
        });
      } else {
        unmatched.push({
          transaction,
          suggestion: null
        });
      }
    }
    
    return {
      matched: matches.length,
      unmatched: unmatched.length,
      matches,
      suggestions: unmatched
    };
  }
  
  /**
   * Find best matching booking for a transaction
   */
  async findBestMatch(transaction, tenantId) {
    // Search for bookings within +/- 7 days of transaction date
    const startDate = new Date(transaction.transactionDate);
    startDate.setDate(startDate.getDate() - 7);
    const endDate = new Date(transaction.transactionDate);
    endDate.setDate(endDate.getDate() + 7);
    
    // Get candidate bookings (confirmed or completed)
    const bookings = await Booking.find({
      tenant: tenantId,
      status: { $in: ['confirmed', 'completed'] },
      'financial.paymentStatus': { $in: ['paid', 'partial'] },
      createdAt: { $gte: startDate, $lte: endDate }
    }, null, { _skipPopulate: true });
    
    let bestMatch = null;
    let bestScore = 0;
    
    for (const booking of bookings) {
      const score = this.calculateMatchScore(transaction, booking);
      
      if (score > bestScore) {
        bestScore = score;
        bestMatch = { booking, score };
      }
    }
    
    return bestMatch;
  }
  
  /**
   * Calculate match score between transaction and booking
   * Returns score 0-100
   */
  calculateMatchScore(transaction, booking) {
    let score = 0;
    
    // 1. Amount matching (50 points max)
    const amountDiff = Math.abs(transaction.amount - booking.financial.totalAmount);
    const amountPercent = (amountDiff / booking.financial.totalAmount) * 100;
    
    if (amountPercent === 0) {
      score += 50; // Exact match
    } else if (amountPercent < 1) {
      score += 45; // Within 1%
    } else if (amountPercent < 5) {
      score += 35; // Within 5%
    } else if (amountPercent < 10) {
      score += 20; // Within 10%
    }
    
    // 2. Date proximity (20 points max)
    const daysDiff = Math.abs(
      (transaction.transactionDate - booking.createdAt) / (1000 * 60 * 60 * 24)
    );
    
    if (daysDiff === 0) {
      score += 20; // Same day
    } else if (daysDiff <= 1) {
      score += 15; // Within 1 day
    } else if (daysDiff <= 3) {
      score += 10; // Within 3 days
    } else if (daysDiff <= 7) {
      score += 5; // Within 7 days
    }
    
    // 3. Reference matching (30 points max)
    if (transaction.reference && booking.bookingNumber) {
      const refLower = transaction.reference.toLowerCase();
      const bookingNumLower = booking.bookingNumber.toLowerCase();
      
      if (refLower.includes(bookingNumLower) || bookingNumLower.includes(refLower)) {
        score += 30; // Reference contains booking number
      }
    }
    
    // Also check description for booking number
    if (booking.bookingNumber) {
      const descLower = transaction.description.toLowerCase();
      const bookingNumLower = booking.bookingNumber.toLowerCase();
      
      if (descLower.includes(bookingNumLower)) {
        score += 15; // Description contains booking number
      }
    }
    
    // Check customer name in description
    if (booking.customer && booking.customer.name) {
      const descLower = transaction.description.toLowerCase();
      const customerNameLower = booking.customer.name.toLowerCase();
      const nameParts = customerNameLower.split(' ');
      
      // Check if any part of customer name is in description
      const nameMatch = nameParts.some(part => 
        part.length > 2 && descLower.includes(part)
      );
      
      if (nameMatch) {
        score += 10;
      }
    }
    
    // Cap at 100
    return Math.min(score, 100);
  }
  
  /**
   * Manual match transaction with booking
   */
  async manualMatch(transactionId, bookingId, userId) {
    const transaction = await BankTransaction.findById(transactionId);
    if (!transaction) {
      throw new Error('Transaction not found');
    }
    
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      throw new Error('Booking not found');
    }
    
    // Verify same tenant
    if (transaction.tenant.toString() !== booking.tenant.toString()) {
      throw new Error('Transaction and booking must belong to same tenant');
    }
    
    await transaction.matchWithBooking(bookingId, 'manual', userId);
    
    return transaction;
  }
  
  /**
   * Unmatch a transaction
   */
  async unmatch(transactionId) {
    const transaction = await BankTransaction.findById(transactionId);
    if (!transaction) {
      throw new Error('Transaction not found');
    }
    
    await transaction.unmatch();
    return transaction;
  }
  
  /**
   * Get reconciliation report
   */
  async getReconciliationReport(tenantId, startDate, endDate) {
    const summary = await BankTransaction.getReconciliationSummary(tenantId, startDate, endDate);
    
    // Get details
    const matchStage = { tenant: tenantId };
    if (startDate || endDate) {
      matchStage.transactionDate = {};
      if (startDate) matchStage.transactionDate.$gte = new Date(startDate);
      if (endDate) matchStage.transactionDate.$lte = new Date(endDate);
    }
    
    const unmatched = await BankTransaction.find({
      ...matchStage,
      status: 'unmatched'
    }).sort({ transactionDate: -1 });
    
    const matched = await BankTransaction.find({
      ...matchStage,
      status: { $in: ['matched', 'manually_matched'] }
    }).sort({ transactionDate: -1 });
    
    return {
      summary,
      unmatched,
      matched,
      period: {
        startDate: startDate || null,
        endDate: endDate || null
      }
    };
  }
}

module.exports = new BankReconciliationService();

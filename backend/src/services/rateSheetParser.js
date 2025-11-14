/**
 * Rate Sheet Parser Service
 * Phase 5.2: CSV parsing and validation for rate sheet uploads
 * 
 * Supports:
 * - CSV parsing with flexible column mapping
 * - Data validation
 * - Error handling and reporting
 * - Multiple format support
 */

const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');

class RateSheetParser {
  constructor() {
    // Standard column mappings (flexible - can match variations)
    this.columnMappings = {
      // Service identification
      serviceName: ['service_name', 'service', 'servicename', 'name', 'service name', 'product'],
      serviceType: ['service_type', 'servicetype', 'type', 'service type', 'category'],
      serviceCode: ['service_code', 'servicecode', 'code', 'service code', 'sku', 'product_code'],
      
      // Location
      city: ['city', 'location', 'destination'],
      country: ['country', 'nation'],
      region: ['region', 'area', 'province', 'state'],
      
      // Pricing
      basePrice: ['base_price', 'baseprice', 'price', 'base price', 'rate', 'cost', 'amount'],
      currency: ['currency', 'curr', 'ccy'],
      priceType: ['price_type', 'pricetype', 'price type', 'pricing_type'],
      
      // Pax
      minPax: ['min_pax', 'minpax', 'min pax', 'minimum_pax', 'min', 'minimum'],
      maxPax: ['max_pax', 'maxpax', 'max pax', 'maximum_pax', 'max', 'maximum'],
      
      // Dates
      validFrom: ['valid_from', 'validfrom', 'valid from', 'start_date', 'from', 'from_date', 'effective_date'],
      validTo: ['valid_to', 'validto', 'valid to', 'end_date', 'to', 'to_date', 'expiry_date'],
      
      // Season
      seasonName: ['season_name', 'seasonname', 'season', 'season name', 'period'],
      
      // Additional
      description: ['description', 'desc', 'details'],
      inclusions: ['inclusions', 'included', 'includes'],
      exclusions: ['exclusions', 'excluded', 'excludes'],
      conditions: ['conditions', 'terms', 'conditions'],
      
      // Markup
      markupPercentage: ['markup_percentage', 'markup_%', 'markup', 'markup percentage'],
      markupAmount: ['markup_amount', 'markup amount', 'markup_amt'],
    };
  }
  
  /**
   * Parse CSV file and return structured data
   */
  async parseCSV(filePath, options = {}) {
    return new Promise((resolve, reject) => {
      const results = [];
      const errors = [];
      const warnings = [];
      let rowNumber = 0;
      let headers = [];
      
      fs.createReadStream(filePath)
        .pipe(csv({
          mapHeaders: ({ header }) => header.toLowerCase().trim(),
          skipLines: options.skipLines || 0,
        }))
        .on('headers', (headerList) => {
          headers = headerList;
          
          // Validate required columns exist
          const mappedHeaders = this.mapColumns(headers);
          const requiredFields = ['serviceName', 'basePrice', 'validFrom', 'validTo'];
          const missingFields = requiredFields.filter(field => !mappedHeaders[field]);
          
          if (missingFields.length > 0) {
            warnings.push(`Missing recommended columns: ${missingFields.join(', ')}`);
          }
        })
        .on('data', (row) => {
          rowNumber++;
          try {
            const mappedRow = this.mapRowToSchema(row, headers);
            const validation = this.validateRate(mappedRow, rowNumber);
            
            if (validation.isValid) {
              results.push(mappedRow);
            } else {
              errors.push({
                row: rowNumber,
                data: row,
                errors: validation.errors,
              });
            }
            
            if (validation.warnings && validation.warnings.length > 0) {
              warnings.push(...validation.warnings.map(w => `Row ${rowNumber}: ${w}`));
            }
          } catch (error) {
            errors.push({
              row: rowNumber,
              data: row,
              errors: [error.message],
            });
          }
        })
        .on('end', () => {
          resolve({
            success: true,
            data: results,
            errors,
            warnings,
            statistics: {
              totalRows: rowNumber,
              validRows: results.length,
              invalidRows: errors.length,
              headers,
            },
          });
        })
        .on('error', (error) => {
          reject({
            success: false,
            message: 'Failed to parse CSV file',
            error: error.message,
          });
        });
    });
  }
  
  /**
   * Map CSV columns to our schema fields
   */
  mapColumns(headers) {
    const mapping = {};
    
    for (const [schemaField, possibleColumns] of Object.entries(this.columnMappings)) {
      const matchedColumn = headers.find(header => 
        possibleColumns.includes(header.toLowerCase().trim())
      );
      
      if (matchedColumn) {
        mapping[schemaField] = matchedColumn;
      }
    }
    
    return mapping;
  }
  
  /**
   * Map a single CSV row to our schema
   */
  mapRowToSchema(row, headers) {
    const columnMapping = this.mapColumns(headers);
    const mapped = {};
    
    // Save original data for reference
    mapped.originalData = new Map(Object.entries(row));
    
    // Map known fields
    for (const [schemaField, csvColumn] of Object.entries(columnMapping)) {
      const value = row[csvColumn];
      
      if (value !== undefined && value !== null && value !== '') {
        mapped[schemaField] = this.convertValue(schemaField, value);
      }
    }
    
    // Handle location object
    if (mapped.city || mapped.country || mapped.region) {
      mapped.location = {
        city: mapped.city,
        country: mapped.country,
        region: mapped.region,
      };
      delete mapped.city;
      delete mapped.country;
      delete mapped.region;
    }
    
    // Handle array fields (comma-separated values)
    ['inclusions', 'exclusions', 'conditions'].forEach(field => {
      if (mapped[field] && typeof mapped[field] === 'string') {
        mapped[field] = mapped[field].split(',').map(item => item.trim()).filter(Boolean);
      }
    });
    
    return mapped;
  }
  
  /**
   * Convert value to appropriate type based on field
   */
  convertValue(field, value) {
    // Number fields
    if (['basePrice', 'minPax', 'maxPax', 'markupPercentage', 'markupAmount'].includes(field)) {
      const num = parseFloat(value);
      return isNaN(num) ? 0 : num;
    }
    
    // Date fields
    if (['validFrom', 'validTo'].includes(field)) {
      const date = new Date(value);
      return isNaN(date.getTime()) ? null : date;
    }
    
    // Enum fields with normalization
    if (field === 'serviceType') {
      const normalized = value.toLowerCase().trim();
      const typeMap = {
        'hotel': 'hotel',
        'accommodation': 'hotel',
        'transport': 'transport',
        'transportation': 'transport',
        'transfer': 'transport',
        'activity': 'activity',
        'excursion': 'activity',
        'tour': 'tour',
        'sightseeing': 'tour',
        'meal': 'meal',
        'food': 'meal',
        'restaurant': 'meal',
      };
      return typeMap[normalized] || 'other';
    }
    
    if (field === 'priceType') {
      const normalized = value.toLowerCase().trim();
      const typeMap = {
        'per person': 'per-person',
        'per-person': 'per-person',
        'pp': 'per-person',
        'per unit': 'per-unit',
        'per-unit': 'per-unit',
        'per day': 'per-day',
        'per-day': 'per-day',
        'daily': 'per-day',
        'per service': 'per-service',
        'per-service': 'per-service',
        'flat': 'flat',
        'fixed': 'flat',
      };
      return typeMap[normalized] || 'per-person';
    }
    
    if (field === 'currency') {
      return value.toUpperCase().trim();
    }
    
    // String fields
    return typeof value === 'string' ? value.trim() : value;
  }
  
  /**
   * Validate a mapped rate object
   */
  validateRate(rate, rowNumber) {
    const errors = [];
    const warnings = [];
    
    // Required fields
    if (!rate.serviceName) {
      errors.push('Service name is required');
    }
    
    if (rate.basePrice === undefined || rate.basePrice === null) {
      errors.push('Base price is required');
    } else if (rate.basePrice < 0) {
      errors.push('Base price cannot be negative');
    }
    
    if (!rate.validFrom) {
      errors.push('Valid from date is required or invalid');
    }
    
    if (!rate.validTo) {
      errors.push('Valid to date is required or invalid');
    }
    
    // Date validation
    if (rate.validFrom && rate.validTo) {
      if (rate.validFrom > rate.validTo) {
        errors.push('Valid from date must be before valid to date');
      }
    }
    
    // Pax validation
    if (rate.minPax && rate.maxPax && rate.minPax > rate.maxPax) {
      errors.push('Minimum pax cannot be greater than maximum pax');
    }
    
    // Warnings
    if (!rate.serviceType) {
      warnings.push('Service type not specified, will default to "other"');
    }
    
    if (!rate.currency) {
      warnings.push('Currency not specified, will default to "USD"');
      rate.currency = 'USD';
    }
    
    if (!rate.priceType) {
      warnings.push('Price type not specified, will default to "per-person"');
      rate.priceType = 'per-person';
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }
  
  /**
   * Generate CSV template
   */
  generateTemplate() {
    const headers = [
      'service_name',
      'service_type',
      'service_code',
      'city',
      'country',
      'base_price',
      'currency',
      'price_type',
      'min_pax',
      'max_pax',
      'valid_from',
      'valid_to',
      'season_name',
      'description',
      'inclusions',
      'exclusions',
    ];
    
    const example = [
      'Dubai City Tour',
      'tour',
      'TOUR-DXB-001',
      'Dubai',
      'UAE',
      '150',
      'USD',
      'per-person',
      '2',
      '50',
      '2024-01-01',
      '2024-12-31',
      'All Year',
      'Full day city tour with lunch',
      'Transport, Guide, Lunch',
      'Personal expenses, Tips',
    ];
    
    return {
      headers,
      example,
      csv: this.arrayToCSV([headers, example]),
    };
  }
  
  /**
   * Convert array of arrays to CSV string
   */
  arrayToCSV(data) {
    return data.map(row => 
      row.map(cell => {
        // Escape cells containing commas or quotes
        if (typeof cell === 'string' && (cell.includes(',') || cell.includes('"'))) {
          return `"${cell.replace(/"/g, '""')}"`;
        }
        return cell;
      }).join(',')
    ).join('\n');
  }
  
  /**
   * Parse and validate uploaded file
   */
  async processUpload(filePath, supplier, uploadedBy) {
    try {
      // Parse CSV
      const parseResult = await this.parseCSV(filePath);
      
      if (!parseResult.success) {
        return {
          success: false,
          message: 'Failed to parse CSV file',
          error: parseResult.error,
        };
      }
      
      // Build rate sheet data
      const rateSheetData = {
        supplier: supplier._id,
        tenant: supplier.tenant,
        fileName: path.basename(filePath),
        fileSize: fs.statSync(filePath).size,
        fileType: 'csv',
        filePath,
        rates: parseResult.data,
        uploadedBy,
        parsingMetadata: {
          rowsParsed: parseResult.statistics.totalRows,
          rowsFailed: parseResult.errors.length,
          warnings: parseResult.warnings,
          columnMapping: new Map(
            Object.entries(this.mapColumns(parseResult.statistics.headers))
          ),
        },
      };
      
      // Calculate effective and expiry dates from rates
      if (parseResult.data.length > 0) {
        const allValidFromDates = parseResult.data
          .map(r => r.validFrom)
          .filter(Boolean);
        const allValidToDates = parseResult.data
          .map(r => r.validTo)
          .filter(Boolean);
        
        if (allValidFromDates.length > 0) {
          rateSheetData.effectiveDate = new Date(Math.min(...allValidFromDates));
        }
        
        if (allValidToDates.length > 0) {
          rateSheetData.expiryDate = new Date(Math.max(...allValidToDates));
        }
      }
      
      return {
        success: true,
        data: rateSheetData,
        errors: parseResult.errors,
        warnings: parseResult.warnings,
        statistics: parseResult.statistics,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to process upload',
        error: error.message,
      };
    }
  }
}

module.exports = new RateSheetParser();

const csv = require('csv-parser');
const { Readable } = require('stream');
const Customer = require('../models/Customer');

/**
 * Parse CSV data and validate
 * @param {string} csvData - CSV string data
 * @returns {Promise<Object>} Parsed and validated data
 */
const parseCustomerCSV = async (csvData) => {
  return new Promise((resolve, reject) => {
    const results = [];
    const errors = [];
    let lineNumber = 1; // Header is line 1

    const stream = Readable.from([csvData]);

    stream
      .pipe(csv())
      .on('data', (data) => {
        lineNumber++;
        
        // Validate required fields
        const rowErrors = [];
        
        if (!data.firstName || data.firstName.trim() === '') {
          rowErrors.push('First name is required');
        }
        
        if (!data.lastName || data.lastName.trim() === '') {
          rowErrors.push('Last name is required');
        }
        
        if (!data.email || data.email.trim() === '') {
          rowErrors.push('Email is required');
        } else {
          // Basic email validation
          const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
          if (!emailRegex.test(data.email.trim())) {
            rowErrors.push('Invalid email format');
          }
        }
        
        if (rowErrors.length > 0) {
          errors.push({
            line: lineNumber,
            errors: rowErrors,
            data,
          });
        } else {
          // Add validated row
          results.push({
            firstName: data.firstName.trim(),
            lastName: data.lastName.trim(),
            email: data.email.trim().toLowerCase(),
            phone: data.phone?.trim() || '',
            address: data.address?.trim() || '',
            city: data.city?.trim() || '',
            state: data.state?.trim() || '',
            country: data.country?.trim() || '',
            postalCode: data.postalCode?.trim() || '',
            dateOfBirth: data.dateOfBirth?.trim() || null,
            nationality: data.nationality?.trim() || '',
            passportNumber: data.passportNumber?.trim() || '',
            passportExpiry: data.passportExpiry?.trim() || null,
            notes: data.notes?.trim() || '',
          });
        }
      })
      .on('end', () => {
        resolve({ results, errors, totalRows: lineNumber - 1 });
      })
      .on('error', (error) => {
        reject(error);
      });
  });
};

/**
 * Import customers from CSV for an agent
 * @param {string} csvData - CSV string data
 * @param {string} agentId - Agent's user ID
 * @param {string} tenantId - Tenant ID
 * @returns {Promise<Object>} Import results
 */
const importCustomersForAgent = async (csvData, agentId, tenantId) => {
  // Parse CSV
  const { results, errors, totalRows } = await parseCustomerCSV(csvData);

  if (results.length === 0) {
    return {
      success: false,
      message: 'No valid rows to import',
      imported: 0,
      failed: errors.length,
      errors,
    };
  }

  // Check for duplicate emails within the CSV
  const emailCounts = {};
  const duplicateEmails = [];
  
  results.forEach((row, index) => {
    const email = row.email;
    if (emailCounts[email]) {
      duplicateEmails.push({
        line: index + 2, // +2 because index starts at 0 and line 1 is header
        error: `Duplicate email in CSV: ${email}`,
        data: row,
      });
    } else {
      emailCounts[email] = true;
    }
  });

  if (duplicateEmails.length > 0) {
    errors.push(...duplicateEmails);
  }

  // Check for existing customers in database
  const emails = results.map((r) => r.email);
  const existingCustomers = await Customer.find({
    email: { $in: emails },
    agentId,
    tenantId,
  }).select('email');

  const existingEmails = new Set(existingCustomers.map((c) => c.email));

  // Filter out existing customers
  const customersToImport = results.filter((row) => {
    if (existingEmails.has(row.email)) {
      errors.push({
        line: results.indexOf(row) + 2,
        error: `Customer with email ${row.email} already exists`,
        data: row,
      });
      return false;
    }
    return true;
  });

  // Import customers
  let imported = 0;
  const importErrors = [];

  if (customersToImport.length > 0) {
    try {
      const customersWithMetadata = customersToImport.map((customer) => ({
        ...customer,
        agentId,
        tenantId,
        createdBy: agentId,
      }));

      const importedCustomers = await Customer.insertMany(customersWithMetadata, {
        ordered: false, // Continue on error
      });

      imported = importedCustomers.length;
    } catch (error) {
      // Handle bulk insert errors
      if (error.writeErrors) {
        error.writeErrors.forEach((writeError) => {
          importErrors.push({
            line: writeError.index + 2,
            error: writeError.errmsg || 'Import failed',
            data: customersToImport[writeError.index],
          });
        });
        // Some might have been inserted
        imported = customersToImport.length - error.writeErrors.length;
      } else {
        throw error;
      }
    }
  }

  return {
    success: imported > 0,
    message: `Imported ${imported} of ${totalRows} customers`,
    imported,
    failed: errors.length + importErrors.length,
    errors: [...errors, ...importErrors],
    totalRows,
  };
};

/**
 * Generate CSV template for customer import
 * @returns {string} CSV template string
 */
const generateCustomerCSVTemplate = () => {
  const headers = [
    'firstName',
    'lastName',
    'email',
    'phone',
    'address',
    'city',
    'state',
    'country',
    'postalCode',
    'dateOfBirth',
    'nationality',
    'passportNumber',
    'passportExpiry',
    'notes',
  ];

  const exampleRow = [
    'John',
    'Doe',
    'john.doe@example.com',
    '+1234567890',
    '123 Main St',
    'New York',
    'NY',
    'USA',
    '10001',
    '1990-01-15',
    'American',
    'P123456789',
    '2030-12-31',
    'VIP customer',
  ];

  return `${headers.join(',')}\n${exampleRow.join(',')}`;
};

module.exports = {
  parseCustomerCSV,
  importCustomersForAgent,
  generateCustomerCSVTemplate,
};

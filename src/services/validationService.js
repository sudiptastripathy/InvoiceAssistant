// src/services/validationService.js

/**
 * VALIDATE (Rule-Based Function)
 * Applies deterministic validation rules to extracted data
 * No LLM - pure JavaScript logic
 */

export function validateDocumentData(extractedData) {
  const validationResults = {};
  
  // Validate vendor_name
  validationResults.vendor_name = validateVendorName(extractedData.vendor_name);
  
  // Validate reference_number (and map to UI field names)
  const refNumber = extractedData.reference_number || extractedData.invoice_number;
  validationResults.reference_number = validateReferenceNumber(refNumber);
  validationResults.invoice_number = validationResults.reference_number; // Map for UI
  
  // Validate dates
  const transDate = extractedData.transaction_date || extractedData.invoice_date;
  validationResults.transaction_date = validateDate(transDate, 'transaction_date');
  validationResults.invoice_date = validationResults.transaction_date; // Map for UI
  
  // Validate payment_due_date (optional)
  const dueDate = extractedData.payment_due_date || extractedData.due_date;
  if (dueDate) {
    validationResults.payment_due_date = validateDueDate(transDate, dueDate);
    validationResults.due_date = validationResults.payment_due_date; // Map for UI
  }
  
  // Validate amount
  const amount = extractedData.total_amount || extractedData.amount_due;
  validationResults.total_amount = validateAmount(amount, extractedData.line_items);
  validationResults.amount_due = validationResults.total_amount; // Map for UI
  
  // Validate currency
  validationResults.currency = validateCurrency(extractedData.currency);
  
  // Optional fields
  if (extractedData.customer_name) {
    validationResults.customer_name = validateCustomerName(extractedData.customer_name);
  }
  
  return validationResults;
}

/**
 * Validate vendor name is present and reasonable
 */
function validateVendorName(vendorName) {
  if (!vendorName) {
    return {
      value: vendorName,
      valid: false,
      error: 'Vendor name is required'
    };
  }
  
  // Convert to string if needed
  const vendorStr = typeof vendorName === 'string' ? vendorName : String(vendorName);
  
  if (vendorStr.trim().length === 0) {
    return {
      value: vendorName,
      valid: false,
      error: 'Vendor name is required'
    };
  }
  
  if (vendorStr.length < 2) {
    return {
      value: vendorName,
      valid: false,
      error: 'Vendor name too short'
    };
  }
  
  return {
    value: vendorStr,
    valid: true
  };
}

/**
 * Validate reference number is present
 */
function validateReferenceNumber(referenceNumber) {
  if (!referenceNumber || (typeof referenceNumber === 'string' && referenceNumber.trim().length === 0)) {
    return {
      value: referenceNumber,
      valid: false,
      error: 'Reference number is required'
    };
  }
  
  // Convert to string if it's a number
  const refStr = typeof referenceNumber === 'number' ? referenceNumber.toString() : referenceNumber;
  
  return {
    value: refStr,
    valid: true
  };
}

/**
 * Validate date format (YYYY-MM-DD)
 */
function validateDate(dateString, fieldName) {
  if (!dateString) {
    return {
      value: dateString,
      valid: false,
      error: `${fieldName} is required`
    };
  }
  
  // Check format
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateString)) {
    return {
      value: dateString,
      valid: false,
      error: `${fieldName} must be in YYYY-MM-DD format`
    };
  }
  
  // Check if valid date
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    return {
      value: dateString,
      valid: false,
      error: `${fieldName} is not a valid date`
    };
  }
  
  // Check if date is reasonable (not too far in past/future)
  const now = new Date();
  const fiveYearsAgo = new Date(now.getFullYear() - 5, now.getMonth(), now.getDate());
  const twoYearsFromNow = new Date(now.getFullYear() + 2, now.getMonth(), now.getDate());
  
  if (date < fiveYearsAgo || date > twoYearsFromNow) {
    return {
      value: dateString,
      valid: true,
      warning: `${fieldName} is outside typical range (5 years ago to 2 years from now)`
    };
  }
  
  return {
    value: dateString,
    valid: true
  };
}

/**
 * Validate due date is after invoice date
 */
function validateDueDate(invoiceDate, dueDate) {
  const dueDateValidation = validateDate(dueDate, 'due_date');
  
  if (!dueDateValidation.valid) {
    return dueDateValidation;
  }
  
  if (!invoiceDate) {
    return {
      value: dueDate,
      valid: true,
      warning: 'Cannot verify due date without invoice date'
    };
  }
  
  const invDate = new Date(invoiceDate);
  const dDate = new Date(dueDate);
  
  if (dDate < invDate) {
    return {
      value: dueDate,
      valid: false,
      error: 'Due date must be on or after invoice date'
    };
  }
  
  return {
    value: dueDate,
    valid: true
  };
}

/**
 * Validate amount format and optionally check against line items
 */
function validateAmount(amount, lineItems = []) {
  if (!amount && amount !== 0) {
    return {
      value: amount,
      valid: false,
      error: 'Amount is required'
    };
  }
  
  // Convert to string if it's a number
  const amountStr = typeof amount === 'number' ? amount.toString() : amount;
  
  // Remove common currency formatting
  const cleanAmount = amountStr.replace(/[,$\s]/g, '');
  
  // Check if numeric
  const numericAmount = parseFloat(cleanAmount);
  if (isNaN(numericAmount)) {
    return {
      value: amount,
      valid: false,
      error: 'Amount must be a valid number'
    };
  }
  
  // Check if positive
  if (numericAmount <= 0) {
    return {
      value: amount,
      valid: false,
      error: 'Amount must be positive'
    };
  }
  
  // Check against line items if available
  if (lineItems && lineItems.length > 0) {
    const lineItemTotal = lineItems.reduce((sum, item) => {
      // Handle both number and string amounts
      const itemAmountStr = typeof item.amount === 'number' ? item.amount.toString() : (item.amount || '0');
      const itemAmount = parseFloat(itemAmountStr.replace(/[,$\s]/g, '') || 0);
      return sum + itemAmount;
    }, 0);
    
    // Allow 1% tolerance for rounding
    const tolerance = Math.max(0.01, numericAmount * 0.01);
    const difference = Math.abs(numericAmount - lineItemTotal);
    
    if (difference > tolerance) {
      return {
        value: amount,
        valid: true,
        warning: `Line items sum to ${lineItemTotal.toFixed(2)}, but total is ${numericAmount.toFixed(2)} (difference: ${difference.toFixed(2)})`
      };
    }
  }
  
  return {
    value: amount,
    valid: true,
    numericValue: numericAmount
  };
}

/**
 * Validate currency code
 */
function validateCurrency(currency) {
  if (!currency) {
    return {
      value: 'USD', // Default assumption
      valid: true,
      warning: 'Currency not specified, assuming USD'
    };
  }
  
  // Convert to string if needed
  const currencyStr = typeof currency === 'string' ? currency : String(currency);
  
  const validCurrencies = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'CNY', 'INR'];
  
  if (!validCurrencies.includes(currencyStr.toUpperCase())) {
    return {
      value: currencyStr,
      valid: true,
      warning: `Unusual currency code: ${currencyStr}`
    };
  }
  
  return {
    value: currencyStr.toUpperCase(),
    valid: true
  };
}

/**
 * Validate custome) {
    return {
      value: customerName,
      valid: true,
      warning: 'Customer name is empty'
    };
  }
  
  // Convert to string if needed
  const nameStr = typeof customerName === 'string' ? customerName : String(customerName);
  
  if (nameStr.trim().length === 0) {
    return {
      value: customerName,
      valid: true,
      warning: 'Customer name is empty'
    };
  }
  
  return {
    value: nameStr
  
  return {
    value: customerName,
    valid: true
  };
}

/**
 * Get summary of validation results
 */
export function getValidationSummary(validationResults) {
  let totalFields = 0;
  let validFields = 0;
  let fieldsWithWarnings = 0;
  let fieldsWithErrors = 0;
  
  Object.entries(validationResults).forEach(([field, result]) => {
    totalFields++;
    if (result.valid) validFields++;
    if (result.warning) fieldsWithWarnings++;
    if (result.error) fieldsWithErrors++;
  });
  
  return {
    total: totalFields,
    valid: validFields,
    warnings: fieldsWithWarnings,
    errors: fieldsWithErrors,
    allValid: fieldsWithErrors === 0
  };
}

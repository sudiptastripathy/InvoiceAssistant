// src/services/claudeService.js
import { logger } from './logger.js';

/**
 * EXTRACT AGENT
 * Uses Claude Sonnet for multimodal document extraction via Netlify Function
 * Returns raw extracted fields without validation
 */
export async function extractDocumentData(imageBase64) {
  try {
    const response = await fetch('/.netlify/functions/claude-extract', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ imageBase64 }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'Extraction failed');
    }

    const extractedData = result.data;
    
    // Log what was extracted
    logger.info('Data extracted successfully', {
      documentType: extractedData.document_type,
      extractionQuality: extractedData.extraction_quality,
      paymentStatus: extractedData.payment_status,
      hasVendor: !!extractedData.vendor_name,
      hasAmount: !!extractedData.total_amount
    });
    
    return {
      success: true,
      data: extractedData,
      cost: {
        input_tokens: result.usage.inputTokens,
        output_tokens: result.usage.outputTokens,
        total_cost: result.usage.cost,
        breakdown: {
          input: result.usage.cost * (result.usage.inputTokens / (result.usage.inputTokens + result.usage.outputTokens)),
          output: result.usage.cost * (result.usage.outputTokens / (result.usage.inputTokens + result.usage.outputTokens))
        }
      },
      usage: result.usage // Include full usage info for cost tracking
    };

  } catch (error) {
    logger.error('Document extraction failed', error, {
      step: 'extract',
      hasImage: !!imageBase64,
      imageSize: imageBase64?.length
    });
    
    return {
      success: false,
      error: error.message || 'Failed to extract document data',
      errorType: error.type || 'extraction_error',
      data: null
    };
  }
}

STEP 1: Identify the document type first by analyzing the content and structure.

STEP 2: Apply document-type-specific extraction rules.

Required fields:
- vendor_name: Business/company name that provided goods or services
- reference_number: Primary document identifier (see document-specific rules below)
- transaction_date: Primary date on document - when issued, purchased, or billed (YYYY-MM-DD format)
- total_amount: Final amount - whether paid, due, or charged (numeric only, no currency symbols)
- currency: Currency code (USD, EUR, etc.) - default USD if not specified

Optional fields:
- payment_due_date: Only if explicitly shown and payment is still owed (YYYY-MM-DD format)
- customer_name: Name of payer/customer/patient/account holder
- customer_address: Billing or service address
- line_items: Array of items with description and amount - extract ALL visible line items

DOCUMENT-TYPE-SPECIFIC EXTRACTION RULES:

RETAIL RECEIPTS (completed purchases at stores/online):
  - Indicators: Shows "RECEIPT", "PAID", "APPROVED", payment method (Visa/MC), or transaction timestamp
  - reference_number priority: (1) "Order #" or "Order Number", (2) "Receipt #", (3) "Transaction ID" or "Trans ID", (4) Long alphanumeric codes near order/receipt labels
  - IGNORE: "Invoice No" (often internal tracking), Member IDs, Profile numbers, Seat numbers
  - document_type: "receipt"
  - payment_status: "paid"

INVOICES (payment requested, not yet paid):
  - Indicators: Shows "INVOICE" header, "Amount Due", "Payment Due Date", "Please Pay"
  - reference_number priority: (1) "Invoice #" or "Invoice Number" or "Invoice No", (2) "Reference #"
  - document_type: "invoice"
  - payment_status: "unpaid"

UTILITY/SERVICE BILLS (recurring charges):
  - Indicators: Electric/gas/water/phone company, "Account Number", service period
  - reference_number priority: (1) "Account #" or "Account Number", (2) "Bill #" or "Statement #"
  - document_type: "bill"
  - payment_status: "unpaid" unless shows "PAID" stamp

MEDICAL/HEALTHCARE DOCUMENTS:
  - Indicators: Hospital/clinic/pharmacy, patient info, procedure codes, insurance details
  - reference_number priority: (1) "Account #" or "Patient Account", (2) "Statement #", (3) "Visit #"
  - IGNORE: NPI numbers, Provider IDs, Member IDs
  - document_type: "bill"

STATEMENTS (account summaries):
  - Indicators: Shows balance, previous charges, "Statement Date", "Account Summary"
  - reference_number priority: (1) "Statement #", (2) "Account #"
  - document_type: "statement"

ORDER CONFIRMATIONS:
  - Indicators: "Order Confirmed", "Confirmation #", usually sent after online purchase
  - reference_number priority: (1) "Order #" or "Confirmation #", (2) "Reference #"
  - document_type: "order_confirmation"
  - payment_status: "paid" (if payment processed) or "unpaid" (if pending)

GENERAL RULES:
- Look for labels like "#", "No.", "Number", "ID" near reference numbers
- Prefer longer alphanumeric codes (6+ characters) over short numeric sequences
- ALWAYS ignore: Member IDs, Loyalty numbers, Customer IDs (unless no other reference exists)
- When multiple reference numbers exist, choose the most prominent/important one based on document type

Line item format:
{
  "description": "item or service description",
  "quantity": number or null,
  "unit_price": numeric string or null,
  "amount": numeric string (required)
}

Metadata:
- extraction_quality: "high" (clear, legible), "medium" (some ambiguity), "low" (significant quality issues)
- document_type: "invoice" | "receipt" | "bill" | "statement" | "order_confirmation" | "unknown"
- payment_status: "paid" | "unpaid" | "unknown"
- missing_fields: Array of required field names that could not be extracted

Return ONLY valid JSON:
{
  "vendor_name": "value or null",
  "reference_number": "value or null",
  "transaction_date": "YYYY-MM-DD or null",
  "payment_due_date": "YYYY-MM-DD or null",
  "total_amount": "numeric string or null",
  "currency": "USD",
  "customer_name": "value or null",
  "customer_address": "value or null",
  "line_items": [],
  "extraction_quality": "high|medium|low",
  "document_type": "invoice|receipt|bill|statement|order_confirmation|unknown",
  "payment_status": "paid|unpaid|unknown",
  "missing_fields": []
}

Return ONLY the JSON object, no markdown formatting or explanation.`
            }
          ]
        }
      ]
    });

    // Extract JSON from response
    const responseText = message.content[0].text;
    
    // Log the raw response for debugging
    logger.info('Claude response received', {
      responseLength: responseText.length,
      responsePreview: responseText.substring(0, 200)
    });
    
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      logger.error('Failed to extract JSON from Claude response', new Error('No JSON found'), {
        responseText: responseText
      });
      throw new Error('Failed to extract JSON from response');
    }

    const extractedData = JSON.parse(jsonMatch[0]);
    
    // Log what was extracted
    logger.info('Data extracted successfully', {
      documentType: extractedData.document_type,
      extractionQuality: extractedData.extraction_quality,
      paymentStatus: extractedData.payment_status,
      hasVendor: !!extractedData.vendor_name,
      hasAmount: !!extractedData.total_amount
    });
    
    // Log the full extracted data for debugging
    console.log('FULL EXTRACTED DATA:', JSON.stringify(extractedData, null, 2));
    
    return {
      success: true,
      data: extractedData,
      cost: calculateCost('sonnet', message.usage)
    };

  } catch (error) {
    logger.error('Document extraction failed', error, {
      step: 'extract',
      hasImage: !!imageBase64,
      imageSize: imageBase64?.length
    });
    
    return {
      success: false,
      error: error.message || 'Failed to extract document data',
      errorType: error.type || 'extraction_error',
      data: null
    };
  }
}

/**
 * SCORE AGENT
 * Uses Claude Haiku to generate confidence scores and reasoning via Netlify Function
 * Analyzes extraction quality and validation results
 */
export async function scoreExtractedData(extractedData, validationResults) {
  try {
    const response = await fetch('/.netlify/functions/claude-score', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ extractedData, validationResults }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'Scoring failed');
    }

    const scores = result.data.field_scores;
    
    // Map scores to UI field names as well
    const mappedScores = {
      ...scores,
      invoice_number: scores.reference_number || scores.invoice_number,
      invoice_date: scores.transaction_date || scores.invoice_date,
      amount_due: scores.total_amount || scores.amount_due,
      due_date: scores.payment_due_date || scores.due_date
    };
    
    return {
      success: true,
      scores: mappedScores,
      cost: {
        input_tokens: result.usage.inputTokens,
        output_tokens: result.usage.outputTokens,
        total_cost: result.usage.cost,
        breakdown: {
          input: result.usage.cost * (result.usage.inputTokens / (result.usage.inputTokens + result.usage.outputTokens)),
          output: result.usage.cost * (result.usage.outputTokens / (result.usage.inputTokens + result.usage.outputTokens))
        }
      },
      usage: result.usage
    };

  } catch (error) {
    console.error('Score agent error:', error);
    return {
      success: false,
      error: error.message,
      scores: null
    };
  }
}

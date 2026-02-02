// netlify/functions/claude-extract.js
import Anthropic from '@anthropic-ai/sdk';

// Daily cost limit in dollars
const DAILY_COST_LIMIT = 1.0;

// In-memory cost tracking (resets when function cold starts)
// For production, consider using Redis or Netlify Blobs for persistent storage
let dailyCostTracker = {
  date: new Date().toISOString().split('T')[0],
  totalCost: 0
};

// Reset tracker if it's a new day
function checkAndResetDailyLimit() {
  const today = new Date().toISOString().split('T')[0];
  if (dailyCostTracker.date !== today) {
    dailyCostTracker = {
      date: today,
      totalCost: 0
    };
  }
}

// Calculate cost for Claude API usage
function calculateCost(inputTokens, outputTokens, model) {
  // Pricing for claude-sonnet-4 (as of Feb 2025)
  // Input: $3.00 per million tokens
  // Output: $15.00 per million tokens
  const inputCostPer1M = 3.00;
  const outputCostPer1M = 15.00;
  
  const inputCost = (inputTokens / 1000000) * inputCostPer1M;
  const outputCost = (outputTokens / 1000000) * outputCostPer1M;
  
  return inputCost + outputCost;
}

export default async function handler(event, context) {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  // Check daily cost limit
  checkAndResetDailyLimit();
  
  if (dailyCostTracker.totalCost >= DAILY_COST_LIMIT) {
    return {
      statusCode: 429,
      body: JSON.stringify({
        error: 'Daily API cost limit reached',
        message: `Daily limit of $${DAILY_COST_LIMIT} has been reached. Please try again tomorrow.`,
        errorType: 'rate_limit_error',
        dailyLimit: DAILY_COST_LIMIT,
        currentUsage: dailyCostTracker.totalCost
      })
    };
  }

  try {
    const { imageBase64 } = JSON.parse(event.body);

    if (!imageBase64) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing imageBase64 in request body' })
      };
    }

    // Initialize Anthropic client with API key from environment variable
    const client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    });

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: 'image/jpeg',
                data: imageBase64,
              },
            },
            {
              type: 'text',
              text: `You are a financial document data extraction assistant. Extract payment-relevant information from invoices, receipts, bills, and statements.

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
  "unit_price": number or null,
  "amount": number
}

Return ONLY valid JSON with this structure:
{
  "vendor_name": "...",
  "reference_number": "...",
  "transaction_date": "YYYY-MM-DD",
  "total_amount": number,
  "currency": "USD",
  "payment_due_date": "YYYY-MM-DD" or null,
  "customer_name": "..." or null,
  "customer_address": "..." or null,
  "document_type": "receipt|invoice|bill|statement|order_confirmation",
  "payment_status": "paid|unpaid",
  "line_items": [...]
}`,
            },
          ],
        },
      ],
    });

    // Calculate cost
    const inputTokens = message.usage.input_tokens;
    const outputTokens = message.usage.output_tokens;
    const cost = calculateCost(inputTokens, outputTokens, 'claude-sonnet-4');

    // Update daily cost tracker
    dailyCostTracker.totalCost += cost;

    // Parse the extracted data
    const extractedText = message.content[0].text;
    const extractedData = JSON.parse(extractedText);

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        data: extractedData,
        usage: {
          inputTokens,
          outputTokens,
          cost,
          dailyTotal: dailyCostTracker.totalCost,
          dailyLimit: DAILY_COST_LIMIT,
          remainingBudget: Math.max(0, DAILY_COST_LIMIT - dailyCostTracker.totalCost)
        }
      })
    };

  } catch (error) {
    console.error('Error in claude-extract function:', error);

    // Handle specific Anthropic API errors
    if (error.status === 401) {
      return {
        statusCode: 500,
        body: JSON.stringify({
          error: 'API authentication failed',
          errorType: 'authentication_error'
        })
      };
    }

    if (error.status === 429) {
      return {
        statusCode: 429,
        body: JSON.stringify({
          error: 'API rate limit exceeded',
          errorType: 'rate_limit_error'
        })
      };
    }

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: error.message || 'Internal server error',
        errorType: 'server_error'
      })
    };
  }
}

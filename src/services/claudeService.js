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

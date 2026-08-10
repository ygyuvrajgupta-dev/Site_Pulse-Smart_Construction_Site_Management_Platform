import prisma from "../../config/db.js";
import { AppError } from "../../middleware/errorHandler.js";
import { generateCompletion } from "./ai.provider.js";
import { recordAiUsage, checkAiQuota, getOrCreateAiFeature } from "./ai.usage.service.js";

/**
 * AI OCR (Optical Character Recognition) Service.
 * Extracts text and structured data from uploaded documents.
 * Uses AI vision capabilities to process images, PDFs, and other documents.
 */

/**
 * Process a document for OCR.
 * @param {Object} params
 * @param {string} params.companyId - Company ID.
 * @param {string} [params.userId] - User ID.
 * @param {string} [params.documentId] - Related document ID.
 * @param {string} params.fileName - Original file name.
 * @param {string} [params.mimeType] - File MIME type.
 * @param {number} [params.fileSize] - File size in bytes.
 * @param {string} [params.fileUrl] - URL to the file content.
 * @param {string} [params.base64Content] - Base64-encoded file content.
 * @param {Object} [params.options] - AI options.
 * @returns {Promise<Object>} The OCR result.
 */
export async function processOcr({
  companyId,
  userId,
  documentId,
  fileName,
  mimeType,
  fileSize,
  fileUrl,
  base64Content,
  options = {},
}) {
  // Check quota
  const quota = await checkAiQuota(companyId, "ocr");
  if (!quota.allowed) {
    throw new AppError("AI OCR quota exceeded. Please upgrade your plan or contact admin.", 429);
  }

  // Create OCR record (initial state)
  const ocrDoc = await prisma.aiOcrDocument.create({
    data: {
      companyId,
      userId,
      documentId,
      fileName,
      mimeType,
      fileSize,
      status: "PROCESSING",
    },
  });

  // Get or create AI feature for tracking
  const feature = await getOrCreateAiFeature(companyId, "ocr", {
    provider: options.provider || "OPENAI",
    modelName: options.model,
  });

  try {
    // Build the prompt with file content
    const contentSource = base64Content
      ? `[Base64 content provided inline]`
      : fileUrl
      ? `[File available at: ${fileUrl}]`
      : `[No file content provided]`;

    const systemPrompt = `You are an OCR (Optical Character Recognition) engine. Extract all text from the provided document and return it in a structured format. Also identify the document type (invoice, contract, report, etc.) and extract key fields when possible.`;

    const userPrompt = `
Document Information:
- File Name: ${fileName}
- MIME Type: ${mimeType || "unknown"}
- File Size: ${fileSize || "unknown"} bytes
- Content: ${contentSource}

Please:
1. Extract all text from the document
2. Identify the document type
3. Extract key structured data (dates, amounts, names, IDs, etc.)
4. Provide a confidence score (0-1)

Return the result as JSON with this structure:
{
  "extractedText": "full extracted text",
  "documentType": "INVOICE|CONTRACT|REPORT|RECEIPT|OTHER",
  "structuredData": { "key": "value" },
  "confidence": 0.95,
  "language": "en"
}
`;

    const result = await generateCompletion({
      prompt: userPrompt,
      system: systemPrompt,
      provider: options.provider,
      model: options.model,
      maxTokens: options.maxTokens || 3000,
      temperature: 0.1,
    });

    // Parse the JSON response
    let parsed;
    try {
      // Try to extract JSON from the response
      const jsonMatch = result.text.match(/\{[\s\S]*\}/);
      parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { extractedText: result.text };
    } catch {
      parsed = { extractedText: result.text };
    }

    // Update OCR record with results
    const updatedOcr = await prisma.aiOcrDocument.update({
      where: { id: ocrDoc.id },
      data: {
        status: "COMPLETED",
        extractedText: parsed.extractedText || result.text,
        structuredData: parsed.structuredData || {},
        confidence: parsed.confidence || 0,
        language: parsed.language || "en",
        processedAt: new Date(),
      },
    });

    // Record usage
    await recordAiUsage({
      companyId,
      userId,
      featureId: feature?.id,
      modelName: result.model,
      prompt: userPrompt,
      response: result.text,
      tokensIn: result.tokensIn,
      tokensOut: result.tokensOut,
      duration: result.durationMs,
      success: true,
    });

    return updatedOcr;
  } catch (error) {
    // Mark OCR as failed
    await prisma.aiOcrDocument.update({
      where: { id: ocrDoc.id },
      data: {
        status: "FAILED",
        error: error.message,
      },
    });

    // Record failed usage
    await recordAiUsage({
      companyId,
      userId,
      featureId: feature?.id,
      modelName: options.model || "unknown",
      prompt: fileName,
      success: false,
    });

    throw error;
  }
}

/**
 * List OCR documents for a company.
 * @param {string} companyId - Company ID.
 * @param {Object} [options]
 * @param {number} [options.page=1] - Page number.
 * @param {number} [options.limit=20] - Items per page.
 * @param {string} [options.status] - Filter by status.
 * @returns {Promise<Object>} Paginated OCR documents.
 */
export async function listOcrDocuments(companyId, { page = 1, limit = 20, status } = {}) {
  const skip = (page - 1) * limit;
  const where = {
    companyId,
    ...(status ? { status } : {}),
  };

  const [total, documents] = await Promise.all([
    prisma.aiOcrDocument.count({ where }),
    prisma.aiOcrDocument.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      select: {
        id: true,
        fileName: true,
        mimeType: true,
        fileSize: true,
        status: true,
        confidence: true,
        language: true,
        createdAt: true,
        processedAt: true,
      },
    }),
  ]);

  return {
    documents,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Get a single OCR document.
 * @param {string} ocrId - OCR document ID.
 * @param {string} companyId - Company ID.
 * @returns {Promise<Object>} The OCR document.
 */
export async function getOcrDocument(ocrId, companyId) {
  const doc = await prisma.aiOcrDocument.findFirst({
    where: { id: ocrId, companyId },
  });

  if (!doc) {
    throw new AppError("OCR document not found", 404);
  }

  return doc;
}

/**
 * Delete an OCR document record.
 * @param {string} ocrId - OCR document ID.
 * @param {string} companyId - Company ID.
 * @returns {Promise<Object>} Deleted record.
 */
export async function deleteOcrDocument(ocrId, companyId) {
  const doc = await prisma.aiOcrDocument.findFirst({
    where: { id: ocrId, companyId },
  });

  if (!doc) {
    throw new AppError("OCR document not found", 404);
  }

  return prisma.aiOcrDocument.delete({ where: { id: ocrId } });
}

export default {
  processOcr,
  listOcrDocuments,
  getOcrDocument,
  deleteOcrDocument,
};
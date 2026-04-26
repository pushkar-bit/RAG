const { retrieveRelevantChunks } = require('../services/retrieval.service');
const { generateGroundedResponse, generateUngroundedResponse } = require('../services/llm.service');
const { extractTextFromImage } = require('../services/ocr.service');
const Feedback = require('../models/Feedback');
const Chunk = require('../models/Chunk');

/**
 * Handles the direct comparison between pipeline constraints.
 * Resolves both RAG and Raw Generative outputs concurrently for deep analysis rendering.
 */
const processComparisonQuery = async (req, res, next) => {
  try {
    let { query } = req.body;
    const imageFile = req.file;

    // 1. If an image is provided, extract text via OCR to use as (or append to) the query
    if (imageFile) {
      console.log(`[Chat Controller] Image payload detected. Routing to OCR pipeline...`);
      const extractedText = await extractTextFromImage(imageFile.buffer);
      if (extractedText) {
        query = query ? `${query}\n\n[Extracted from Image]: ${extractedText}` : extractedText;
      }
    }

    if (!query) {
      return res.status(400).json({ success: false, message: 'Query text or image payload is required.' });
    }

    console.log(`[Chat Controller] Initiating Dual-Comparison Mode mapping for query: "${query}"`);

    // RAG Pipeline execution block
    const ragPipelinePromise = (async () => {
      const retrievalData = await retrieveRelevantChunks(query, 4, 0.10);
      const llmData = await generateGroundedResponse(query, retrievalData.chunks);
      
      return {
        answer: llmData.answer,
        chunks: retrievalData.chunks,
        metadata: retrievalData.metadata,
        isFallback: llmData.isFallback
      };
    })();

    const nonRagPipelinePromise = generateUngroundedResponse(query);
    const [ragPayload, nonRagAnswer] = await Promise.all([ragPipelinePromise, nonRagPipelinePromise]);

    // 3. Calculate System Confidence Score (0-100%)
    // Based on mathematical grounding density: similarity scores + volume of relevant evidence
    let confidence_score = 0;
    if (ragPayload.chunks.length > 0) {
      const avgSimilarity = ragPayload.chunks.reduce((acc, c) => acc + c.score, 0) / ragPayload.chunks.length;
      const coverageBoost = Math.min(ragPayload.chunks.length / 4, 1) * 0.3; // Up to 30% boost for having full context
      const baseConfidence = (avgSimilarity * 0.7) + coverageBoost;
      confidence_score = Math.min(Math.round(baseConfidence * 100), 100);
    }

    const responseData = {
      rag_response: ragPayload.answer,
      non_rag_response: nonRagAnswer,
      confidence_score: confidence_score,
      retrieved_chunks: ragPayload.chunks.map(chunk => ({
        chunkId: chunk.chunkId,
        text: chunk.text,
        documentId: chunk.documentId
      })),
      scores: ragPayload.chunks.map(chunk => ({
        chunkId: chunk.chunkId,
        similarity: chunk.score
      })),
      metadata: ragPayload.metadata
    };

    res.status(200).json({ success: true, data: responseData });
  } catch (error) {
    next(error);
  }
};

/**
 * Processes user feedback to adjust chunk weights for future retrieval improvement
 */
const submitFeedback = async (req, res, next) => {
  try {
    const { query, response, label, retrievedChunks } = req.body;

    if (!query || !label || !retrievedChunks) {
      return res.status(400).json({ success: false, message: 'Missing required feedback fields.' });
    }

    // 1. Log the feedback interaction for audit
    const feedback = new Feedback({ query, response, label, retrievedChunks });
    await feedback.save();

    // 2. Perform weight adjustment on retrieved chunks to influence future rankings
    // Boosting 'correct' chunks and penalizing 'incorrect' ones
    const adjustment = label === 'correct' ? 1 : -1;
    
    // Extract actual MongoDB IDs from retrieved metadata (mapped as chunkId in this system)
    const chunkIds = retrievedChunks.map(c => c.chunkId);
    
    if (chunkIds.length > 0) {
      console.log(`[Chat Controller] Applying feedback adjustment of ${adjustment} to ${chunkIds.length} chunks.`);
      await Chunk.updateMany(
        { _id: { $in: chunkIds } },
        { $inc: { feedbackScore: adjustment } }
      );
    }

    res.status(200).json({ 
      success: true, 
      message: `Feedback recorded. System weights adjusted by ${adjustment}.` 
    });
  } catch (error) {
    console.error(`[Chat Controller] Feedback Loop Failure:`, error.message);
    next(error);
  }
};

module.exports = { processComparisonQuery, submitFeedback };

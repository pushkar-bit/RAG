const { generateEmbeddings } = require('./embedding.service');
const { searchVectors } = require('./vectorStore.service');
const { generateQueryVariations } = require('./llm.service');
const Chunk = require('../models/Chunk');

/**
 * Retrieves the Top-K most relevant document chunks using Multi-Query Retrieval.
 * Generates semantic variations of the query to expand coverage and merge results.
 */
const retrieveRelevantChunks = async (queryText, topK = 4, threshold = 0.10) => {
  try {
    const startObj = Date.now();
    console.log(`[Retrieval Service] Initiating Multi-Query Retrieval for: "${queryText}"`);

    // 1. Generate semantic variations for expanded coverage
    const queries = await generateQueryVariations(queryText);
    
    // 2. Process all queries in parallel for maximum efficiency
    const retrievalPromises = queries.map(async (q) => {
      const embeddings = await generateEmbeddings([q]);
      const queryVector = embeddings[0];
      return searchVectors(queryVector, topK);
    });

    const allRawResults = await Promise.all(retrievalPromises);
    
    // 3. Merge and deduplicate results
    const uniqueMatchesMap = new Map();
    allRawResults.flat().forEach(match => {
      // If we find the same chunk multiple times, we keep the one with the highest score
      if (!uniqueMatchesMap.has(match.id) || uniqueMatchesMap.get(match.id).score < match.score) {
        uniqueMatchesMap.set(match.id, match);
      }
    });

    const dedupedMatches = Array.from(uniqueMatchesMap.values());

    if (dedupedMatches.length === 0) {
      return { chunks: [], metadata: { retrievalTimeMs: Date.now() - startObj } };
    }

    // 4. Apply Feedback-Driven Re-ranking
    const chunkIds = dedupedMatches.map(m => m.id);
    const dbChunks = await Chunk.find({ _id: { $in: chunkIds } }).select('_id feedbackScore');
    const feedbackMap = dbChunks.reduce((acc, c) => {
      acc[c._id.toString()] = c.feedbackScore || 0;
      return acc;
    }, {});

    const rankedMatches = dedupedMatches.map(match => {
      const feedbackWeight = feedbackMap[match.id] || 0;
      // Boost Score based on historical feedback
      const adjustedScore = match.score + (feedbackWeight * 0.05);
      return { ...match, adjustedScore };
    });

    // 5. Final Sort and Threshold Filter
    const finalMatches = rankedMatches
      .sort((a, b) => b.adjustedScore - a.adjustedScore)
      .filter(match => match.adjustedScore >= threshold)
      .slice(0, topK);

    const retrievedContext = finalMatches.map(match => ({
      chunkId: match.id,
      score: match.adjustedScore,
      text: match.metadata?.text || '[Missing Body Context]',
      documentId: match.metadata?.documentId,
      chunkIndex: match.metadata?.chunkIndex
    }));

    console.log(`[Retrieval Service] Multi-Query complete. Merged results from ${queries.length} queries into ${retrievedContext.length} high-quality chunks.`);
    
    return {
      chunks: retrievedContext,
      metadata: {
        retrievalTimeMs: Date.now() - startObj,
        queriesUsed: queries
      }
    };
  } catch (error) {
    console.error(`[Retrieval Service] Multi-Query pipeline failed:`, error.message);
    throw new Error(`Context retrieval crashed: ${error.message}`);
  }
};

module.exports = { retrieveRelevantChunks };

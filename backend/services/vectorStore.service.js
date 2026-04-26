const Chunk = require('../models/Chunk');

/**
 * Calculates cosine similarity between two vectors
 */
const cosineSimilarity = (vecA, vecB) => {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
  let dot = 0, magA = 0, magB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dot += vecA[i] * vecB[i];
    magA += vecA[i] * vecA[i];
    magB += vecB[i] * vecB[i];
  }
  if (magA === 0 || magB === 0) return 0;
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
};

/**
 * Upserts vector embeddings directly into MongoDB Chunk documents.
 * No external vector DB required — embeddings stored inline.
 * @param {Array<{ id: string, values: number[], metadata: object }>} vectors
 */
const upsertVectors = async (vectors) => {
  try {
    console.log(`[Vector Store] Saving ${vectors.length} embeddings to MongoDB...`);

    const bulkOps = vectors.map(({ id, values }) => ({
      updateOne: {
        filter: { _id: id },
        update: { $set: { embedding: values } },
      },
    }));

    if (bulkOps.length > 0) {
      await Chunk.bulkWrite(bulkOps);
    }

    console.log(`[Vector Store] Successfully stored ${vectors.length} embeddings in MongoDB.`);
  } catch (error) {
    console.error(`[Vector Store] Upsert Failed: ${error.message}`);
    throw new Error(`Vector upsert failed: ${error.message}`);
  }
};

/**
 * Performs in-memory cosine similarity search across all chunks in MongoDB.
 * Returns top-K matches above optional threshold.
 *
 * @param {number[]} queryVector - The query embedding vector
 * @param {number} topK - Max number of results to return
 * @returns {Promise<Array<{ id: string, score: number, metadata: object }>>}
 */
const searchVectors = async (queryVector, topK = 4) => {
  try {
    console.log(`[Vector Store] Running cosine similarity search across MongoDB chunks...`);

    // Fetch all chunks that have embeddings
    const chunks = await Chunk.find({ embedding: { $exists: true, $ne: null } })
      .select('_id embedding text documentId chunkIndex')
      .lean();

    if (chunks.length === 0) {
      console.warn('[Vector Store] No embedded chunks found in MongoDB.');
      return [];
    }

    // Score each chunk
    const scored = chunks.map(chunk => ({
      id: chunk._id.toString(),
      score: cosineSimilarity(queryVector, chunk.embedding),
      metadata: {
        text: chunk.text,
        documentId: chunk.documentId?.toString(),
        chunkIndex: chunk.chunkIndex,
      },
    }));

    // Sort descending and take topK
    const topMatches = scored
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);

    console.log(`[Vector Store] Found ${topMatches.length} matches. Top score: ${topMatches[0]?.score?.toFixed(4)}`);
    return topMatches;
  } catch (error) {
    console.error(`[Vector Store] Search Failed: ${error.message}`);
    throw new Error(`Vector search failed: ${error.message}`);
  }
};

module.exports = { upsertVectors, searchVectors };

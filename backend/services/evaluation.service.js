const { generateEmbeddings } = require('./embedding.service');
const { retrieveRelevantChunks } = require('./retrieval.service');
const { generateGroundedResponse, generateUngroundedResponse } = require('./llm.service');

/**
 * Calculates cosine similarity between two vectors
 */
const cosineSimilarity = (vecA, vecB) => {
  const dotProduct = vecA.reduce((sum, val, i) => sum + val * vecB[i], 0);
  const magA = Math.sqrt(vecA.reduce((sum, val) => sum + val * val, 0));
  const magB = Math.sqrt(vecB.reduce((sum, val) => sum + val * val, 0));
  if (magA === 0 || magB === 0) return 0;
  return dotProduct / (magA * magB);
};

/**
 * Calculates a partial correctness score based on word overlap
 */
const calculatePartialScore = (actual, expected) => {
  const actualWords = new Set(actual.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/));
  const expectedWords = new Set(expected.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/));
  
  if (expectedWords.size === 0) return 0;
  
  let overlap = 0;
  expectedWords.forEach(word => {
    if (actualWords.has(word)) overlap++;
  });
  
  return overlap / expectedWords.size;
};

/**
 * Evaluates a single response against an expected answer
 */
const evaluateResponse = async (actual, expected) => {
  if (!actual || !expected) {
    return {
      semantic_similarity: 0,
      exact_match: 0,
      partial_score: 0,
      overall_score: 0
    };
  }

  // 1. Semantic Similarity
  let semantic_similarity = 0;
  try {
    const [actualVec, expectedVec] = await generateEmbeddings([actual, expected]);
    semantic_similarity = cosineSimilarity(actualVec, expectedVec);
  } catch (error) {
    console.error("[Evaluation Service] Embedding failure:", error.message);
  }

  // 2. Exact Match
  const exact_match = actual.toLowerCase().trim() === expected.toLowerCase().trim() ? 1 : 0;

  // 3. Partial Correctness
  const partial_score = calculatePartialScore(actual, expected);

  // 4. Overall Accuracy (Weighted)
  const overall_score = (semantic_similarity * 0.7) + (partial_score * 0.2) + (exact_match * 0.1);

  return {
    semantic_similarity: parseFloat(semantic_similarity.toFixed(4)),
    exact_match,
    partial_score: parseFloat(partial_score.toFixed(4)),
    overall_score: parseFloat(overall_score.toFixed(4))
  };
};

/**
 * Runs full evaluation dataset
 */
const runEvaluation = async (testCases) => {
  const results = [];
  
  for (const testCase of testCases) {
    const { question, expected_answer } = testCase;
    
    console.log(`[Evaluation Service] Processing evaluation for query: "${question}"`);

    // 1. Generate RAG Response (Utilizing the now enhanced Multi-Query retrieval)
    const { chunks } = await retrieveRelevantChunks(question);
    const ragResult = await generateGroundedResponse(question, chunks);
    const rag_response = ragResult.answer;
    const rag_scores = await evaluateResponse(rag_response, expected_answer);

    // 2. Generate Non-RAG Response (Baseline)
    const non_rag_response = await generateUngroundedResponse(question);
    const non_rag_scores = await evaluateResponse(non_rag_response, expected_answer);

    results.push({
      question,
      expected_answer,
      rag_response,
      non_rag_response,
      // Mapping to requested format: 'scores' representing the RAG performance
      scores: rag_scores,
      // Keeping Non-RAG scores for comparison logic
      non_rag_scores: non_rag_scores
    });
  }

  // Compute Aggregated Metrics
  const aggregate = (key, type) => {
    const values = results.map(r => r[type === 'rag' ? 'scores' : 'non_rag_scores'][key]);
    return values.reduce((a, b) => a + b, 0) / values.length;
  };

  const aggregated_metrics = {
    rag: {
      overall_accuracy_percent: parseFloat((aggregate('overall_score', 'rag') * 100).toFixed(2)),
      avg_overall_score: aggregate('overall_score', 'rag'),
      average_semantic_similarity: parseFloat(aggregate('semantic_similarity', 'rag').toFixed(4)),
      exact_match_rate: parseFloat(aggregate('exact_match', 'rag').toFixed(4))
    },
    non_rag: {
      overall_accuracy_percent: parseFloat((aggregate('overall_score', 'non_rag') * 100).toFixed(2)),
      avg_overall_score: aggregate('overall_score', 'non_rag'),
      average_semantic_similarity: parseFloat(aggregate('semantic_similarity', 'non_rag').toFixed(4)),
      exact_match_rate: parseFloat(aggregate('exact_match', 'non_rag').toFixed(4))
    }
  };

  return {
    timestamp: new Date().toISOString(),
    total_queries: testCases.length,
    results,
    aggregated_metrics
  };
};

module.exports = { runEvaluation };

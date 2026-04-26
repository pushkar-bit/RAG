const { runEvaluation } = require('../services/evaluation.service');
const Evaluation = require('../models/Evaluation');

/**
 * Handles the evaluation request and persists results
 */
const evaluateDataset = async (req, res, next) => {
  try {
    const { testCases, documentSet = 'Default' } = req.body;

    if (!testCases || !Array.isArray(testCases) || testCases.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: "Invalid input. 'testCases' must be a non-empty array of objects with 'question' and 'expected_answer'." 
      });
    }

    console.log(`[Evaluation Controller] Starting evaluation for ${testCases.length} queries...`);
    const evaluationResults = await runEvaluation(testCases);
    
    // Persist to Database for Monitoring Dashboard
    // Maps from evaluation service output format → Mongoose schema fields
    const ragMetrics = evaluationResults.aggregated_metrics.rag;
    const nonRagMetrics = evaluationResults.aggregated_metrics.non_rag;

    const savedEvaluation = new Evaluation({
      totalQueries: evaluationResults.total_queries,
      aggregatedMetrics: {
        rag: {
          avgSemanticSimilarity: ragMetrics.average_semantic_similarity,
          avgOverallScore: ragMetrics.overall_accuracy_percent / 100, // Store as 0-1 for consistency
          exactMatchRate: ragMetrics.exact_match_rate
        },
        nonRag: {
          avgSemanticSimilarity: nonRagMetrics.average_semantic_similarity,
          avgOverallScore: nonRagMetrics.overall_accuracy_percent / 100,
          exactMatchRate: nonRagMetrics.exact_match_rate
        }
      },
      results: evaluationResults.results.map(r => ({
        question: r.question,
        expectedAnswer: r.expected_answer,
        ragResponse: r.rag_response,
        nonRagResponse: r.non_rag_response,
        ragScores: {
          semanticSimilarity: r.scores.semantic_similarity,
          exactMatch: r.scores.exact_match,
          partialScore: r.scores.partial_score,
          overallScore: r.scores.overall_score
        },
        nonRagScores: {
          semanticSimilarity: r.non_rag_scores.semantic_similarity,
          exactMatch: r.non_rag_scores.exact_match,
          partialScore: r.non_rag_scores.partial_score,
          overallScore: r.non_rag_scores.overall_score
        }
      })),
      documentSet
    });

    await savedEvaluation.save();
    console.log(`[Evaluation Controller] Evaluation persisted to DB: ${savedEvaluation._id}`);

    res.status(200).json({
      success: true,
      data: evaluationResults
    });
  } catch (error) {
    console.error("[Evaluation Controller] Pipeline Failure:", error.message);
    next(error);
  }
};

/**
 * Retrieves historical evaluation results for the Metrics Dashboard
 */
const getEvaluationHistory = async (req, res, next) => {
  try {
    const history = await Evaluation.find().sort({ timestamp: -1 }).limit(20);
    res.status(200).json({
      success: true,
      data: history
    });
  } catch (error) {
    console.error("[Evaluation Controller] History Fetch Failure:", error.message);
    next(error);
  }
};

module.exports = { evaluateDataset, getEvaluationHistory };

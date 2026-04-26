const mongoose = require('mongoose');

const EvaluationSchema = new mongoose.Schema({
  timestamp: {
    type: Date,
    default: Date.now
  },
  totalQueries: {
    type: Number,
    required: true
  },
  aggregatedMetrics: {
    rag: {
      avgSemanticSimilarity: Number,
      avgOverallScore: Number,
      exactMatchRate: Number
    },
    nonRag: {
      avgSemanticSimilarity: Number,
      avgOverallScore: Number,
      exactMatchRate: Number
    }
  },
  results: [
    {
      question: String,
      expectedAnswer: String,
      ragResponse: String,
      nonRagResponse: String,
      ragScores: {
        semanticSimilarity: Number,
        exactMatch: Number,
        partialScore: Number,
        overallScore: Number
      },
      nonRagScores: {
        semanticSimilarity: Number,
        exactMatch: Number,
        partialScore: Number,
        overallScore: Number
      }
    }
  ],
  documentSet: {
    type: String,
    default: 'Default'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Evaluation', EvaluationSchema);

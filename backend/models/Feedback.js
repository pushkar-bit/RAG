const mongoose = require('mongoose');

const FeedbackSchema = new mongoose.Schema({
  query: { type: String, required: true },
  response: { type: String, required: true },
  label: { type: String, enum: ['correct', 'incorrect'], required: true },
  retrievedChunks: [
    {
      chunkId: { type: String },
      text: { type: String },
      documentId: { type: String }
    }
  ],
  timestamp: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Feedback', FeedbackSchema);

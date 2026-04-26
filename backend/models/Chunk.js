const mongoose = require('mongoose');

const chunkSchema = new mongoose.Schema({
  documentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Document', required: true },
  chunkIndex: { type: Number, required: true },
  text: { type: String, required: true },
  vectorId: { type: String, default: null },
  // Embedding stored inline in MongoDB (replaces Pinecone)
  embedding: { type: [Number], default: null },
  feedbackScore: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Chunk', chunkSchema);

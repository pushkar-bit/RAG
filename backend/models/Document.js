const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  fileName: { type: String, required: true },
  originalName: { type: String, required: true },
  mimeType: { type: String, required: true },
  status: { type: String, enum: ['Processing', 'Completed', 'Failed'], default: 'Processing' },
}, { timestamps: true });

module.exports = mongoose.model('Document', documentSchema);

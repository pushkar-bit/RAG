const express = require('express');
const router = express.Router();
const multer = require('multer');
const { processComparisonQuery, submitFeedback } = require('../controllers/chat.controller');

// Configure Multer for memory storage (direct OCR processing)
const upload = multer({ storage: multer.memoryStorage() });

// Explicit Hallucination testing comparison engine - Support Image + Text queries
router.post('/compare', upload.single('image'), processComparisonQuery);

// Feedback Loop System
router.post('/feedback', submitFeedback);

module.exports = router;

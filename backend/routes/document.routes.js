const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const { uploadDocument, getDocuments, deleteDocument } = require('../controllers/document.controller');

// GET all documents (for the knowledge base list)
router.get('/', getDocuments);

// Single file upload endpoint ensuring middleware processes file into memory buffer first
router.post('/upload', upload.single('file'), uploadDocument);

// Delete a document and its chunks
router.delete('/:id', deleteDocument);

module.exports = router;

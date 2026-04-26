const Document = require('../models/Document');
const Chunk = require('../models/Chunk');
const { extractText } = require('../services/fileParser.service');
const { chunkText } = require('../services/chunking.service');
const { generateEmbeddings } = require('../services/embedding.service');
const { upsertVectors } = require('../services/vectorStore.service');

/**
 * Upload and process a document through the full RAG pipeline
 */
const uploadDocument = async (req, res, next) => {
  let docId = null;

  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No valid file uploaded' });
    }

    // 1. Ingest Document Metadata
    const doc = await Document.create({
      fileName: req.file.originalname,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      status: 'Processing',
    });
    docId = doc._id;

    console.log(`[Document Controller] Started processing document ID: ${doc._id}`);

    // 2. Extract text from file buffer
    const extractedText = await extractText(req.file.buffer, req.file.mimetype);

    if (!extractedText || extractedText.trim().length === 0) {
      await Document.findByIdAndUpdate(docId, { status: 'Failed' });
      return res.status(422).json({ success: false, message: 'Could not extract text from the uploaded file.' });
    }

    // 3. Chunk the text
    const chunkSize = req.body.chunkSize ? parseInt(req.body.chunkSize) : 1000;
    const chunkOverlap = req.body.chunkOverlap ? parseInt(req.body.chunkOverlap) : 200;
    const chunks = chunkText(extractedText, chunkSize, chunkOverlap);

    // 4. Save Chunks into MongoDB
    const chunkDocsPayload = chunks.map((text, index) => ({
      documentId: doc._id,
      chunkIndex: index,
      text: text,
    }));

    let insertedChunks = [];
    if (chunkDocsPayload.length > 0) {
      insertedChunks = await Chunk.insertMany(chunkDocsPayload);
    }
    console.log(`[Document Controller] Stored ${insertedChunks.length} chunks for document ID: ${doc._id}`);

    // 5. Generate Embeddings via Groq and store in MongoDB
    if (insertedChunks.length > 0) {
      const textsToEmbed = insertedChunks.map(chunk => chunk.text);
      const embeddings = await generateEmbeddings(textsToEmbed);

      const vectorsToUpsert = insertedChunks.map((chunk, idx) => ({
        id: chunk._id.toString(),
        values: embeddings[idx],
        metadata: {
          documentId: chunk.documentId.toString(),
          chunkIndex: chunk.chunkIndex,
          text: chunk.text,
        }
      }));

      await upsertVectors(vectorsToUpsert);

      // Mark chunks as vectorized — use bulkWrite with known _id values
      // (avoids aggregation pipeline syntax which requires updatePipeline option)
      await Chunk.bulkWrite(
        insertedChunks.map(chunk => ({
          updateOne: {
            filter: { _id: chunk._id },
            update: { $set: { vectorId: chunk._id.toString() } },
          },
        }))
      );
    }

    // 6. Mark document as complete
    doc.status = 'Completed';
    doc.chunkCount = insertedChunks.length;
    await doc.save();

    res.status(201).json({
      success: true,
      message: 'Document ingested, chunked, and embeddings generated successfully',
      data: {
        documentId: doc._id,
        fileName: doc.fileName,
        chunksCreated: insertedChunks.length,
      }
    });

  } catch (error) {
    console.error(`[Document Controller] Pipeline Error:`, error.message);
    if (docId) {
      await Document.findByIdAndUpdate(docId, { status: 'Failed' });
    }
    next(error);
  }
};

/**
 * Get all documents in the knowledge base
 */
const getDocuments = async (req, res, next) => {
  try {
    const documents = await Document.find().sort({ createdAt: -1 });

    // Attach chunk counts
    const docsWithCounts = await Promise.all(
      documents.map(async (doc) => {
        const chunkCount = await Chunk.countDocuments({ documentId: doc._id });
        return {
          _id: doc._id,
          fileName: doc.fileName,
          originalName: doc.originalName,
          mimeType: doc.mimeType,
          status: doc.status,
          chunkCount,
          createdAt: doc.createdAt,
        };
      })
    );

    res.status(200).json({ success: true, data: docsWithCounts });
  } catch (error) {
    console.error('[Document Controller] Get Documents Failed:', error.message);
    next(error);
  }
};

/**
 * Delete a document and all its associated chunks
 */
const deleteDocument = async (req, res, next) => {
  try {
    const { id } = req.params;
    const doc = await Document.findById(id);
    if (!doc) {
      return res.status(404).json({ success: false, message: 'Document not found.' });
    }

    await Chunk.deleteMany({ documentId: id });
    await Document.findByIdAndDelete(id);

    console.log(`[Document Controller] Deleted document ${id} and its chunks.`);
    res.status(200).json({ success: true, message: 'Document and chunks deleted successfully.' });
  } catch (error) {
    console.error('[Document Controller] Delete Failed:', error.message);
    next(error);
  }
};

module.exports = { uploadDocument, getDocuments, deleteDocument };

const pdfParse = require('pdf-parse');

/**
 * Extracts plain text from a file buffer.
 * Uses pdf-parse v1.1.1 which exports a direct async function: pdfParse(buffer) → { text }
 *
 * @param {Buffer} fileBuffer - Raw file buffer from multer memoryStorage
 * @param {string} mimeType   - MIME type of the uploaded file
 * @returns {Promise<string>} Extracted text content
 */
const extractText = async (fileBuffer, mimeType) => {
  try {
    if (mimeType === 'application/pdf') {
      const data = await pdfParse(fileBuffer);

      if (!data.text || data.text.trim().length === 0) {
        throw new Error('PDF parsed successfully but contains no extractable text. The file may be image-only or scanned.');
      }

      console.log(`[File Parser] PDF extracted — ${data.text.length} chars, ${data.numpages} page(s).`);
      return data.text;

    } else if (mimeType === 'text/plain') {
      const text = fileBuffer.toString('utf-8');
      console.log(`[File Parser] TXT extracted — ${text.length} characters.`);
      return text;

    } else {
      throw new Error(`Unsupported file type: ${mimeType}. Only PDF and TXT are accepted.`);
    }
  } catch (error) {
    throw new Error(`Text extraction failed: ${error.message}`);
  }
};

module.exports = { extractText };

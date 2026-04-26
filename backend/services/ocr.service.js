const Tesseract = require('tesseract.js');

/**
 * Extracts text from an image buffer or file path using Tesseract.js
 * Optimized for diagram and document text extraction.
 */
const extractTextFromImage = async (imageBuffer) => {
  try {
    console.log(`[OCR Service] Initiating text extraction from image...`);
    const { data: { text } } = await Tesseract.recognize(
      imageBuffer,
      'eng',
      { 
        logger: m => console.log(`[OCR Progress] ${m.status}: ${Math.round(m.progress * 100)}%`) 
      }
    );
    
    const cleanedText = text.trim();
    console.log(`[OCR Service] Extraction complete. Captured ${cleanedText.length} characters.`);
    return cleanedText;
  } catch (error) {
    console.error(`[OCR Service] Extraction Failed:`, error.message);
    throw new Error(`OCR Pipeline failed: ${error.message}`);
  }
};

module.exports = { extractTextFromImage };

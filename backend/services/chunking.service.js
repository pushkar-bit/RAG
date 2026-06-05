/**
 * Splits text into conceptually cohesive, overlapping chunks
 * 
 * @param {string} text - The raw text extracted from the document
 * @param {number} chunkSize - Target length of characters per chunk
 * @param {number} chunkOverlap - Number of overlapping characters to preserve semantic context
 * @returns {string[]} Array of string chunks
 */
const chunkText = (text, chunkSize = 1000, chunkOverlap = 200) => {
  if (!text || text.trim().length === 0) return [];
  
  if (chunkSize <= chunkOverlap) {
    throw new Error('chunkSize must be strictly greater than chunkOverlap');
  }

  const chunks = [];
  let i = 0;
  
  // Sliding window approach on characters
  while (i < text.length) {
    // Define initial potential boundary
    let end = Math.min(i + chunkSize, text.length);
    
    // Retreat the boundary to the last space to avoid breaking words in half
    // Only applied if we aren't at the very end of the document
    if (end < text.length && text[end] !== ' ' && text[end] !== '\n') {
      const lastSpace = Math.max(text.lastIndexOf(' ', end), text.lastIndexOf('\n', end));
      // If no space was found, just force cut at raw character limit
      if (lastSpace > i) {
        end = lastSpace;
      }
    }

    const chunk = text.slice(i, end).trim();
    if (chunk) {
      chunks.push(chunk);
    }
    
    // Advance the window keeping overlapping context, ensuring we always make progress
    const nextI = end - chunkOverlap;
    if (nextI <= i) {
      i = end; // Force advance to prevent infinite loop
    } else {
      i = nextI;
    }
    
    // Guard clause against infinite loops if overlaps are poorly configured
    if (end >= text.length) break;
  }

  console.log(`[Chunking Service] Successfully split text into ${chunks.length} chunks (Params - Size: ${chunkSize}, Overlap: ${chunkOverlap})`);
  return chunks;
};

module.exports = { chunkText };

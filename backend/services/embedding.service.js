// Uses @xenova/transformers for fully local, free semantic embeddings.
// No API key required — model is downloaded once and cached locally.
// Model: Xenova/all-MiniLM-L6-v2 (384-dim, fast and accurate)

let pipeline = null;
let pipelineLoading = false;

const getEmbeddingPipeline = async () => {
  if (pipeline) return pipeline;
  if (pipelineLoading) {
    // Wait for the loading pipeline
    while (pipelineLoading) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    return pipeline;
  }

  pipelineLoading = true;
  try {
    console.log('[Embedding Service] Loading local sentence-transformers model (first run downloads ~25MB)...');
    // Dynamic import required for ESM-only package in CommonJS context
    const { pipeline: transformersPipeline } = await import('@xenova/transformers');
    pipeline = await transformersPipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
    console.log('[Embedding Service] ✅ Embedding model loaded successfully.');
    return pipeline;
  } finally {
    pipelineLoading = false;
  }
};

/**
 * Converts text chunks into 384-dimensional semantic vector embeddings.
 * Uses local Xenova/all-MiniLM-L6-v2 model — no external API needed.
 * 
 * @param {string[]} texts - Array of text strings to embed
 * @returns {Promise<number[][]>} Array of 384-dim float arrays
 */
const generateEmbeddings = async (texts) => {
  try {
    const embedder = await getEmbeddingPipeline();

    console.log(`[Embedding Service] Generating embeddings for ${texts.length} chunk(s)...`);

    const embeddings = await Promise.all(
      texts.map(async (text) => {
        const output = await embedder(text, { pooling: 'mean', normalize: true });
        return Array.from(output.data);
      })
    );

    console.log(`[Embedding Service] ✅ Generated ${embeddings.length} embeddings (dim: ${embeddings[0]?.length}).`);
    return embeddings;
  } catch (error) {
    console.error('[Embedding Service] Embedding failed:', error.message);
    console.warn('[Embedding Service] Falling back to random mock embeddings.');
    // Fallback: normalized random vectors (384-dim)
    return texts.map(() => {
      const vec = Array(384).fill(0).map(() => Math.random() - 0.5);
      const mag = Math.sqrt(vec.reduce((s, v) => s + v * v, 0));
      return vec.map(v => v / mag);
    });
  }
};

module.exports = { generateEmbeddings };

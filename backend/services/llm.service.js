const Groq = require('groq-sdk');

let groqClient = null;

const initializeClient = () => {
  if (process.env.GROQ_API_KEY && !groqClient) {
    groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY });
    console.log('[LLM Service] Groq client initialized with API key.');
  }
};

/**
 * Generates a grounded response using retrieved document chunks via Groq.
 * Uses retrieved context to answer accurately and helpfully.
 */
const generateGroundedResponse = async (query, retrievedChunks) => {
  initializeClient();

  if (!groqClient) {
    console.warn('[LLM Service] GROQ_API_KEY missing.');
    return {
      answer: retrievedChunks.length > 0
        ? `I found some information in the documents, but I can't process it fully without an API key: ${retrievedChunks[0]?.text?.slice(0, 300)}...`
        : 'No reliable information found in documents. Please ensure the GROQ_API_KEY is configured.',
      sources: retrievedChunks,
      isFallback: retrievedChunks.length === 0,
    };
  }

  if (!retrievedChunks || retrievedChunks.length === 0) {
    return {
      answer: 'I could not find any relevant information in the uploaded documents to answer your question. Please try uploading more context or rephrasing your query.',
      sources: [],
      isFallback: true,
    };
  }

  const contextString = retrievedChunks
    .map((chunk, i) => `[Document Source ${i + 1}]\n${chunk.text}`)
    .join('\n\n---\n\n');

  const systemPrompt = `You are InsightRAG, an advanced AI Knowledge Assistant.
Your goal is to provide accurate, comprehensive, and helpful answers based ONLY on the provided document excerpts.

Rules:
1. Use the provided context to answer the user's question.
2. If the answer is in the documents, provide a detailed summary or explanation.
3. If the documents don't have the full answer but have related info, provide the related info.
4. Maintain a professional and helpful tone.
5. Format your response using markdown (bullet points, bold text) for readability.

<context>
${contextString}
</context>`;

  try {
    console.log(`[LLM Service] Generating grounded response via Groq (llama-3.3-70b-versatile)...`);

    const response = await groqClient.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      temperature: 0.3,
      max_tokens: 1500,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: query },
      ],
    });

    const finalAnswer = response.choices[0].message.content.trim();

    // Only flag as fallback if the model explicitly says it can't answer
    const fallbackPhrases = ["i don't know", "i cannot find", "no information", "not mentioned", "not provided"];
    const isFallback = fallbackPhrases.some(p => finalAnswer.toLowerCase().startsWith(p)) && finalAnswer.length < 100;

    console.log(`[LLM Service] Grounded response generated (${finalAnswer.length} chars, fallback: ${isFallback})`);

    return {
      answer: finalAnswer,
      sources: isFallback ? [] : retrievedChunks,
      isFallback,
    };
  } catch (error) {
    console.error(`[LLM Service] Groq API error:`, error.message);
    throw new Error(`LLM generation failed: ${error.message}`);
  }
};

/**
 * Generates an ungrounded response (no document context) to demonstrate hallucination risk.
 */
const generateUngroundedResponse = async (query) => {
  initializeClient();

  if (!groqClient) return 'Groq API key missing — cannot generate response.';

  try {
    const response = await groqClient.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      temperature: 0.7,
      max_tokens: 1024,
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant. Answer the user\'s question based on your general knowledge. Be informative and clear.',
        },
        { role: 'user', content: query },
      ],
    });

    return response.choices[0].message.content.trim();
  } catch (error) {
    console.error(`[LLM Service] Ungrounded generation error:`, error.message);
    throw new Error(`Non-RAG response failed: ${error.message}`);
  }
};

/**
 * Generates semantic variations of a query to improve retrieval coverage.
 */
const generateQueryVariations = async (originalQuery) => {
  initializeClient();

  if (!groqClient) {
    console.warn('[LLM Service] Groq key missing — skipping query variations.');
    return [originalQuery];
  }

  try {
    const response = await groqClient.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      temperature: 0.5,
      max_tokens: 200,
      messages: [
        {
          role: 'system',
          content: 'Generate 2-3 alternative search queries for the given question to improve document retrieval. Return only the queries, one per line, no numbering.',
        },
        { role: 'user', content: originalQuery },
      ],
    });

    const text = response.choices[0].message.content.trim();
    const variations = text
      .split('\n')
      .map(q => q.replace(/^\d+\.\s*/, '').trim())
      .filter(q => q.length > 5 && q.length < 200);

    console.log(`[LLM Service] Generated ${variations.length} query variations.`);
    return [originalQuery, ...variations.slice(0, 2)];
  } catch (error) {
    console.error(`[LLM Service] Query variation failed:`, error.message);
    return [originalQuery];
  }
};

module.exports = { generateGroundedResponse, generateUngroundedResponse, generateQueryVariations };

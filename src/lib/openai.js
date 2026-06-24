import OpenAI from 'openai';
import { config } from '../config/index.js';

export const openai = new OpenAI({ apiKey: config.openaiApiKey });

/**
 * Create embeddings for one or more texts.
 * @param {string|string[]} input
 * @returns {Promise<number[][]>} one embedding vector per input
 */
export async function embed(input) {
  const texts = Array.isArray(input) ? input : [input];
  try {
    const response = await openai.embeddings.create({
      model: config.embeddingModel,
      input: texts,
    });
    return response.data.map((item) => item.embedding);
  } catch (err) {
    throw new Error(`OpenAI embeddings request failed: ${err.message}`, {
      cause: err,
    });
  }
}

/**
 * Generate a chat completion grounded in the provided context.
 * @param {string} question
 * @param {string} context
 * @returns {Promise<string>}
 */
export async function generateAnswer(question, context) {
  try {
    const response = await openai.chat.completions.create({
      model: config.chatModel,
      messages: [
        {
          role: 'system',
          content:
            'You are a helpful customer support assistant. Answer the user\'s ' +
            'question using only the provided context. If the answer is not in ' +
            'the context, say you do not have that information.',
        },
        {
          role: 'user',
          content: `Context:\n${context}\n\nQuestion: ${question}`,
        },
      ],
      temperature: 0.2,
    });

    return response.choices[0].message.content.trim();
  } catch (err) {
    throw new Error(`OpenAI chat request failed: ${err.message}`, {
      cause: err,
    });
  }
}

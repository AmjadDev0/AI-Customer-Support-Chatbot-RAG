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

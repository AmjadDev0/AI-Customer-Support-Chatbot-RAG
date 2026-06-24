import { getEncoding } from 'js-tiktoken';

// cl100k_base is the encoding used by text-embedding-3-* and gpt-4o models.
const encoder = getEncoding('cl100k_base');

/**
 * Split text into token-based chunks with a fixed overlap.
 *
 * Chunk sizes are measured in tokens (not characters) so they align with the
 * embedding model's context window.
 *
 * @param {string} text
 * @param {{ chunkTokens?: number, overlapTokens?: number }} [options]
 * @returns {string[]} decoded text chunks
 */
export function chunkByTokens(
  text,
  { chunkTokens = 500, overlapTokens = 50 } = {},
) {
  if (overlapTokens >= chunkTokens) {
    throw new Error('overlapTokens must be smaller than chunkTokens');
  }

  const normalized = text.replace(/\s+/g, ' ').trim();
  if (!normalized) return [];

  const tokens = encoder.encode(normalized);
  const step = chunkTokens - overlapTokens;
  const chunks = [];

  for (let start = 0; start < tokens.length; start += step) {
    const window = tokens.slice(start, start + chunkTokens);
    chunks.push(encoder.decode(window));
    if (start + chunkTokens >= tokens.length) break;
  }

  return chunks;
}

/**
 * Count the number of tokens in a string.
 * @param {string} text
 * @returns {number}
 */
export function countTokens(text) {
  return encoder.encode(text).length;
}

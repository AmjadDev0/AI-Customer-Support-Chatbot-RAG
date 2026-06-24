/**
 * Split text into overlapping chunks suitable for embedding.
 *
 * @param {string} text
 * @param {{ chunkSize?: number, chunkOverlap?: number }} [options]
 * @returns {string[]}
 */
export function chunkText(text, { chunkSize = 1000, chunkOverlap = 200 } = {}) {
  const normalized = text.replace(/\s+/g, ' ').trim();
  if (!normalized) return [];

  const chunks = [];
  let start = 0;

  while (start < normalized.length) {
    const end = Math.min(start + chunkSize, normalized.length);
    chunks.push(normalized.slice(start, end));

    if (end === normalized.length) break;
    start += chunkSize - chunkOverlap;
  }

  return chunks;
}

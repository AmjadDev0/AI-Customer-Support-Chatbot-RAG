import { config } from '../config/index.js';
import { loadDirectory } from '../lib/loader.js';
import { chunkText } from '../lib/chunker.js';
import { embed } from '../lib/openai.js';
import { getCollection } from '../lib/chroma.js';

/**
 * Load documents from a directory, chunk + embed them, and store the vectors
 * in ChromaDB.
 *
 * @param {string} dir directory containing source documents
 * @returns {Promise<{ documents: number, chunks: number }>}
 */
export async function ingestDirectory(dir) {
  const docs = await loadDirectory(dir);
  const collection = await getCollection();

  let totalChunks = 0;

  for (const doc of docs) {
    const chunks = chunkText(doc.text, {
      chunkSize: config.chunkSize,
      chunkOverlap: config.chunkOverlap,
    });
    if (chunks.length === 0) continue;

    const embeddings = await embed(chunks);

    await collection.add({
      ids: chunks.map((_, i) => `${doc.source}-${i}`),
      embeddings,
      documents: chunks,
      metadatas: chunks.map(() => ({ source: doc.source })),
    });

    totalChunks += chunks.length;
  }

  return { documents: docs.length, chunks: totalChunks };
}

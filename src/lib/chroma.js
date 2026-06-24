import { ChromaClient } from 'chromadb';
import { config } from '../config/index.js';

export const chroma = new ChromaClient({ path: config.chromaUrl });

/**
 * Get (or create) the support documents collection.
 *
 * Embeddings are supplied by the caller, so we pass a null embedding function
 * to disable Chroma's built-in embedding behaviour.
 */
export async function getCollection() {
  return chroma.getOrCreateCollection({
    name: config.collectionName,
    embeddingFunction: null,
  });
}

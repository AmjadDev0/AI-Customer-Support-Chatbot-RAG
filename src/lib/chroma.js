import { ChromaClient } from 'chromadb';
import { config } from '../config/index.js';

// chromadb v3 takes host/port/ssl (the old `path` option is deprecated), so
// derive them from CHROMA_URL.
const url = new URL(config.chromaUrl);
const ssl = url.protocol === 'https:';

export const chroma = new ChromaClient({
  host: url.hostname,
  port: url.port ? Number(url.port) : ssl ? 443 : 80,
  ssl,
});

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

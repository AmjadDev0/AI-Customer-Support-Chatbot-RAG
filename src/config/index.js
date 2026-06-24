import dotenv from 'dotenv';

dotenv.config({ quiet: true });

function required(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

/** Read a numeric env var, falling back to a default when unset or invalid. */
function numberFromEnv(name, fallback) {
  const raw = process.env[name];
  if (raw === undefined || raw === '') return fallback;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export const config = {
  openaiApiKey: required('OPENAI_API_KEY'),
  port: numberFromEnv('PORT', 3000),
  chromaUrl: process.env.CHROMA_URL || 'http://localhost:8000',

  // Model + collection (override via env, defaults below)
  embeddingModel: process.env.OPENAI_EMBED_MODEL || 'text-embedding-3-small',
  chatModel: process.env.OPENAI_CHAT_MODEL || 'gpt-4o-mini',
  collectionName: process.env.CHROMA_COLLECTION || 'support-docs',

  // Token-based chunking + retrieval defaults
  chunkTokens: numberFromEnv('CHUNK_TOKENS', 500),
  overlapTokens: numberFromEnv('CHUNK_OVERLAP', 50),
  topK: numberFromEnv('TOP_K', 4),
};

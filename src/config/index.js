import dotenv from 'dotenv';

dotenv.config();

function required(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const config = {
  openaiApiKey: required('OPENAI_API_KEY'),
  port: Number(process.env.PORT) || 3000,
  chromaUrl: process.env.CHROMA_URL || 'http://localhost:8000',

  // Model + collection defaults
  embeddingModel: 'text-embedding-3-small',
  chatModel: 'gpt-4o-mini',
  collectionName: 'support-docs',

  // Retrieval / chunking defaults
  chunkSize: 1000,
  chunkOverlap: 200,
  topK: 4,
};

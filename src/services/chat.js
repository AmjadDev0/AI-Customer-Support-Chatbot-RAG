import { config } from '../config/index.js';
import { embed, generateAnswer } from '../lib/openai.js';
import { getCollection } from '../lib/chroma.js';

/**
 * Answer a user question using retrieval-augmented generation.
 *
 * @param {string} question
 * @returns {Promise<{ answer: string, sources: string[] }>}
 */
export async function answerQuestion(question) {
  const collection = await getCollection();

  const [queryEmbedding] = await embed(question);
  const results = await collection.query({
    queryEmbeddings: [queryEmbedding],
    nResults: config.topK,
  });

  const documents = results.documents?.[0] ?? [];
  const metadatas = results.metadatas?.[0] ?? [];

  if (documents.length === 0) {
    return {
      answer:
        "I don't have any information on that yet. Please make sure the " +
        'knowledge base has been ingested.',
      sources: [],
    };
  }

  const context = documents.join('\n\n---\n\n');
  const answer = await generateAnswer(question, context);

  const sources = [
    ...new Set(metadatas.map((m) => m?.source).filter(Boolean)),
  ];

  return { answer, sources };
}

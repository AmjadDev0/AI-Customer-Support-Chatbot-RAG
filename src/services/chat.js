import { config } from '../config/index.js';
import { openai, embed } from '../lib/openai.js';
import { getCollection } from '../lib/chroma.js';

/** Exact reply the model must use when the answer is not in the context. */
export const HANDOFF_MESSAGE =
  "I'm not able to answer that from our support documentation. " +
  "I'll hand this off to a human support agent who can help you further.";

const SYSTEM_PROMPT = [
  'You are a customer support assistant.',
  'Answer the user\'s question using ONLY the information in the provided context.',
  'Do not use prior knowledge or make assumptions beyond the context.',
  'Keep your answer concise and to the point.',
  'If the answer cannot be found in the context, reply with EXACTLY the',
  `following text and nothing else:\n"${HANDOFF_MESSAGE}"`,
].join('\n');

/**
 * Answer a user question with retrieval-augmented generation.
 *
 * Embeds the question, retrieves the top-K most relevant chunks from Chroma,
 * and asks the chat model to answer strictly from those chunks.
 *
 * @param {string} question
 * @returns {Promise<{ answer: string, handoff: boolean, sources: string[] }>}
 */
export async function answerQuestion(question) {
  let collection;
  try {
    collection = await getCollection();
  } catch (err) {
    throw new Error(
      `Could not connect to ChromaDB at ${config.chromaUrl}: ${err.message}`,
      { cause: err },
    );
  }

  // 1. Embed the question and retrieve the top-K most relevant chunks.
  const [queryEmbedding] = await embed(question);

  let results;
  try {
    results = await collection.query({
      queryEmbeddings: [queryEmbedding],
      nResults: config.topK,
      include: ['documents', 'metadatas'],
    });
  } catch (err) {
    throw new Error(`ChromaDB query failed: ${err.message}`, { cause: err });
  }

  const documents = results.documents?.[0] ?? [];
  const metadatas = results.metadatas?.[0] ?? [];

  // No context at all → hand off immediately.
  if (documents.length === 0) {
    return { answer: HANDOFF_MESSAGE, handoff: true, sources: [] };
  }

  // 2. Build the context block from the retrieved chunks.
  const context = documents
    .map((doc, i) => `[${i + 1}] ${doc}`)
    .join('\n\n');

  // 3. Ask the model to answer strictly from the context.
  let response;
  try {
    response = await openai.chat.completions.create({
      model: config.chatModel,
      temperature: 0,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: `Context:\n${context}\n\nQuestion: ${question}`,
        },
      ],
    });
  } catch (err) {
    throw new Error(`OpenAI chat request failed: ${err.message}`, {
      cause: err,
    });
  }

  const answer = response.choices[0].message.content.trim();
  const handoff = answer === HANDOFF_MESSAGE;

  const sources = handoff
    ? []
    : [...new Set(metadatas.map((m) => m?.source).filter(Boolean))];

  return { answer, handoff, sources };
}

import { createHash } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pdfParse from 'pdf-parse';

import { config } from './config/index.js';
import { openai } from './lib/openai.js';
import { getCollection } from './lib/chroma.js';
import { chunkByTokens } from './lib/tokenChunker.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Project-root /docs folder (../docs relative to src/).
const DOCS_DIR = path.resolve(__dirname, '../docs');

const CHUNK_TOKENS = 500;
const OVERLAP_TOKENS = 50;
const EMBED_BATCH_SIZE = 96; // texts per embeddings request
const SUPPORTED_EXTENSIONS = new Set(['.pdf', '.txt']);

/** Stable, content-derived ID so identical chunks upsert instead of duplicating. */
function chunkId(source, text) {
  const hash = createHash('sha256').update(`${source}::${text}`).digest('hex');
  return `${source}::${hash.slice(0, 16)}`;
}

/** Extract raw text from a single PDF or .txt file. */
async function extractText(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.pdf') {
    const buffer = await readFile(filePath);
    const { text } = await pdfParse(buffer);
    return text;
  }
  return readFile(filePath, 'utf-8');
}

/** Embed an array of texts in batches with text-embedding-3-small. */
async function embedBatched(texts) {
  const vectors = [];
  for (let i = 0; i < texts.length; i += EMBED_BATCH_SIZE) {
    const batch = texts.slice(i, i + EMBED_BATCH_SIZE);
    console.log(
      `  → embedding ${i + 1}-${i + batch.length} of ${texts.length} chunks`,
    );
    const response = await openai.embeddings.create({
      model: config.embeddingModel, // text-embedding-3-small
      input: batch,
    });
    for (const item of response.data) vectors.push(item.embedding);
  }
  return vectors;
}

/**
 * Ingest every supported document in /docs into the local Chroma collection.
 *
 * Idempotency: each chunk gets a deterministic ID derived from its source file
 * and content hash, and we use Chroma `upsert`. Re-running over unchanged files
 * overwrites the same rows instead of creating duplicates. Chunks already
 * present in the collection are skipped before embedding to avoid needless API
 * calls.
 *
 * @param {string} [docsDir]
 * @returns {Promise<{ files: number, chunks: number, embedded: number, skipped: number }>}
 */
export async function ingestDocs(docsDir = DOCS_DIR) {
  console.log(`[ingest] scanning ${docsDir}`);

  let entries;
  try {
    entries = await readdir(docsDir, { withFileTypes: true });
  } catch (err) {
    if (err.code === 'ENOENT') {
      throw new Error(`Docs folder not found: ${docsDir}`);
    }
    throw err;
  }

  const files = entries
    .filter(
      (e) => e.isFile() && SUPPORTED_EXTENSIONS.has(path.extname(e.name).toLowerCase()),
    )
    .map((e) => e.name);

  if (files.length === 0) {
    console.log('[ingest] no .pdf or .txt files found — nothing to do.');
    return { files: 0, chunks: 0, embedded: 0, skipped: 0 };
  }
  console.log(`[ingest] found ${files.length} file(s): ${files.join(', ')}`);

  const collection = await getCollection();

  // Build the full set of chunks across all files.
  /** @type {Array<{ id: string, text: string, source: string }>} */
  const allChunks = [];
  for (const name of files) {
    const text = await extractText(path.join(docsDir, name));
    const chunks = chunkByTokens(text, {
      chunkTokens: CHUNK_TOKENS,
      overlapTokens: OVERLAP_TOKENS,
    });
    console.log(`[ingest] ${name}: ${chunks.length} chunk(s)`);
    for (const chunk of chunks) {
      allChunks.push({ id: chunkId(name, chunk), text: chunk, source: name });
    }
  }

  // De-duplicate IDs within this run (identical chunks across/within files).
  const uniqueById = new Map(allChunks.map((c) => [c.id, c]));
  const candidates = [...uniqueById.values()];

  // Skip chunks that already exist in the collection (idempotent re-runs).
  const existing = await collection.get({
    ids: candidates.map((c) => c.id),
    include: [],
  });
  const existingIds = new Set(existing.ids ?? []);
  const toEmbed = candidates.filter((c) => !existingIds.has(c.id));
  const skipped = candidates.length - toEmbed.length;

  console.log(
    `[ingest] ${candidates.length} unique chunk(s): ${toEmbed.length} new, ${skipped} already stored`,
  );

  if (toEmbed.length === 0) {
    console.log('[ingest] collection already up to date.');
    return { files: files.length, chunks: candidates.length, embedded: 0, skipped };
  }

  const embeddings = await embedBatched(toEmbed.map((c) => c.text));

  await collection.upsert({
    ids: toEmbed.map((c) => c.id),
    embeddings,
    documents: toEmbed.map((c) => c.text),
    metadatas: toEmbed.map((c) => ({ source: c.source })),
  });

  console.log(
    `[ingest] done — upserted ${toEmbed.length} chunk(s) into "${config.collectionName}".`,
  );

  return {
    files: files.length,
    chunks: candidates.length,
    embedded: toEmbed.length,
    skipped,
  };
}

// Allow running directly: `node src/ingestDocs.js`
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  ingestDocs().catch((err) => {
    console.error('[ingest] failed:', err);
    process.exit(1);
  });
}

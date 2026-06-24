import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import pdfParse from 'pdf-parse';

/**
 * Extract raw text from a single file. Supports PDF and plain-text formats.
 * @param {string} filePath
 * @returns {Promise<string>}
 */
export async function loadFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();

  if (ext === '.pdf') {
    const buffer = await readFile(filePath);
    const { text } = await pdfParse(buffer);
    return text;
  }

  if (ext === '.txt' || ext === '.md') {
    return readFile(filePath, 'utf-8');
  }

  throw new Error(`Unsupported file type: ${ext}`);
}

/**
 * Load every supported document in a directory.
 * @param {string} dir
 * @returns {Promise<Array<{ source: string, text: string }>>}
 */
export async function loadDirectory(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const supported = new Set(['.pdf', '.txt', '.md']);

  const docs = [];
  for (const entry of entries) {
    if (!entry.isFile()) continue;
    if (!supported.has(path.extname(entry.name).toLowerCase())) continue;

    const filePath = path.join(dir, entry.name);
    docs.push({ source: entry.name, text: await loadFile(filePath) });
  }

  return docs;
}

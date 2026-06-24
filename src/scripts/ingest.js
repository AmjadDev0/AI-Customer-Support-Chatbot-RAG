import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ingestDocs } from '../services/ingest.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Project-root /docs folder (../../docs relative to src/scripts/).
const DOCS_DIR = path.resolve(__dirname, '../../docs');

ingestDocs(DOCS_DIR).catch((err) => {
  console.error('[ingest] failed:', err);
  process.exit(1);
});

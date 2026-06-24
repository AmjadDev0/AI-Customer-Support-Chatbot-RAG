import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ingestDirectory } from '../services/ingest.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.resolve(__dirname, '../../data');

async function main() {
  console.log(`Ingesting documents from ${dataDir} ...`);
  const { documents, chunks } = await ingestDirectory(dataDir);
  console.log(`Done. Ingested ${chunks} chunks from ${documents} document(s).`);
}

main().catch((err) => {
  console.error('Ingestion failed:', err);
  process.exit(1);
});

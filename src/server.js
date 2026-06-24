import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from './config/index.js';
import { chatRouter } from './routes/chat.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.resolve(__dirname, '../public');

const app = express();

app.use(express.json());

// API: POST /chat
app.use('/', chatRouter);

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

// Static frontend (index.html chat widget)
app.use(express.static(publicDir));

app.listen(config.port, () => {
  console.log(`Support chatbot listening on http://localhost:${config.port}`);
});

import express from 'express';
import { config } from './config/index.js';
import { chatRouter } from './routes/chat.js';

const app = express();

app.use(express.json());

app.get('/health', (_req, res) => res.json({ status: 'ok' }));
app.use('/api', chatRouter);

app.listen(config.port, () => {
  console.log(`Support chatbot listening on http://localhost:${config.port}`);
});

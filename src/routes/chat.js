import { Router } from 'express';
import { answerQuestion } from '../services/chat.js';

export const chatRouter = Router();

chatRouter.post('/chat', async (req, res) => {
  const { message } = req.body ?? {};

  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'A "message" string is required.' });
  }

  try {
    const result = await answerQuestion(message);
    res.json(result);
  } catch (err) {
    console.error('Error answering question:', err);
    res.status(500).json({ error: 'Failed to generate an answer.' });
  }
});

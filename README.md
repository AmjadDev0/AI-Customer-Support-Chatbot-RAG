# AI Customer Support Chatbot (RAG)

A RAG-based (Retrieval-Augmented Generation) AI customer support chatbot built with
**OpenAI**, **ChromaDB**, and **Express**. It ingests your support documents
(PDF, text, markdown), embeds them into a vector store, and answers user
questions grounded in that knowledge base.

## How it works

1. **Ingest** documents in `data/` are parsed, split into chunks, embedded with
   OpenAI embeddings, and stored in ChromaDB.
2. **Retrieve** at query time the user's question is embedded and the most
   relevant chunks are fetched from ChromaDB.
3. **Generate** the retrieved context is passed to an OpenAI chat model, which
   produces a grounded answer.

## Project structure

```
support-chatbot/
├── data/                  # Source documents to ingest (PDFs, text, etc.)
├── src/
│   ├── config/            # Environment + client configuration
│   │   └── index.js
│   ├── lib/               # Core RAG building blocks
│   │   ├── openai.js      # OpenAI client + embeddings/chat helpers
│   │   ├── chroma.js      # ChromaDB client + collection access
│   │   ├── chunker.js     # Document splitting utilities
│   │   └── loader.js      # Document loaders (PDF/text)
│   ├── services/          # Higher-level RAG orchestration
│   │   ├── ingest.js      # Build the vector store from documents
│   │   └── chat.js        # Retrieve + generate an answer
│   ├── routes/            # Express route handlers
│   │   └── chat.js
│   ├── scripts/           # CLI entry points
│   │   └── ingest.js
│   └── server.js          # Express app entry point
├── .env.example
├── .gitignore
└── package.json
```

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# then edit .env and set OPENAI_API_KEY

# 3. Start ChromaDB (e.g. via Docker)
docker run -p 8000:8000 chromadb/chroma

# 4. Add documents to ./data and ingest them
npm run ingest

# 5. Run the server
npm start
```

## API

`POST /api/chat`

```json
{ "message": "How do I reset my password?" }
```

Response:

```json
{ "answer": "...", "sources": ["faq.pdf"] }
```

## Requirements

- Node.js >= 18
- A running ChromaDB instance
- An OpenAI API key

# AntiGravity (InsightRAG) — Knowledge Assistant Monorepo

Welcome to the **AntiGravity (InsightRAG)** workspace. This is a multi-tenant RAG (Retrieval-Augmented Generation) Knowledge Assistant designed to ingest organization documents, build searchable vector indices, and answer queries accurately using grounded LLM responses.

---

## 🏗️ Project Structure

The project is configured as a monorepo containing the frontend client and backend API:

*   **[`frontend/`](file:///Users/pushkarjain/Desktop/RAG%20Project2/frontend)**: Next.js 14 Web Application (App Router, Tailwind CSS, Lucide icons, shadcn/ui components).
*   **[`backend/`](file:///Users/pushkarjain/Desktop/RAG%20Project2/backend)**: Express.js API server (TypeScript, document parser services, embeddings generation, vector database client).
*   **[`plan.md`](file:///Users/pushkarjain/Desktop/RAG%20Project2/plan.md)**: Detailed project blueprint and architectural specifications.

---

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, Zustand, TanStack Query
- **Backend**: Node.js, Express.js, TypeScript, BullMQ (Job queueing), natural, pdf-parse, mammoth
- **Database / Vector Store**: Supabase (PostgreSQL) + `pgvector`
- **LLM Integrations**: Anthropic Claude 3.5 Sonnet (Grounded Responses) & OpenAI Text Embeddings (`text-embedding-3-small`)

---

## 🚀 Getting Started

### Prerequisites

Ensure you have Node.js (v18+) and npm installed.

### Setup and Installation

1.  Clone the repository.
2.  Install dependencies for both frontend and backend from the root directory:
    ```bash
    npm run install:all
    ```
3.  Set up environment variables in both `backend/.env` and `frontend/.env` (see respective directories for `.env` examples/details).

### Running Locally

You can run both frontend and backend development servers simultaneously using:

```bash
npm run dev
```

Alternatively, you can run them individually:

-   **Frontend only**: `npm run dev:frontend`
-   **Backend only**: `npm run dev:backend`

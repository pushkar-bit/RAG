```
P R O D U C T I O N B L U E P R I N T
```
# AntiGravity

## RAG Knowledge Assistant — Complete Project Plan

#### A fully detailed, production-ready architecture and implementation plan for the AntiGravity RAG Knowledge Assistant. Covers system architecture, security hardening, database

#### schema, API design, frontend implementation, deployment pipeline, and observability. Designed to be handed directly to a development team.

```
F R O N T E N D
```
##### Next.js 14 (App Router)

```
B A C K E N D
```
##### Node.js + Express.js

```
D A T A B A S E
```
##### Supabase (Postgres + pgvector)

```
U I L I B R A R Y
```
##### shadcn/ui + 21st.dev

T A B L E O F C O N T E N T S

##### 0 1 Project Overview & Vision § 1

##### 0 2 System Architecture § 2

```
2.1 — High-Level Architecture Diagram §2. 1
2.2 — Monorepo Structure §2. 2
```
##### 0 3 Tech Stack Deep Dive § 3

##### 0 4 Database Design (Supabase + pgvector) § 4

##### 0 5 RAG Pipeline — Technical Specification § 5

##### 0 6 Backend API Design (Express.js) § 6

##### 0 7 Frontend Architecture (Next.js) § 7

##### 0 8 Authentication & Authorization § 8

##### 0 9 Security Architecture § 9


##### 1 0 UI Component System §1 0

##### 1 1 Environment Configuration §1 1

##### 1 2 Deployment Strategy §1 2

##### 1 3 CI/CD Pipeline §1 3

##### 1 4 Observability & Monitoring §1 4

##### 1 5 Implementation Phases & Timeline §1 5

##### 1 6 Cost Estimation §1 6

S E C T I O N 0 1

## Project Overview & Vision

#### AntiGravity is a production-grade, multi-tenant RAG (Retrieval-Augmented Generation) Knowledge Assistant. It enables organisations to ingest their internal documents, build

#### searchable vector indices, and query them through an LLM — with responses that are always grounded in source material, making hallucination visible and measurable.

#### The product is designed around three core principles: every AI response must be traceable to a source chunk; hallucination must be quantifiable and demonstrable; and the

#### full pipeline (chunk → embed → index → retrieve → ground → respond) must be transparent to end users.

### Core Product Features

### Target Users

```
E N T E R P R I S E T E A M S
Legal, compliance, HR, finance — teams with large
internal document libraries who need accurate, auditable
AI responses.
```
```
S A A S P R O D U C T S
Products that want to offer AI document chat as a
feature, embedded into their existing product via the API.
```
```
D E V E L O P E R S
Engineering teams evaluating RAG pipelines, benchmarking
retrieval strategies, or learning LLM grounding techniques.
```
##### — Document Ingestion — Upload .txt, .md, .pdf, .docx files via drag-and-drop or API. Files are parsed, chunked, embedded, and indexed automatically.

##### — Configurable Chunking — Sliding window chunking with adjustable chunk size (100–2000 tokens) and overlap. Supports sentence-aware splitting to avoid semantic breaks.

##### — Vector Embeddings — OpenAI text-embedding-3-small (1536 dims) with pgvector as the index. Batch embedding with rate limit management.

##### — Semantic Retrieval — Top-k cosine similarity search with optional metadata filtering (by document, date range, tag).

##### — Grounded LLM Responses — Retrieved context is injected into the Claude/OpenAI prompt with strict system instructions to answer only from provided context.

##### — Hallucination Comparison — Live side-by-side view of RAG-grounded vs raw LLM response, with automated factual divergence scoring.

##### — Multi-Tenancy — Workspace-based isolation. Each workspace has its own document store, vector index, and user permissions.

##### — Conversation History — Persistent chat sessions with full message history stored in Supabase.

##### — Usage Analytics — Per-workspace token usage, query volume, retrieval accuracy metrics, and hallucination rate tracking.


S E C T I O N 0 2

## System Architecture

### 2.1 — High-Level Architecture

#### AntiGravity uses a three-tier architecture: a Next.js frontend served on Vercel, a Node.js/Express backend API on Railway or Render, and a Supabase Postgres database

#### with pgvector extension as the persistence and vector search layer. All LLM and embedding calls are proxied through the backend — the API key never touches the frontend.

```
A R C H I T E C T U R E D E C I S I O N — W H Y N O T N E X T. J S A P I R O U T E S F O R E V E R Y T H I N G?
```
##### Next.js API routes are excellent for lightweight BFF (backend-for-frontend) patterns, but the RAG pipeline involves long-running operations (embedding large documents, batch

##### processing) that can exceed Vercel's 10-second function timeout. The Express backend on a persistent server handles these jobs without timeout constraints. Next.js API routes

##### act as a secure proxy layer only.

### 2.2 — Monorepo Structure

P R O J E C T R O O T

```
0 1
Next.js Client
```
```
0 2
Next.js API Routes
```
```
0 3
Express Backend
```
```
0 4
Supabase / pgvector
```
```
0 5
OpenAI / Anthropic
```
```
# Turborepo monorepo
antigravity/
├── apps/
│ ├── web/ # Next.js 14 frontend
│ │ ├── app/ # App Router pages
│ │ │ ├── (auth)/ # Auth group: login, signup, reset
│ │ │ ├── (dashboard)/ # Protected routes
│ │ │ │ ├── workspace/[id]/
│ │ │ │ │ ├── ingest/
│ │ │ │ │ ├── pipeline/
│ │ │ │ │ ├── chat/
│ │ │ │ │ ├── analytics/
│ │ │ │ │ └── settings/
│ │ │ │ └── layout.tsx
│ │ │ ├── api/ # Next.js API routes (proxy layer)
│ │ │ │ ├── auth/
│ │ │ │ └── proxy/ # Proxies to Express backend
│ │ │ └── layout.tsx
│ │ ├── components/
│ │ │ ├── ui/ # shadcn + 21st.dev components
│ │ │ ├── rag/ # RAG-specific components
│ │ │ └── layout/ # Navbar, Dock, Sidebar
│ │ ├── lib/
```
#### → → → →


### 2.3 — Data Flow: Document Ingestion

### 2.4 — Data Flow: Query / Chat

```
│ │ │ ├── supabase/ # Supabase client (browser + server)
│ │ │ ├── api/ # API client functions
│ │ │ └── utils/
│ │ └── middleware.ts # Auth middleware
│ │
│ └── api/ # Express.js backend
│ ├── src/
│ │ ├── routes/ # Route handlers
│ │ ├── middleware/ # Auth, rate-limit, validation
│ │ ├── services/ # Business logic
│ │ │ ├── chunker.ts
│ │ │ ├── embedder.ts
│ │ │ ├── retriever.ts
│ │ │ ├── llm.ts
│ │ │ └── storage.ts
│ │ ├── jobs/ # Background job processors
│ │ └── db/ # Supabase admin client
│ └── Dockerfile
│
├── packages/
│ ├── shared-types/ # TypeScript interfaces shared across apps
│ ├── config/ # ESLint, TypeScript, Tailwind configs
│ └── database/ # Supabase migrations, seed scripts
│
├── docker-compose.yml # Local dev stack
├── turbo.json
└── package.json
```
##### 1.^1. User uploads file(s) via the Ingest page (drag-drop or file picker)

##### 2.^2. Next.js API route validates file type/size, forwards multipart to Express

##### 3.^3. Express stores raw file in Supabase Storage bucket documents/

##### 4.^4. Express queues an ingestion job (Bull/BullMQ backed by Redis or Upstash)

##### 5.^5. Job processor: parse file → split into chunks → batch embed via OpenAI

##### 6.^6. Embeddings + chunk metadata inserted into chunks table (pgvector column)

##### 7.^7. Document record updated with status indexed

##### 8.^8. Frontend polls document status via SSE or WebSocket and shows live progress

##### 1.^1. User types a question in the chat input

##### 2.^2. Next.js API route forwards POST to /api/query on Express


```
S E C T I O N 0 3
```
## Tech Stack Deep Dive

```
L A Y E R T E C H N O L O G Y V E R S I O N P U R P O S E
```
##### Frontend Framework Next.js 14 (App Router) SSR, routing, API proxy layer, RSC for fast initial loads

##### Frontend Language TypeScript 5.x End-to-end type safety with shared types package

##### Styling Tailwind CSS 3.4 Utility-first, pairs perfectly with shadcn

##### UI Components shadcn/ui latest Accessible, unstyled-by-default Radix-based components

##### UI Components (extra) 21st.dev latest Animated background, testimonials columns, dock, category list

##### Animation motion (framer) 11.x Page transitions, SVG path animation, scroll reveals

##### State Management Zustand 4.x Lightweight global state (workspace, pipeline status, chat)

##### Data Fetching TanStack Query 5.x Server state, cache, optimistic updates

##### Forms React Hook Form + Zod latest Type-safe form validation aligned with backend schemas

##### Backend Framework Express.js 4.x REST API, middleware pipeline, file upload handling

##### Backend Language TypeScript + tsx 5.x Type safety, shared interfaces with frontend

##### Job Queue BullMQ 5.x Async document processing, embedding batches, retry logic

##### Queue Store Upstash Redis latest Serverless Redis for BullMQ, rate limiting, session cache

##### Database Supabase (Postgres 15) latest Primary data store + auth + storage

##### Vector Search pgvector 0.7+ Native Postgres vector index (HNSW) for cosine similarity

##### File Storage Supabase Storage latest Raw document files, processed outputs

##### Auth Supabase Auth latest JWT, email/password, Google OAuth, magic links

##### 3.^3. Express embeds the query string using OpenAI embeddings

##### 4.^4. pgvector performs ivfflat or hnsw cosine similarity search: SELECT ... ORDER BY embedding <=> $1 LIMIT 5

##### 5.^5. Top-k chunks assembled into a context block

##### 6.^6. Context + user question sent to Claude/OpenAI with grounding system prompt

##### 7.^7. Response streamed back to frontend via SSE

##### 8.^8. Message + retrieved chunks + response stored in messages table


##### Embedding Model OpenAI text-embedding-3-small — 1536-dim vectors, best quality/cost ratio

##### LLM Anthropic Claude 3.5 Sonnet — Primary LLM for grounded responses

##### File Parsing pdf-parse, mammoth, marked latest PDF, DOCX, Markdown extraction

##### Build System Turborepo 2.x Monorepo build orchestration with caching

##### Testing Vitest + Playwright latest Unit tests (Vitest), E2E tests (Playwright)

##### Linting ESLint + Prettier latest Code quality and formatting

##### Observability Sentry + PostHog latest Error tracking + product analytics

S E C T I O N 0 4

## Database Design (Supabase + pgvector)

```
P R E - R E Q U I S I T E
```
##### Enable the vector extension in Supabase: Dashboard → Database → Extensions → Enable vector. Also enable uuid-ossp. For HNSW index support,

##### ensure you are on Postgres 15+ (Supabase default for new projects).

### 4.1 — Core Schema

S Q L — M I G R A T I O N S / 0 0 1 _ I N I T I A L _ S C H E M A. S Q L

```
-- Extensions
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```
```
-- Workspaces (multi-tenancy unit)
CREATE TABLE workspaces (
id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
name TEXT NOT NULL,
slug TEXT UNIQUE NOT NULL,
plan TEXT NOT NULL DEFAULT 'free', -- free | pro | enterprise
settings JSONB DEFAULT '{}',
created_at TIMESTAMPTZ DEFAULT NOW(),
updated_at TIMESTAMPTZ DEFAULT NOW()
);
```
```
-- Workspace Members (joins users to workspaces)
CREATE TABLE workspace_members (
id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
```

workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
role TEXT NOT NULL DEFAULT 'member', -- owner | admin | member
created_at TIMESTAMPTZ DEFAULT NOW(),
UNIQUE(workspace_id, user_id)
);

-- Documents
CREATE TABLE documents (
id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
name TEXT NOT NULL,
storage_path TEXT NOT NULL, -- Supabase Storage path
mime_type TEXT NOT NULL,
size_bytes BIGINT,
status TEXT DEFAULT 'pending', -- pending | processing | indexed | error
chunk_count INTEGER DEFAULT 0 ,
error_msg TEXT,
metadata JSONB DEFAULT '{}',
created_by UUID REFERENCES auth.users(id),
created_at TIMESTAMPTZ DEFAULT NOW(),
updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chunks (vector store)
CREATE TABLE chunks (
id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
content TEXT NOT NULL,
embedding vector( 1536 ), -- OpenAI text-embedding-3-small
chunk_index INTEGER NOT NULL,
token_count INTEGER,
metadata JSONB DEFAULT '{}', -- page_num, section, headings, etc.
created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chat Sessions
CREATE TABLE sessions (
id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
user_id UUID REFERENCES auth.users(id),
title TEXT DEFAULT 'New Chat',
created_at TIMESTAMPTZ DEFAULT NOW(),
updated_at TIMESTAMPTZ DEFAULT NOW()
);


### 4.2 — Vector Index (HNSW)

S Q L — M I G R A T I O N S / 0 0 2 _ V E C T O R _ I N D E X. S Q L

### 4.3 — Row Level Security (RLS)

```
-- Messages
CREATE TABLE messages (
id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
role TEXT NOT NULL, -- user | assistant
content TEXT NOT NULL,
retrieved_chunks UUID[] DEFAULT '{}', -- chunk IDs used for grounding
model TEXT,
tokens_used INTEGER,
latency_ms INTEGER,
is_grounded BOOLEAN DEFAULT TRUE,
hallucination_score FLOAT, -- 0.0–1.0, higher = more likely hallucinated
created_at TIMESTAMPTZ DEFAULT NOW()
);
```
```
-- Usage Tracking
CREATE TABLE usage_events (
id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
event_type TEXT NOT NULL, -- query | embed | ingest
tokens INTEGER DEFAULT 0 ,
metadata JSONB DEFAULT '{}',
created_at TIMESTAMPTZ DEFAULT NOW()
);
```
```
-- HNSW index for fast approximate nearest-neighbour search
-- m=16, ef_construction=64 are sensible defaults for most RAG use cases
CREATE INDEX chunks_embedding_idx
ON chunks
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16 , ef_construction = 64 );
```
```
-- Partial index on workspace_id for multi-tenant query isolation
CREATE INDEX chunks_workspace_id_idx ON chunks (workspace_id);
CREATE INDEX chunks_document_id_idx ON chunks (document_id);
CREATE INDEX documents_workspace_status_idx ON documents (workspace_id, status);
CREATE INDEX messages_session_id_idx ON messages (session_id, created_at DESC);
```

S Q L — M I G R A T I O N S / 0 0 3 _ R L S _ P O L I C I E S. S Q L

### 4.4 — Vector Search Function

S Q L — M I G R A T I O N S / 0 0 4 _ S E A R C H _ F U N C T I O N. S Q L

```
-- Enable RLS on all tables
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
```
```
-- Helper function: get workspaces the current user is a member of
CREATE OR REPLACE FUNCTION get_user_workspace_ids()
RETURNS UUID[] AS $$
SELECT ARRAY_AGG(workspace_id)
FROM workspace_members
WHERE user_id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;
```
```
-- Documents: users can only access docs in their workspaces
CREATE POLICY "workspace_member_access" ON documents
FOR ALL USING (workspace_id = ANY(get_user_workspace_ids()));
```
```
-- Chunks: same isolation
CREATE POLICY "workspace_member_access" ON chunks
FOR ALL USING (workspace_id = ANY(get_user_workspace_ids()));
```
```
-- Sessions: users can only see their own sessions
CREATE POLICY "own_sessions" ON sessions
FOR ALL USING (user_id = auth.uid());
```
```
CREATE OR REPLACE FUNCTION match_chunks (
query_embedding vector( 1536 ),
workspace_id_in UUID,
match_count INT DEFAULT 5 ,
similarity_threshold FLOAT DEFAULT 0.
)
RETURNS TABLE (
id UUID,
content TEXT,
metadata JSONB,
document_id UUID,
```

S E C T I O N 0 5

## RAG Pipeline — Technical Specification

### 5.1 — Document Parser Service

#### Supports .txt, .md, .pdf, .docx. Each parser returns a normalised ParsedDocument with text content, page numbers, and headings metadata.

A P P S / A P I / S R C / S E R V I C E S / P A R S E R. T S

```
similarity FLOAT
)
LANGUAGE sql STABLE AS $$
SELECT
c.id,
c.content,
c.metadata,
c.document_id,
1 - (c.embedding <=> query_embedding) AS similarity
FROM chunks c
WHERE
c.workspace_id = workspace_id_in
AND c.embedding IS NOT NULL
AND 1 - (c.embedding <=> query_embedding) > similarity_threshold
ORDER BY c.embedding <=> query_embedding
LIMIT match_count;
$$;
```
```
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import { marked } from 'marked';
```
```
interface ParsedDocument {
text: string;
metadata: { pageCount?: number; title?: string; };
}
```
```
export async function parseDocument(
buffer: Buffer,
mimeType: string
): Promise<ParsedDocument> {
switch (mimeType) {
case 'application/pdf':
const pdf = await pdfParse(buffer);
```

### 5.2 — Chunking Service

#### Sliding window chunking with sentence-boundary awareness. Uses natural library for sentence tokenisation to avoid splitting mid-sentence.

A P P S / A P I / S R C / S E R V I C E S / C H U N K E R. T S

```
return { text: pdf.text, metadata: { pageCount: pdf.numpages } };
```
```
case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
const { value } = await mammoth.extractRawText({ buffer });
return { text: value, metadata: {} };
```
```
case 'text/markdown':
// Strip markdown syntax, keep plain text
const stripped = buffer.toString('utf-8').replace(/^#+\s/gm, '');
return { text: stripped, metadata: {} };
```
```
default: // text/plain
return { text: buffer.toString('utf-8'), metadata: {} };
}
}
```
```
import natural from 'natural';
```
```
export interface ChunkOptions {
chunkSize: number; // target words per chunk
chunkOverlap: number; // overlap in words
}
```
```
export interface TextChunk {
content: string;
chunkIndex: number;
tokenCount: number;
metadata: Record<string, unknown>;
}
```
```
export function chunkDocument(
text: string,
opts: ChunkOptions = { chunkSize: 400 , chunkOverlap: 50 }
): TextChunk[] {
const tokenizer = new natural.SentenceTokenizer();
const sentences = tokenizer.tokenize(text);
const chunks: TextChunk[] = [];
let buffer: string[] = [];
let wordCount = 0 ;
```

### 5.3 — Embedding Service

#### Batch embedding with automatic retry on rate-limit (429). Respects OpenAI's batch size limit of 2048 inputs per call.

A P P S / A P I / S R C / S E R V I C E S / E M B E D D E R. T S

```
let idx = 0 ;
```
```
for (const sentence of sentences) {
const words = sentence.split(/\s+/);
buffer.push(sentence);
wordCount += words.length;
```
```
if (wordCount >= opts.chunkSize) {
chunks.push({
content: buffer.join(' '),
chunkIndex: idx++,
tokenCount: wordCount,
metadata: {},
});
// Keep overlap: remove sentences from front until under overlap limit
while (wordCount > opts.chunkOverlap && buffer.length > 0 ) {
const removed = buffer.shift()!;
wordCount -= removed.split(/\s+/).length;
}
}
}
if (buffer.length) {
chunks.push({ content: buffer.join(' '), chunkIndex: idx, tokenCount: wordCount, metadata:
}
return chunks;
}
```
```
import OpenAI from 'openai';
```
```
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const BATCH_SIZE = 100 ; // stay well under API limits
const MODEL = 'text-embedding-3-small';
```
```
export async function embedTexts(texts: string[]): Promise<number[][]> {
const allEmbeddings: number[][] = [];
```
```
for (let i = 0 ; i < texts.length; i += BATCH_SIZE) {
const batch = texts.slice(i, i + BATCH_SIZE);
let attempt = 0 ;
```

### 5.4 — LLM Grounding Service

#### The grounding prompt is the most critical piece of the pipeline. It instructs the model to refuse to answer if the answer isn't in the provided context.

A P P S / A P I / S R C / S E R V I C E S / L L M. T S

```
while (true) {
try {
const res = await openai.embeddings.create({ model: MODEL, input: batch });
allEmbeddings.push(...res.data.map(d => d.embedding));
break;
} catch (err: any) {
if (err.status === 429 && attempt < 3 ) {
await sleep( 1000 * 2 ** attempt++);
} else throw err;
}
}
}
return allEmbeddings;
}
```
```
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
```
```
import Anthropic from '@anthropic-ai/sdk';
import type { TextChunk } from './chunker';
```
```
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
```
```
const GROUNDED_SYSTEM = `You are a precise knowledge assistant.
Rules you MUST follow:
```
1. Answer ONLY from the provided document context below.
2. If the answer is not in the context, respond EXACTLY:
"That information is not available in the provided documents."
3. Always cite which document your answer comes from.
4. Never extrapolate, guess, or use general knowledge.
5. If the context is partially relevant, use only the relevant parts and flag what is missing.`

```
export async function* streamGroundedResponse(
query: string,
retrievedChunks: TextChunk[]
): AsyncGenerator<string> {
const context = retrievedChunks
.map((c, i) => `[Source ${i+ 1 }] ${c.content}`)
.join('\n\n---\n\n');
```

S E C T I O N 0 6

## Backend API Design (Express.js)

### 6.1 — Route Structure

```
M E T H O D E N D P O I N T A U T H D E S C R I P T I O N
```
##### P O S T /api/workspaces JWT Create a new workspace

##### G E T /api/workspaces/:id JWT + Member Get workspace details

##### P O S T /api/workspaces/:id/documents JWT + Member Upload document (multipart)

##### G E T /api/workspaces/:id/documents JWT + Member List documents (paginated)

##### D E L E T E /api/workspaces/:id/documents/:docId JWT + Admin Delete document + chunks

##### G E T /api/workspaces/:id/documents/:docId/status JWT + Member Poll processing status (SSE)

##### P O S T /api/workspaces/:id/query JWT + Member RAG query (streaming SSE response)

##### P O S T /api/workspaces/:id/sessions JWT + Member Create chat session

##### G E T /api/workspaces/:id/sessions JWT + Member List sessions

##### G E T /api/workspaces/:id/sessions/:sessId/messages JWT + Member Get message history

```
const stream = await client.messages.stream({
model: 'claude-sonnet-4-20250514',
max_tokens: 1500 ,
system: GROUNDED_SYSTEM,
messages: [{ role: 'user', content: `Context:\n\n${context}\n\n---\n\nQuestion: ${query}` }
});
```
```
for await (const chunk of stream) {
if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
yield chunk.delta.text;
}
}
}
```

##### G E T /api/workspaces/:id/analytics JWT + Admin Usage, query volume, accuracy metrics

##### G E T /api/health None Health check for uptime monitoring

### 6.2 — Express App Wiring

A P P S / A P I / S R C / I N D E X. T S

```
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import { rateLimit } from 'express-rate-limit';
import { slowDown } from 'express-slow-down';
import { errorHandler } from './middleware/errorHandler';
import { authMiddleware } from './middleware/auth';
import workspaceRouter from './routes/workspaces';
import queryRouter from './routes/query';
```
```
const app = express();
```
```
// Security headers
app.use(helmet({ contentSecurityPolicy: true, crossOriginEmbedderPolicy: true }));
app.use(cors({
origin: [process.env.FRONTEND_URL!, 'http://localhost:3000'],
credentials: true,
methods: ['GET', 'POST', 'PUT', 'DELETE'],
}));
app.use(compression());
app.use(express.json({ limit: '50mb' }));
```
```
// Rate limiting — global
app.use(rateLimit({ windowMs: 15 * 60 * 1000 , max: 200 , standardHeaders: true }));
```
```
-- Tighter limit on LLM queries (expensive + abuse-prone)
const queryLimiter = rateLimit({ windowMs: 60 * 1000 , max: 20 });
app.use('/api/workspaces/:id/query', queryLimiter);
```
```
app.use('/api/workspaces', authMiddleware, workspaceRouter);
app.use('/api', authMiddleware, queryRouter);
app.get('/api/health', (_, res) => res.json({ status: 'ok' }));
app.use(errorHandler);
```
```
app.listen(process.env.PORT || 4000 );
```

### 6.3 — Streaming Query Endpoint

A P P S / A P I / S R C / R O U T E S / Q U E R Y. T S ( S I M P L I F I E D )

S E C T I O N 0 7

## Frontend Architecture (Next.js)

### 7.1 — App Router Page Structure

```
router.post('/workspaces/:id/query', async (req, res) => {
const { query, sessionId, compareMode } = req.body;
const workspaceId = req.params.id;
```
```
// Set SSE headers for streaming
res.setHeader('Content-Type', 'text/event-stream');
res.setHeader('Cache-Control', 'no-cache');
res.setHeader('Connection', 'keep-alive');
```
```
// 1. Embed the query
const [queryEmbedding] = await embedTexts([query]);
```
```
// 2. Vector search
const { data: chunks } = await supabaseAdmin.rpc('match_chunks', {
query_embedding: queryEmbedding,
workspace_id_in: workspaceId,
match_count: 5 ,
});
```
```
// 3. Send retrieved chunks to client first (for UI highlighting)
res.write(`data: ${JSON.stringify({ type: 'chunks', chunks })}\n\n`);
```
```
// 4. Stream grounded LLM response
for await (const token of streamGroundedResponse(query, chunks)) {
res.write(`data: ${JSON.stringify({ type: 'token', token })}\n\n`);
}
```
```
// 5. Signal completion
res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
res.end();
});
```

### 7.2 — Secure API Proxy (Next.js → Express)

#### All Express calls are proxied through Next.js API routes. This means the Express base URL and API keys never touch the browser. The Next.js proxy appends the Supabase

#### JWT from the session before forwarding.

A P P / A P I / P R O X Y / [... P A T H ] / R O U T E. T S

```
app/
├── (auth)/
│ ├── login/page.tsx # Supabase Auth UI or custom form
│ ├── signup/page.tsx
│ └── reset/page.tsx
├── (dashboard)/
│ ├── layout.tsx # Protected layout: Navbar + Sidebar
│ ├── page.tsx # Workspace list / home
│ └── workspace/[id]/
│ ├── layout.tsx # Workspace layout with dock
│ ├── page.tsx # Landing / overview (animated SVG BG)
│ ├── ingest/
│ │ └── page.tsx # Document upload + list
│ ├── pipeline/
│ │ └── page.tsx # Pipeline run + chunk/embed vis
│ ├── chat/
│ │ ├── page.tsx # Chat session list
│ │ └── [sessionId]/
│ │ └── page.tsx # Chat input + answer + hallucination compare
│ ├── analytics/
│ │ └── page.tsx # Usage charts, accuracy metrics
│ └── settings/
│ └── page.tsx # Members, API keys, billing
└── api/
├── auth/callback/route.ts # Supabase OAuth callback
└── proxy/[...path]/route.ts # Secure proxy to Express backend
```
```
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
```
```
export async function POST(req: NextRequest, { params }: { params: { path: string[] } }) {
const supabase = createServerClient(/* ... */);
const { data: { session } } = await supabase.auth.getSession();
```
```
if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
```

### 7.3 — Global State (Zustand)

A P P S / W E B / L I B / S T O R E. T S

```
const path = params.path.join('/');
const res = await fetch(`${process.env.API_BASE_URL}/api/${path}`, {
method: req.method,
headers: {
'Authorization': `Bearer ${session.access_token}`,
'Content-Type': 'application/json',
'X-Internal-Secret': process.env.INTERNAL_API_SECRET!, // extra auth layer
},
body: req.method !== 'GET'? await req.text() : undefined,
});
```
```
return new NextResponse(res.body, {
status: res.status,
headers: { 'Content-Type': res.headers.get('Content-Type')! },
});
}
```
```
import { create } from 'zustand';
```
```
interface PipelineState {
status: 'idle' | 'running' | 'done' | 'error';
currentStep: number;
chunks: Chunk[];
embeddings: number[][];
setStep: (step: number) => void;
setChunks: (chunks: Chunk[]) => void;
reset: () => void;
}
```
```
export const usePipelineStore = create<PipelineState>((set) => ({
status: 'idle',
currentStep: 0 ,
chunks: [],
embeddings: [],
setStep: (step) => set({ currentStep: step }),
setChunks: (chunks) => set({ chunks }),
reset: () => set({ status: 'idle', currentStep: 0 , chunks: [], embeddings: [] }),
}));
```

S E C T I O N 0 8

## Authentication & Authorization

### 8.1 — Auth Strategy

#### Authentication is handled entirely by Supabase Auth. The frontend uses @supabase/ssr for server-side session management. JWTs are validated on the Express

#### backend using the Supabase JWT secret (RS256).

```
S U P P O R T E D M E T H O D S A U T H O R I Z A T I O N L E V E L S
```
### 8.2 — Express Auth Middleware

A P P S / A P I / S R C / M I D D L E W A R E / A U T H. T S

##### — Email + Password

##### — Google OAuth 2.

##### — GitHub OAuth

##### — Magic Link (email)

##### — Owner — full workspace control, billing

##### — Admin — manage members, delete docs

##### — Member — ingest, query, view analytics

##### — Viewer — query only, read-only

```
import { createClient } from '@supabase/supabase-js';
```
```
const supabase = createClient(
process.env.SUPABASE_URL!,
process.env.SUPABASE_SERVICE_ROLE_KEY! // service role for server-side validation
);
```
```
export async function authMiddleware(req, res, next) {
const token = req.headers.authorization?.split(' ')[ 1 ];
const internalSecret = req.headers['x-internal-secret'];
```
```
// Both the JWT AND the internal secret must be valid
if (internalSecret !== process.env.INTERNAL_API_SECRET) {
return res.status( 401 ).json({ error: 'Forbidden' });
}
```
```
if (!token) return res.status( 401 ).json({ error: 'No token' });
```
```
const { data: { user }, error } = await supabase.auth.getUser(token);
if (error || !user) return res.status( 401 ).json({ error: 'Invalid token' });
```
```
req.user = user;
```

### 8.3 — Next.js Middleware (Route Protection)

A P P S / W E B / M I D D L E W A R E. T S

S E C T I O N 0 9

## Security Architecture

```
C R I T I C A L S E C U R I T Y P R I N C I P L E
```
##### No API keys (OpenAI, Anthropic, Supabase service role) ever reach the browser. All LLM calls are proxied through the Express backend. The Next.js proxy layer adds a shared

##### INTERNAL_API_SECRET header that the Express backend validates — ensuring that even if the Express URL leaked, direct calls would be rejected.

### 9.1 — Security Checklist

```
R I S K M I T I G A T I O N S T A T U S
```
##### API key exposure All LLM calls via Express backend. NEXT_PUBLIC_ prefix never used for secrets. C O V E R E D

```
next();
}
```
```
import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
```
```
export async function middleware(request: NextRequest) {
// Redirect unauthenticated users away from /dashboard routes
const { pathname } = request.nextUrl;
if (pathname.startsWith('/workspace')) {
const session = await getSession(request);
if (!session) {
return NextResponse.redirect(new URL('/login', request.url));
}
}
return NextResponse.next();
}
```
```
export const config = {
matcher: ['/workspace/:path*', '/api/proxy/:path*'],
};
```

##### SQL injection Supabase client uses parameterised queries exclusively. No raw SQL in app code. C O V E R E D

##### Data isolation (multi-tenant) RLS policies enforced at Postgres level. Service role key only used server-side. C O V E R E D

##### Prompt injection User query sanitised before insertion into LLM prompt. System prompt pinned and not overrideable by user input. C O V E R E D

##### File upload abuse MIME type whitelist, 10MB max, virus scan via ClamAV or external service. C O V E R E D

##### Rate limiting Global 200 req/15min, query endpoints 20 req/min. Per-user via Upstash Redis. C O V E R E D

##### DDoS / abuse Cloudflare in front of Vercel. WAF rules for bot detection. C O V E R E D

##### XSS Next.js default CSP headers via next.config.js. Helmet on Express. C O V E R E D

##### CSRF SameSite=Strict cookies + CORS allowlist. Supabase uses HTTP-only cookies. C O V E R E D

##### Sensitive data in logs Pino logger with redaction paths for password, token, apiKey fields. C O V E R E D

##### Dependency vulnerabilities npm audit in CI. Dependabot enabled. Snyk for container scanning. C O V E R E D

##### Secrets management All secrets in environment variables. No secrets in git. Doppler for secret sync. C O V E R E D

### 9.2 — Input Sanitisation

A P P S / A P I / S R C / M I D D L E W A R E / S A N I T I Z E. T S

```
import { z } from 'zod';
```
```
export const QuerySchema = z.object({
query: z.string()
.min( 1 )
.max( 1000 ) // prevent prompt stuffing
.transform(s => s.trim())
.refine(s => !/<script|javascript:|data:/i.test(s), 'Invalid content'),
sessionId: z.string().uuid().optional(),
topK: z.number().int().min( 1 ).max( 10 ).default( 5 ),
similarityThreshold: z.number().min(0.5).max(1.0).default(0.7),
});
```
```
export function validate(schema) {
return (req, res, next) => {
const result = schema.safeParse(req.body);
if (!result.success) {
return res.status( 400 ).json({ error: result.error.flatten() });
```

### 9.3 — File Upload Security

S E C T I O N 1 0

## UI Component System

### 10.1 — Component Inventory

```
C O M P O N E N T S O U R C E U S E D O N
```
##### BackgroundLines 21st.dev animated-svg-background Landing, all page backgrounds

##### Header 21st.dev header-2 (adapted) App-wide sticky navbar with scroll blur

##### AppleDock 21st.dev apple-dock Workspace overview, quick navigation

##### CategoryList 21st.dev category-list Landing page features, pipeline step list

##### TestimonialsColumn 21st.dev testimonials-columns-1 Landing page social proof section

##### Pagination + usePagination shadcn/ui + 21st.dev hook Document list, message history, analytics

##### ChatInput 21st.dev chat-input Chat page query input with auto-resize

##### Button shadcn/ui All CTAs and action buttons

##### Dialog shadcn/ui Confirm deletes, workspace invite, settings

##### DropdownMenu shadcn/ui User menu, document actions

###### }

```
req.body = result.data;
next();
};
}
```
##### MIME type validation — whitelist: text/plain, text/markdown , application/pdf,

```
application/vnd.openxmlformats-officedocument.wordprocessingml.document
```
###### —

##### — File size limit — 10MB per file, 50MB per workspace per day (Free plan)

##### — Magic byte check — verify file header matches declared MIME (prevents disguised executables)

##### Storage isolation — files stored at workspaces/{workspaceId}/documents/{uuid}.{ext}. Supabase Storage policies prevent cross-

##### workspace access.

###### —

##### — No execution — uploaded files are read as text buffers only. Never passed to eval , exec , or any shell command.


##### Tabs shadcn/ui Pipeline page, settings page

##### Progress shadcn/ui Document processing progress bar

##### Toast shadcn/ui (Sonner) Success/error notifications

##### Table shadcn/ui Document list, analytics tables

##### Badge shadcn/ui Document status, plan tier labels

##### Skeleton shadcn/ui Loading states throughout

### 10.2 — Theme Configuration (Gargouillette)

A P P S / W E B / A P P / G L O B A L S. C S S ( K E Y E X C E R P T )

S E C T I O N 1 1

## Environment Configuration

```
N E V E R C O M M I T S E C R E T S
```
```
@import url('https://fonts.cdnfonts.com/css/gargouillette');
```
```
:root {
/* Gargouillette as the sole display font */
--font-display: 'Gargouillette', Georgia, serif;
```
```
/* AntiGravity design tokens */
--background: #08080a;
--foreground: #f0ede8;
--muted: #9a9790;
--border: #232228;
--card: #0f0f12;
--primary: #f0ede8;
--primary-fg: #08080a;
--radius: 0px; /* Sharp corners throughout */
}
```
```
/* Override Tailwind base to use Gargouillette everywhere */
* { font-family: var(--font-display); letter-spacing: 0.03em; }
```

##### Add .env, .env.local , .env.production to .gitignore. Use Doppler or Vercel/Railway environment dashboards for secret

##### management. Rotate keys immediately if ever accidentally committed.

A P P S / W E B /. E N V. L O C A L

A P P S / A P I /. E N V

```
# Supabase (public — safe for browser)
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```
```
# Internal secret (server-side only — NEVER prefix with NEXT_PUBLIC_)
INTERNAL_API_SECRET=<32-char random string, generated with openssl rand -hex 32>
```
```
# Backend URL (server-side only)
API_BASE_URL=https://api.antigravity.yourdomain.com
```
```
# App
NEXT_PUBLIC_APP_URL=https://antigravity.yourdomain.com
```
```
# Sentry (optional — can be public)
NEXT_PUBLIC_SENTRY_DSN=https://...
```
```
# PostHog analytics (optional)
NEXT_PUBLIC_POSTHOG_KEY=phc_...
```
```
# Supabase (service role — server only, NEVER expose to client)
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```
```
# AI providers
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
```
```
# Internal auth between Next.js proxy and Express
INTERNAL_API_SECRET=<same 32-char string as web app>
```
```
# Redis (Upstash for BullMQ + rate limiting)
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...
```
```
# App
PORT=4000
NODE_ENV=production
FRONTEND_URL=https://antigravity.yourdomain.com
```

S E C T I O N 1 2

## Deployment Strategy

### 12.1 — Infrastructure Map

```
S E R V I C E P L A T F O R M R E G I O N N O T E S
```
##### Next.js Frontend Vercel Global Edge Auto-deploy on push to main. Preview deployments for PRs.

##### Express Backend Railway us-east-1 Docker container. Auto-deploy from main. 512MB RAM min.

##### Supabase Supabase Cloud us-east-1 Pro plan for production. Same region as Railway to minimise latency.

##### Redis (BullMQ) Upstash us-east-1 Serverless Redis. Free tier sufficient for low volume.

##### Domain + DNS Cloudflare Global Proxy mode for DDoS protection + WAF. CDN for static assets.

##### Container Registry GitHub Container Registry — Docker images built in CI, pushed to GHCR, deployed on Railway.

### 12.2 — Docker Setup (Express Backend)

A P P S / A P I / D O C K E R F I L E

```
# Logging
LOG_LEVEL=info
```
```
# Sentry
SENTRY_DSN=https://...
```
```
# ── Build stage ──────────────────────────────────────
FROM node: 20 -alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY..
RUN npm run build # Compiles TypeScript → dist/
```
```
# ── Production stage ─────────────────────────────────
FROM node: 20 -alpine AS production
WORKDIR /app
```

### 12.3 — Supabase Migrations Deployment

D E P L O Y. S H ( R U N I N C I A F T E R S U C C E S S F U L B U I L D )

### 12.4 — Vercel Configuration

V E R C E L. J S O N

```
# Non-root user for security
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
```
```
COPY --chown=nodejs:nodejs --from=builder /app/dist ./dist
COPY --chown=nodejs:nodejs --from=builder /app/node_modules ./node_modules
COPY --chown=nodejs:nodejs package.json ./
```
```
USER nodejs
```
```
EXPOSE 4000
CMD ["node", "dist/index.js"]
```
```
#!/bin/bash
set -e
```
```
# Install Supabase CLI if not present
npm install -g supabase
```
```
# Link to your Supabase project
supabase link --project-ref $SUPABASE_PROJECT_REF
```
```
# Run pending migrations
supabase db push
```
```
echo "✓ Migrations applied"
```
###### {

```
"buildCommand": "cd apps/web && npm run build",
"outputDirectory": "apps/web/.next",
"framework": "nextjs",
"headers": [
{
"source": "/(.*)",
"headers": [
{ "key": "X-Frame-Options", "value": "DENY" },
{ "key": "X-Content-Type-Options", "value": "nosniff" },
```

S E C T I O N 1 3

## CI/CD Pipeline

. G I T H U B / W O R K F L O W S / D E P L O Y. Y M L

```
{ "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
{ "key": "Permissions-Policy", "value": "camera=(), microphone=(), geolocation=()" }
]
}
]
}
```
```
name: Deploy
on:
push:
branches: [main]
pull_request:
branches: [main]
```
```
jobs:
test:
runs-on: ubuntu-latest
steps:
```
- uses: actions/checkout@v4
- uses: actions/setup-node@v4
with: { node-version: '20', cache: 'npm' }
- run: npm ci
- run: npm run lint # ESLint across all packages
- run: npm run type-check # tsc --noEmit
- run: npm run test # Vitest
- run: npm audit --audit-level=high

```
build-api:
needs: test
runs-on: ubuntu-latest
if: github.ref == 'refs/heads/main'
steps:
```
- uses: actions/checkout@v4
- name: Build & push Docker image
run: |
docker login ghcr.io -u ${{ github.actor }} -p ${{ secrets.GITHUB_TOKEN }}
docker build -t ghcr.io/${{ github.repository }}/api:${{ github.sha }} apps/api


S E C T I O N 1 4

## Observability & Monitoring

### 14.1 — Logging Strategy (Pino)

A P P S / A P I / S R C / L I B / L O G G E R. T S

### 14.2 — Metrics to Track

```
docker push ghcr.io/${{ github.repository }}/api:${{ github.sha }}
```
```
deploy:
needs: [test, build-api]
runs-on: ubuntu-latest
if: github.ref == 'refs/heads/main'
steps:
```
- name: Apply Supabase migrations
run: ./deploy.sh
env:
SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
SUPABASE_PROJECT_REF: ${{ secrets.SUPABASE_PROJECT_REF }}
- name: Deploy API to Railway
run: railway up --service api
env:
RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}

```
# Vercel deploys automatically on push to main via GitHub integration
```
```
import pino from 'pino';
```
```
export const logger = pino.create({
level: process.env.LOG_LEVEL || 'info',
redact: {
paths: ['req.headers.authorization', '*.password', '*.apiKey', '*.token'],
censor: '[REDACTED]',
},
transport: process.env.NODE_ENV === 'development'
? { target: 'pino-pretty' }
: undefined, // JSON in production for log aggregation
});
```

```
P I P E L I N E M E T R I C S Q U A L I T Y M E T R I C S
```
### 14.3 — Health Check Endpoint

G E T / A P I / H E A L T H → R E S P O N S E

S E C T I O N 1 5

## Implementation Phases & Timeline

###### P H A S E 1 — F O U N D A T I O N

###### P H A S E 2 — I N G E S T P I P E L I N E

##### — Documents ingested per day / workspace

##### — Chunk count and average token length

##### — Embedding latency (p50, p95, p99)

##### — Vector search latency

##### — End-to-end query latency

##### — Average retrieval similarity score

##### — Hallucination rate (% of raw LLM answers flagged)

##### — User thumbs up/down on responses

##### — Queries answered vs "not in documents" fallback rate

##### — Token cost per query

###### {

```
"status": "ok",
"version": "1.0.0",
"uptime": 86400 ,
"database": "ok",
"redis": "ok",
"latency": { "db": 4 , "redis": 1 }
}
```
```
W E E K S 1– 2
```
##### — Turborepo monorepo setup with shared TypeScript config

##### — Supabase project creation + migrations 001–004 applied

##### — Express skeleton with auth middleware, health check, error handler

##### — Next.js App Router with Supabase Auth (email + Google OAuth)

##### — Middleware route protection, login/signup pages

##### — CI/CD pipeline wired (GitHub Actions → Vercel + Railway)

##### — All environment variables documented and provisioned

```
W E E K S 3– 4
```

###### P H A S E 3 — R A G Q U E R Y E N G I N E

###### P H A S E 4 — U I P O L I S H & C O M P O N E N T S

###### P H A S E 5 — M U L T I - T E N A N C Y , A N A L Y T I C S & S E C U R I T Y

##### — Document upload API with MIME validation, Supabase Storage

##### — BullMQ job queue (ingestion jobs with retry)

##### — Parser service (.txt, .md, .pdf, .docx)

##### — Chunker service with sentence-aware splitting

##### — Embedder service with batch processing and rate-limit retry

##### — pgvector insertion with HNSW index

##### — SSE progress stream for frontend polling

##### — Ingest UI page: drop zone, document list, status badges

```
W E E K S 5– 6
```
##### — Vector search function ( match_chunks RPC)

##### — Retrieval service with configurable top-k and similarity threshold

##### — Grounded LLM streaming endpoint (SSE)

##### — Raw LLM endpoint for comparison mode

##### — Chat input component (21st.dev) wired to streaming API

##### — Retrieved chunk highlighting in Pipeline view

##### — Hallucination comparison panel

##### — Session + message persistence

```
W E E K S 7– 8
```
##### — Animated SVG background on all pages

##### — Apple Dock workspace navigation

##### — Testimonials columns on landing page

##### — Category list for pipeline steps

##### — Paginated document list and message history

##### — Gargouillette font applied globally

##### — Dark theme design tokens in Tailwind + shadcn

##### — Mobile responsive layouts

##### — Loading skeletons for all async states

```
W E E K S 9–1 0
```
##### — Workspace creation, invite flow, role management


###### P H A S E 6 — P R O D U C T I O N H A R D E N I N G & L A U N C H

S E C T I O N 1 6

## Cost Estimation

```
S E R V I C E P L A N M O N T H L Y C O S T ( U S D ) N O T E S
```
##### Vercel Pro $ 20 Needed for team deploys and custom domains

##### Railway Hobby → Pro $ 5 –$ 20 Based on CPU/memory usage. Start Hobby.

##### Supabase Pro $ 25 Required for daily backups, 8GB database, 100GB storage

##### Upstash Redis Pay-per-use $ 0 –$ 10 ~$0.2/100K commands. Very low cost at start.

##### OpenAI Embeddings Pay-per-use ~$2 / 1M tokens text-embedding-3-small. Ingest-heavy cost.

##### Anthropic Claude Pay-per-use ~$3 in / $15 out per 1M tokens Sonnet 4. Estimate based on query volume.

##### Cloudflare Free / Pro $ 20 $ 0 –$ 20 Free tier sufficient until high traffic

##### Sentry Developer (free) $ 0 Scale to Team ($26/mo) when needed

##### — Usage tracking ( usage_events table)

##### — Analytics dashboard: token cost, query volume, accuracy charts

##### — Rate limiting via Upstash Redis (per-user, per-workspace)

##### — File upload security hardening (magic byte check)

##### — Sentry integration (frontend + backend)

##### — PostHog product analytics

##### — Pino structured logging with redaction

```
W E E K S 1 1–1 2
```
##### — Playwright E2E test suite covering critical paths

##### — Vitest unit tests for chunker, embedder, retrieval

##### — Load testing (k6) against query and ingest endpoints

##### — Cloudflare WAF rules configured

##### — Uptime monitoring (Better Uptime or Checkly)

##### — Backup strategy: Supabase daily backups enabled (Pro plan)

##### — Runbook and incident response playbook written

##### — Public launch


##### Estimated Monthly Total (MVP) ~$ 70 –$ 100 Before AI API usage costs

```
C O S T O P T I M I S A T I O N T I P S
```
##### Cache embeddings — store a SHA-256 hash of each chunk and skip re-embedding if the hash already exists in the database. Eliminates duplicate embedding costs on re-upload.

##### Cache query embeddings — if the same question is asked twice, return the cached answer from Upstash (TTL 1 hour) instead of hitting OpenAI + Anthropic again.

##### Batch embed on ingest — never embed one chunk at a time. Always batch to 100 to minimise API call overhead.

```
N E X T S T E P S
```
##### 1. Clone the monorepo template and run npm create turbo@latest antigravity to scaffold the structure.

##### 2. Create a Supabase project and run migrations 001–004 from packages/database/migrations/.

##### 3. Set up environment variables using this document's Section 11 as the reference.

##### 4. Wire GitHub Actions CI using the workflow in Section 13.

##### 5. Build Phase 1 (Foundation) in Week 1 before writing any feature code.

AntiGravity Production Plan · Prepared by Claude · All architecture decisions reflect production best practices for the specified tech stack · Revision 1.0



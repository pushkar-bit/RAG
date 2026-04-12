-- HNSW index for fast approximate nearest-neighbour search
-- m=16, ef_construction=64 are sensible defaults for most RAG use cases
CREATE INDEX chunks_embedding_idx
ON chunks
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- Partial index on workspace_id for multi-tenant query isolation
CREATE INDEX chunks_workspace_id_idx ON chunks (workspace_id);
CREATE INDEX chunks_document_id_idx ON chunks (document_id);
CREATE INDEX documents_workspace_status_idx ON documents (workspace_id, status);
CREATE INDEX messages_session_id_idx ON messages (session_id, created_at DESC);

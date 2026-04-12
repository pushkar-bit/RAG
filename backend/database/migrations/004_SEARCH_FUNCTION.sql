CREATE OR REPLACE FUNCTION match_chunks (
  query_embedding vector(1536),
  workspace_id_in UUID,
  match_count INT DEFAULT 5,
  similarity_threshold FLOAT DEFAULT 0.5
)
RETURNS TABLE (
  id UUID,
  content TEXT,
  metadata JSONB,
  document_id UUID,
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

-- Enable RLS on all tables
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Helper function: get workspaces the current user is a member of
CREATE OR REPLACE FUNCTION get_user_workspace_ids()
RETURNS UUID[] AS $$
SELECT ARRAY_AGG(workspace_id)
FROM workspace_members
WHERE user_id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Documents: users can only access docs in their workspaces
CREATE POLICY "workspace_member_access" ON documents
FOR ALL USING (workspace_id = ANY(get_user_workspace_ids()));

-- Chunks: same isolation
CREATE POLICY "workspace_member_access" ON chunks
FOR ALL USING (workspace_id = ANY(get_user_workspace_ids()));

-- Sessions: users can only see their own sessions
CREATE POLICY "own_sessions" ON sessions
FOR ALL USING (user_id = auth.uid());

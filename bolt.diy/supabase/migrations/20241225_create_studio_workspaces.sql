-- Create studio_workspaces table
CREATE TABLE IF NOT EXISTS studio_workspaces (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id),
    project_id TEXT,
    snapshot_hash TEXT NOT NULL, -- Hash of the wizard state to detect changes
    frames JSONB NOT NULL,       -- The studio frames (screens)
    theme JSONB,                -- Custom brand theme
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, project_id, snapshot_hash)
);

-- Enable RLS
ALTER TABLE studio_workspaces ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own workspaces" 
    ON studio_workspaces FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own workspaces" 
    ON studio_workspaces FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own workspaces" 
    ON studio_workspaces FOR UPDATE 
    USING (auth.uid() = user_id);

-- Create index for faster lookup
CREATE INDEX IF NOT EXISTS idx_studio_workspaces_lookup ON studio_workspaces(user_id, project_id, snapshot_hash);

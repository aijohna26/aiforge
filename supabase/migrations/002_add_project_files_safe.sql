-- Add project_files table to store file contents (SAFE VERSION)
-- This version checks for existing objects before creating them

-- ============================================
-- PROJECT_FILES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS project_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  path TEXT NOT NULL,
  content TEXT NOT NULL,
  language TEXT DEFAULT 'text',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, path)
);

-- Enable Row Level Security
ALTER TABLE project_files ENABLE ROW LEVEL SECURITY;

-- Drop policy if it exists, then recreate (safe way to handle duplicates)
DROP POLICY IF EXISTS "Users can manage own project files" ON project_files;
CREATE POLICY "Users can manage own project files" ON project_files
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_files.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_project_files_project_id ON project_files(project_id);
CREATE INDEX IF NOT EXISTS idx_project_files_path ON project_files(project_id, path);

-- Auto-update timestamp trigger
DROP TRIGGER IF EXISTS project_files_updated_at ON project_files;
CREATE TRIGGER project_files_updated_at
  BEFORE UPDATE ON project_files
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Grant permissions
GRANT ALL ON project_files TO authenticated;

-- Add template_version column to projects table
-- This tracks which version of the core React Native template was used

ALTER TABLE projects
ADD COLUMN template_version TEXT NOT NULL DEFAULT '1.0.0';

-- Add index for template version queries
CREATE INDEX idx_projects_template_version ON projects(template_version);

-- Add comment
COMMENT ON COLUMN projects.template_version IS 'Version of the React Native base template used for this project';

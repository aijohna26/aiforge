-- Design Sessions Schema for AppForge AI
-- Stores user design wizard sessions and generated assets

-- =====================================================
-- 1. Design Sessions Table
-- =====================================================
CREATE TABLE IF NOT EXISTS design_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Session metadata
  session_name TEXT NOT NULL,           -- User-friendly name (defaults to app name)
  status TEXT NOT NULL DEFAULT 'draft', -- 'draft', 'completed', 'generating'
  current_stage INTEGER DEFAULT 1,      -- 1-6 (wizard stage)

  -- App Info (Stage 1)
  app_name TEXT,
  app_description TEXT,
  app_category TEXT,
  target_audience TEXT,
  brand_colors JSONB,                   -- { primary, secondary, accent }

  -- Style & References (Stage 2)
  style_preferences JSONB,              -- { typography, uiStyle, personality, components, keywords, notes }
  reference_images TEXT[],              -- Array of URLs

  -- Package Selection (Stage 1 or Review & Generate)
  selected_package TEXT,                -- 'basic' | 'complete' | 'premium'
  package_cost INTEGER,                 -- Credits

  -- AI Intelligence Configuration (Optional for Premium)
  ai_config JSONB,                      -- { provider, model, features, context, streaming }

  -- Logo (Stage 3)
  logo_url TEXT,
  logo_prompt TEXT,

  -- Tracking
  credits_used INTEGER DEFAULT 0,
  total_screens_generated INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,

  -- Full PRD (stored when user clicks "Generate App Code")
  prd_data JSONB,                       -- Complete AppDesignPRD
  generation_settings JSONB,            -- CodeGenerationSettings

  -- Generated code
  generated_code_url TEXT,              -- URL to ZIP file in storage
  generated_at TIMESTAMPTZ
);

-- Indexes for performance
CREATE INDEX idx_design_sessions_user_id ON design_sessions(user_id);
CREATE INDEX idx_design_sessions_status ON design_sessions(status);
CREATE INDEX idx_design_sessions_created_at ON design_sessions(created_at DESC);

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_design_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_design_sessions_updated_at
  BEFORE UPDATE ON design_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_design_sessions_updated_at();

-- =====================================================
-- 2. Design Session Screens Table
-- =====================================================
CREATE TABLE IF NOT EXISTS design_session_screens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES design_sessions(id) ON DELETE CASCADE,

  -- Screen details
  screen_type TEXT NOT NULL,            -- 'splash', 'signin', 'signup', 'home', 'custom', etc.
  screen_name TEXT NOT NULL,
  screen_url TEXT NOT NULL,             -- URL in Supabase Storage

  -- Generation details
  prompt_used TEXT,
  provider TEXT,                        -- 'gemini', 'openai'
  model TEXT,                           -- 'nano-banana', 'dall-e-3', etc.
  credits_cost INTEGER,

  -- Stage context
  wizard_stage INTEGER NOT NULL,        -- 3=Logo, 4=Key Screens, 5=Additional
  is_selected BOOLEAN DEFAULT false,    -- User selected this variation

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Reference images used
  reference_images TEXT[]
);

-- Indexes
CREATE INDEX idx_screens_session_id ON design_session_screens(session_id);
CREATE INDEX idx_screens_type ON design_session_screens(screen_type);
CREATE INDEX idx_screens_wizard_stage ON design_session_screens(wizard_stage);

-- =====================================================
-- 3. Design Session History Table
-- =====================================================
CREATE TABLE IF NOT EXISTS design_session_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES design_sessions(id) ON DELETE CASCADE,

  action TEXT NOT NULL,                 -- 'stage_completed', 'screen_generated', 'screen_edited', 'prd_generated'
  stage INTEGER,
  details JSONB,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_history_session_id ON design_session_history(session_id);
CREATE INDEX idx_history_action ON design_session_history(action);

-- =====================================================
-- Row Level Security (RLS) Policies
-- =====================================================

-- Enable RLS
ALTER TABLE design_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE design_session_screens ENABLE ROW LEVEL SECURITY;
ALTER TABLE design_session_history ENABLE ROW LEVEL SECURITY;

-- Design Sessions Policies
CREATE POLICY "Users can view own sessions"
  ON design_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sessions"
  ON design_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions"
  ON design_sessions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own sessions"
  ON design_sessions FOR DELETE
  USING (auth.uid() = user_id);

-- Design Session Screens Policies
CREATE POLICY "Users can view own screens"
  ON design_session_screens FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM design_sessions
      WHERE design_sessions.id = design_session_screens.session_id
      AND design_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own screens"
  ON design_session_screens FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM design_sessions
      WHERE design_sessions.id = design_session_screens.session_id
      AND design_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own screens"
  ON design_session_screens FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM design_sessions
      WHERE design_sessions.id = design_session_screens.session_id
      AND design_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own screens"
  ON design_session_screens FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM design_sessions
      WHERE design_sessions.id = design_session_screens.session_id
      AND design_sessions.user_id = auth.uid()
    )
  );

-- Design Session History Policies
CREATE POLICY "Users can view own history"
  ON design_session_history FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM design_sessions
      WHERE design_sessions.id = design_session_history.session_id
      AND design_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own history"
  ON design_session_history FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM design_sessions
      WHERE design_sessions.id = design_session_history.session_id
      AND design_sessions.user_id = auth.uid()
    )
  );

-- =====================================================
-- Supabase Storage Bucket for Design Assets
-- =====================================================

-- Create design-assets bucket (if not exists)
INSERT INTO storage.buckets (id, name, public)
VALUES ('design-assets', 'design-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS Policies
CREATE POLICY "Users can upload their own assets"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'design-assets' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can view their own assets"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'design-assets' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can update their own assets"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'design-assets' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete their own assets"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'design-assets' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Public read access to design assets (for sharing)
CREATE POLICY "Public can view design assets"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'design-assets');

-- =====================================================
-- Helper Functions
-- =====================================================

-- Function to get user's design sessions list
CREATE OR REPLACE FUNCTION get_user_design_sessions(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  session_name TEXT,
  status TEXT,
  current_stage INTEGER,
  app_name TEXT,
  logo_url TEXT,
  total_screens_generated INTEGER,
  credits_used INTEGER,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ds.id,
    ds.session_name,
    ds.status,
    ds.current_stage,
    ds.app_name,
    ds.logo_url,
    ds.total_screens_generated,
    ds.credits_used,
    ds.created_at,
    ds.updated_at,
    ds.completed_at
  FROM design_sessions ds
  WHERE ds.user_id = p_user_id
  ORDER BY ds.updated_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get session with all screens
CREATE OR REPLACE FUNCTION get_design_session_with_screens(p_session_id UUID, p_user_id UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'session', row_to_json(ds),
    'screens', COALESCE(
      (SELECT json_agg(row_to_json(dss))
       FROM design_session_screens dss
       WHERE dss.session_id = ds.id
       ORDER BY dss.created_at),
      '[]'::json
    )
  ) INTO result
  FROM design_sessions ds
  WHERE ds.id = p_session_id
    AND ds.user_id = p_user_id;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Comments for Documentation
-- =====================================================

COMMENT ON TABLE design_sessions IS 'Stores user design wizard sessions with app metadata, style preferences, and generated assets';
COMMENT ON TABLE design_session_screens IS 'Individual screen mockups generated during the wizard process';
COMMENT ON TABLE design_session_history IS 'Audit log of actions performed during the design session';

COMMENT ON COLUMN design_sessions.status IS 'Session status: draft (in progress), completed (finished wizard), generating (code generation in progress)';
COMMENT ON COLUMN design_sessions.current_stage IS 'Current wizard stage: 1=App Info, 2=Style & References, 3=Logo, 4=Key Screens, 5=Additional Screens, 6=Review & Generate';
COMMENT ON COLUMN design_sessions.ai_config IS 'AI/LLM intelligence configuration: { enabled, provider, model, features, context, streaming }';
COMMENT ON COLUMN design_sessions.prd_data IS 'Complete Product Requirements Document in JSON format, generated when user clicks "Generate App Code"';
COMMENT ON COLUMN design_sessions.generated_code_url IS 'URL to the generated React Native Expo code ZIP file in Supabase Storage';

COMMENT ON COLUMN design_session_screens.wizard_stage IS 'Wizard stage where screen was generated: 3=Logo, 4=Key Screens, 5=Additional Screens';
COMMENT ON COLUMN design_session_screens.is_selected IS 'Whether user selected this variation (true) or it was discarded (false)';

-- Create saved_logos table
CREATE TABLE IF NOT EXISTS saved_logos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    image_url TEXT NOT NULL,
    app_name TEXT,
    prompt TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE saved_logos ENABLE ROW LEVEL SECURITY;

-- Users can read their own logos
CREATE POLICY "Users can read own logos" ON saved_logos
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own logos
CREATE POLICY "Users can insert own logos" ON saved_logos
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can delete their own logos
CREATE POLICY "Users can delete own logos" ON saved_logos
    FOR DELETE USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_saved_logos_user_id ON saved_logos(user_id);
CREATE INDEX idx_saved_logos_created_at ON saved_logos(created_at DESC);

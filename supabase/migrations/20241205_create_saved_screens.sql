-- Create saved_screens table
CREATE TABLE IF NOT EXISTS saved_screens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    image_url TEXT NOT NULL,
    prompt TEXT NOT NULL,
    model TEXT NOT NULL,
    output_format TEXT,
    aspect_ratio TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE saved_screens ENABLE ROW LEVEL SECURITY;

-- Users can read their own screens
CREATE POLICY "Users can read own screens" ON saved_screens
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own screens
CREATE POLICY "Users can insert own screens" ON saved_screens
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can delete their own screens
CREATE POLICY "Users can delete own screens" ON saved_screens
    FOR DELETE USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_saved_screens_user_id ON saved_screens(user_id);
CREATE INDEX idx_saved_screens_created_at ON saved_screens(created_at DESC);

-- Auto-update updated_at timestamp
CREATE TRIGGER saved_screens_updated_at
    BEFORE UPDATE ON saved_screens
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

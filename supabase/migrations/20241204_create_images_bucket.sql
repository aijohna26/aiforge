-- Create a storage bucket for images
INSERT INTO storage.buckets (id, name, public)
VALUES ('images', 'images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload images" ON storage.objects;
DROP POLICY IF EXISTS "Anon users can upload images" ON storage.objects;

-- Policy to allow public read access to images
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'images' );

-- Policy to allow anyone to upload images (for testing)
-- In production, you might want to restrict this to authenticated users only
CREATE POLICY "Anyone can upload images"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'images' );

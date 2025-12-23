-- Create images bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('images', 'images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Create policies safely
DO $$
BEGIN
    -- Allow public read access to all objects in the 'images' bucket
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE policyname = 'Images Public Access' 
        AND tablename = 'objects' 
        AND schemaname = 'storage'
    ) THEN
        CREATE POLICY "Images Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'images');
    END IF;

    -- Allow authenticated users to upload to 'images' bucket
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE policyname = 'Images Auth Uploads' 
        AND tablename = 'objects' 
        AND schemaname = 'storage'
    ) THEN
        CREATE POLICY "Images Auth Uploads" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'images' AND auth.role() = 'authenticated');
    END IF;

    -- Allow anonymous users to upload to 'images' bucket (useful for development/testing without auth)
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE policyname = 'Images Anon Uploads' 
        AND tablename = 'objects' 
        AND schemaname = 'storage'
    ) THEN
        CREATE POLICY "Images Anon Uploads" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'images' AND auth.role() = 'anon');
    END IF;
END $$;

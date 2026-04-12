-- Create storage bucket for images (profile photos) if not exists
INSERT INTO storage.buckets (id, name, public) 
VALUES ('images', 'images', true) 
ON CONFLICT (id) DO NOTHING;

-- Policies for images bucket
-- Allow public read access
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access Images" ON storage.objects FOR SELECT USING (bucket_id = 'images');

-- Allow authenticated users to upload their own avatars
DROP POLICY IF EXISTS "Authenticated Upload Images" ON storage.objects;
CREATE POLICY "Authenticated Upload Images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'images' AND auth.role() = 'authenticated');

-- Allow authenticated users to update/delete their own avatars
DROP POLICY IF EXISTS "Authenticated Update Images" ON storage.objects;
CREATE POLICY "Authenticated Update Images" ON storage.objects FOR UPDATE USING (bucket_id = 'images' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated Delete Images" ON storage.objects;
CREATE POLICY "Authenticated Delete Images" ON storage.objects FOR DELETE USING (bucket_id = 'images' AND auth.role() = 'authenticated');

-- Note: This bucket should be created manually in Supabase Dashboard
-- Storage → New bucket → name: "employer_logo" → Public: Yes

-- Create RLS policies for employer_logo bucket
CREATE POLICY "Allow public employer logo uploads"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'employer_logo');

CREATE POLICY "Allow public employer logo reads"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'employer_logo');

CREATE POLICY "Allow employer logo updates"
ON storage.objects FOR UPDATE
TO public
USING (bucket_id = 'employer_logo');

CREATE POLICY "Allow employer logo deletes"
ON storage.objects FOR DELETE
TO public
USING (bucket_id = 'employer_logo');

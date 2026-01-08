-- Create RLS policies for resume_storage bucket
-- This allows public uploads and reads for resume files

-- Policy to allow anyone to upload resumes (INSERT)
CREATE POLICY "Allow public resume uploads"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (bucket_id = 'resume_storage');

-- Policy to allow anyone to read resumes (SELECT)
CREATE POLICY "Allow public resume reads"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'resume_storage');

-- Policy to allow users to update their own resumes (UPDATE)
CREATE POLICY "Allow resume updates"
ON storage.objects
FOR UPDATE
TO public
USING (bucket_id = 'resume_storage')
WITH CHECK (bucket_id = 'resume_storage');

-- Policy to allow users to delete their own resumes (DELETE)
CREATE POLICY "Allow resume deletes"
ON storage.objects
FOR DELETE
TO public
USING (bucket_id = 'resume_storage');

-- Update RLS policies for employer_column_preferences to work with service role
-- Since employers use custom session cookies, not Supabase Auth,
-- we need to allow operations through the service role key

-- Drop existing policies
DROP POLICY IF EXISTS "Employers can manage their own column preferences" ON employer_column_preferences;

-- Disable RLS temporarily for employer column preferences
-- since employer authentication is handled via custom cookies, not Supabase Auth
ALTER TABLE employer_column_preferences DISABLE ROW LEVEL SECURITY;

-- Add a comment explaining the security model
COMMENT ON TABLE employer_column_preferences IS 'Column preferences for employers. RLS disabled because employer auth uses custom cookies, not Supabase Auth. Access control is handled at the application layer.';

-- Create team_members_history table to store previously used emails for autocomplete
CREATE TABLE IF NOT EXISTS team_members_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_id uuid NOT NULL REFERENCES employers(id) ON DELETE CASCADE,
  email varchar(255) NOT NULL,
  used_count integer DEFAULT 1,
  last_used_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(employer_id, email)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_team_members_employer ON team_members_history(employer_id);
CREATE INDEX IF NOT EXISTS idx_team_members_email ON team_members_history(employer_id, email);

-- Enable RLS
ALTER TABLE team_members_history ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Employers can view their own team members history"
  ON team_members_history
  FOR SELECT
  USING (employer_id = auth.uid());

CREATE POLICY "Employers can insert their own team members"
  ON team_members_history
  FOR INSERT
  WITH CHECK (employer_id = auth.uid());

CREATE POLICY "Employers can update their own team members"
  ON team_members_history
  FOR UPDATE
  USING (employer_id = auth.uid());

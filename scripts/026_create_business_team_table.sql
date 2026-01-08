-- Create business team/admin users table
CREATE TABLE IF NOT EXISTS business_team (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'admin', -- admin, super_admin, viewer
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE
);

-- Create index for email lookup
CREATE INDEX IF NOT EXISTS idx_business_team_email ON business_team(email);

-- Fixed password hash - valid bcrypt hash for "admin123"
INSERT INTO business_team (email, password_hash, full_name, role) 
VALUES (
  'admin@jobkarle.com', 
  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZRGdjGj/n3Rl1skLkqCzJYdPOE.jK',
  'Super Admin',
  'super_admin'
) ON CONFLICT (email) DO NOTHING;

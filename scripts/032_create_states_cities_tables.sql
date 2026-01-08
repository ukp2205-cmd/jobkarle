-- Creating completely separate states and cities tables

-- Create states table (separate, standalone)
CREATE TABLE IF NOT EXISTS states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  country TEXT DEFAULT 'India',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for states
CREATE INDEX IF NOT EXISTS idx_states_name ON states(name);

-- Added state_name column for easier queries without joins
-- Create cities table with both state_id (FK) and state_name (denormalized for easier queries)
CREATE TABLE IF NOT EXISTS cities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  state_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for cities
CREATE INDEX IF NOT EXISTS idx_cities_state_name ON cities(state_name);
CREATE INDEX IF NOT EXISTS idx_cities_name ON cities(name);

-- Enable Row Level Security
ALTER TABLE states ENABLE ROW LEVEL SECURITY;
ALTER TABLE cities ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
CREATE POLICY "Allow public read access to states" ON states FOR SELECT USING (true);
CREATE POLICY "Allow public read access to cities" ON cities FOR SELECT USING (true);

-- Insert all Indian states into states table
INSERT INTO states (name) VALUES
  ('Andhra Pradesh'),
  ('Arunachal Pradesh'),
  ('Assam'),
  ('Bihar'),
  ('Chhattisgarh'),
  ('Goa'),
  ('Gujarat'),
  ('Haryana'),
  ('Himachal Pradesh'),
  ('Jharkhand'),
  ('Karnataka'),
  ('Kerala'),
  ('Madhya Pradesh'),
  ('Maharashtra'),
  ('Manipur'),
  ('Meghalaya'),
  ('Mizoram'),
  ('Nagaland'),
  ('Odisha'),
  ('Punjab'),
  ('Rajasthan'),
  ('Sikkim'),
  ('Tamil Nadu'),
  ('Telangana'),
  ('Tripura'),
  ('Uttar Pradesh'),
  ('Uttarakhand'),
  ('West Bengal'),
  ('Delhi')
ON CONFLICT (name) DO NOTHING;

-- Simplified city inserts using state_name directly instead of foreign key lookups
-- Insert cities for Karnataka
INSERT INTO cities (name, state_name) VALUES
  ('Bengaluru', 'Karnataka'),
  ('Bangalore', 'Karnataka'),
  ('Mysuru', 'Karnataka'),
  ('Hubballi', 'Karnataka'),
  ('Mangaluru', 'Karnataka'),
  ('Belagavi', 'Karnataka'),
  ('Davanagere', 'Karnataka'),
  ('Ballari', 'Karnataka'),
  ('Tumakuru', 'Karnataka'),
  ('Shivamogga', 'Karnataka')
ON CONFLICT DO NOTHING;

-- Insert cities for Maharashtra
INSERT INTO cities (name, state_name) VALUES
  ('Mumbai', 'Maharashtra'),
  ('Pune', 'Maharashtra'),
  ('Nagpur', 'Maharashtra'),
  ('Thane', 'Maharashtra'),
  ('Nashik', 'Maharashtra'),
  ('Aurangabad', 'Maharashtra'),
  ('Solapur', 'Maharashtra'),
  ('Kolhapur', 'Maharashtra'),
  ('Navi Mumbai', 'Maharashtra')
ON CONFLICT DO NOTHING;

-- Insert cities for Delhi
INSERT INTO cities (name, state_name) VALUES
  ('Delhi', 'Delhi'),
  ('New Delhi', 'Delhi'),
  ('North Delhi', 'Delhi'),
  ('South Delhi', 'Delhi'),
  ('East Delhi', 'Delhi'),
  ('West Delhi', 'Delhi')
ON CONFLICT DO NOTHING;

-- Insert cities for Tamil Nadu
INSERT INTO cities (name, state_name) VALUES
  ('Chennai', 'Tamil Nadu'),
  ('Coimbatore', 'Tamil Nadu'),
  ('Madurai', 'Tamil Nadu'),
  ('Tiruchirappalli', 'Tamil Nadu'),
  ('Salem', 'Tamil Nadu'),
  ('Tirunelveli', 'Tamil Nadu'),
  ('Tiruppur', 'Tamil Nadu')
ON CONFLICT DO NOTHING;

-- Insert cities for Telangana
INSERT INTO cities (name, state_name) VALUES
  ('Hyderabad', 'Telangana'),
  ('Warangal', 'Telangana'),
  ('Nizamabad', 'Telangana'),
  ('Khammam', 'Telangana')
ON CONFLICT DO NOTHING;

-- Insert cities for Uttar Pradesh
INSERT INTO cities (name, state_name) VALUES
  ('Lucknow', 'Uttar Pradesh'),
  ('Kanpur', 'Uttar Pradesh'),
  ('Ghaziabad', 'Uttar Pradesh'),
  ('Agra', 'Uttar Pradesh'),
  ('Varanasi', 'Uttar Pradesh'),
  ('Noida', 'Uttar Pradesh'),
  ('Greater Noida', 'Uttar Pradesh')
ON CONFLICT DO NOTHING;

-- Insert cities for West Bengal
INSERT INTO cities (name, state_name) VALUES
  ('Kolkata', 'West Bengal'),
  ('Howrah', 'West Bengal'),
  ('Durgapur', 'West Bengal'),
  ('Asansol', 'West Bengal')
ON CONFLICT DO NOTHING;

-- Insert cities for Gujarat
INSERT INTO cities (name, state_name) VALUES
  ('Ahmedabad', 'Gujarat'),
  ('Surat', 'Gujarat'),
  ('Vadodara', 'Gujarat'),
  ('Rajkot', 'Gujarat')
ON CONFLICT DO NOTHING;

-- Insert cities for Rajasthan
INSERT INTO cities (name, state_name) VALUES
  ('Jaipur', 'Rajasthan'),
  ('Jodhpur', 'Rajasthan'),
  ('Kota', 'Rajasthan'),
  ('Udaipur', 'Rajasthan')
ON CONFLICT DO NOTHING;

-- Insert cities for Haryana
INSERT INTO cities (name, state_name) VALUES
  ('Gurugram', 'Haryana'),
  ('Gurgaon', 'Haryana'),
  ('Faridabad', 'Haryana'),
  ('Panipat', 'Haryana')
ON CONFLICT DO NOTHING;

-- Insert cities for Kerala
INSERT INTO cities (name, state_name) VALUES
  ('Kochi', 'Kerala'),
  ('Thiruvananthapuram', 'Kerala'),
  ('Kozhikode', 'Kerala')
ON CONFLICT DO NOTHING;

-- Insert cities for Punjab  
INSERT INTO cities (name, state_name) VALUES
  ('Ludhiana', 'Punjab'),
  ('Amritsar', 'Punjab'),
  ('Jalandhar', 'Punjab')
ON CONFLICT DO NOTHING;

-- Insert cities for Madhya Pradesh
INSERT INTO cities (name, state_name) VALUES
  ('Indore', 'Madhya Pradesh'),
  ('Bhopal', 'Madhya Pradesh'),
  ('Jabalpur', 'Madhya Pradesh')
ON CONFLICT DO NOTHING;

-- Insert cities for Andhra Pradesh
INSERT INTO cities (name, state_name) VALUES
  ('Visakhapatnam', 'Andhra Pradesh'),
  ('Vijayawada', 'Andhra Pradesh')
ON CONFLICT DO NOTHING;

-- Creating industries table for uploading industry.csv file

-- Create industries table (standalone, similar to states table)
CREATE TABLE IF NOT EXISTS industries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for industries name for faster lookups
CREATE INDEX IF NOT EXISTS idx_industries_name ON industries(name);

-- Enable Row Level Security
ALTER TABLE industries ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access (anyone can read industries)
CREATE POLICY "Allow public read access to industries" ON industries FOR SELECT USING (true);

-- Create policy for authenticated insert (for CSV upload)
CREATE POLICY "Allow authenticated insert to industries" ON industries 
  FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');

-- Create policy for authenticated update (for editing industries)
CREATE POLICY "Allow authenticated update to industries" ON industries 
  FOR UPDATE 
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Insert some default industries (you can replace these when uploading CSV)
INSERT INTO industries (name, description) VALUES
  ('Information Technology', 'Software development, IT services, and technology solutions'),
  ('Healthcare', 'Medical services, pharmaceuticals, and healthcare facilities'),
  ('Finance', 'Banking, insurance, and financial services'),
  ('Education', 'Schools, colleges, training institutes, and e-learning'),
  ('Manufacturing', 'Production of goods and industrial manufacturing'),
  ('Retail', 'Retail stores, e-commerce, and consumer goods'),
  ('Hospitality', 'Hotels, restaurants, and tourism services'),
  ('Real Estate', 'Property development, sales, and management'),
  ('Telecommunications', 'Telecom services and communication infrastructure'),
  ('Automotive', 'Automobile manufacturing and services'),
  ('Construction', 'Building construction and infrastructure development'),
  ('Media & Entertainment', 'Broadcasting, publishing, and entertainment services'),
  ('Agriculture', 'Farming, agribusiness, and food production'),
  ('Consulting', 'Business consulting and professional services'),
  ('Transportation & Logistics', 'Shipping, logistics, and supply chain management'),
  ('Energy', 'Power generation, oil & gas, and renewable energy'),
  ('Pharmaceutical', 'Drug development and pharmaceutical manufacturing'),
  ('E-commerce', 'Online retail and marketplace platforms'),
  ('Marketing & Advertising', 'Marketing agencies and advertising services'),
  ('Fashion & Apparel', 'Clothing design, manufacturing, and retail'),
  ('Legal Services', 'Law firms and legal consultancy'),
  ('Human Resources', 'HR services and recruitment agencies'),
  ('Aerospace', 'Aviation and aerospace engineering'),
  ('Biotechnology', 'Biotech research and development'),
  ('Gaming', 'Video game development and esports'),
  ('Food & Beverage', 'Food processing and beverage manufacturing'),
  ('Insurance', 'Insurance products and services'),
  ('Non-Profit', 'NGOs and charitable organizations'),
  ('Government', 'Government agencies and public sector'),
  ('Other', 'Other industries not listed above')
ON CONFLICT (name) DO NOTHING;

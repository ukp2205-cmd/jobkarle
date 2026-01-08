-- Insert 2 dummy education qualifications
INSERT INTO educations (education_name, description, education_level, is_active)
VALUES 
  ('B.Com', 'Bachelor of Commerce - A 3-year undergraduate program focused on commerce, accounting, and business studies', 'Bachelor', true),
  ('B.A.', 'Bachelor of Arts - A 3-year undergraduate program with diverse subject options including humanities and social sciences', 'Bachelor', true)
ON CONFLICT (name) DO NOTHING;

-- Insert specializations for B.Com
INSERT INTO education_specializations (education_id, specialization_name, description)
SELECT id, 'Finance & Accounting', 'Specialization in financial management, accounting principles, and auditing'
FROM educations WHERE name = 'B.Com'
ON CONFLICT (education_id, name) DO NOTHING;

INSERT INTO education_specializations (education_id, specialization_name, description)
SELECT id, 'Business Economics', 'Specialization in economic theory, business economics, and market analysis'
FROM educations WHERE name = 'B.Com'
ON CONFLICT (education_id, name) DO NOTHING;

-- Insert specializations for B.A.
INSERT INTO education_specializations (education_id, specialization_name, description)
SELECT id, 'English Literature', 'Specialization in literature, writing, and language studies'
FROM educations WHERE name = 'B.A.'
ON CONFLICT (education_id, name) DO NOTHING;

INSERT INTO education_specializations (education_id, specialization_name, description)
SELECT id, 'History', 'Specialization in historical studies, research, and cultural analysis'
FROM educations WHERE name = 'B.A.'
ON CONFLICT (education_id, name) DO NOTHING;

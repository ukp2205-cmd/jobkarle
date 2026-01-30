-- Populate role categories for all departments in the database
-- This script adds comprehensive role categories for each department

-- First, let's clear any orphaned role categories that reference non-existent departments
DELETE FROM role_categories WHERE department_id NOT IN (SELECT id FROM departments);

-- Software Development Department
INSERT INTO role_categories (department_id, role_category_name, description)
SELECT d.id, role_name, role_desc FROM departments d, (VALUES
  ('Frontend Developer', 'Build user interfaces using React, Vue, Angular'),
  ('Backend Developer', 'Develop server-side logic, APIs, databases'),
  ('Full Stack Developer', 'Work on both frontend and backend development'),
  ('Mobile Developer', 'Develop iOS and Android applications'),
  ('DevOps Engineer', 'Manage CI/CD pipelines, infrastructure automation'),
  ('Software Architect', 'Design system architecture and technical solutions'),
  ('Tech Lead', 'Lead development teams and technical decisions'),
  ('Engineering Manager', 'Manage engineering teams and projects'),
  ('QA Engineer', 'Test software quality and automation'),
  ('Site Reliability Engineer', 'Ensure system reliability and performance')
) AS roles(role_name, role_desc)
WHERE d.department_name = 'Software Development'
ON CONFLICT DO NOTHING;

-- Data Science & Analytics Department
INSERT INTO role_categories (department_id, role_category_name, description)
SELECT d.id, role_name, role_desc FROM departments d, (VALUES
  ('Data Scientist', 'Analyze data and build ML models'),
  ('Data Analyst', 'Extract insights from data'),
  ('ML Engineer', 'Build and deploy machine learning systems'),
  ('Data Engineer', 'Build data pipelines and infrastructure'),
  ('Business Analyst', 'Analyze business requirements and data'),
  ('Analytics Manager', 'Lead analytics teams and strategy'),
  ('AI Research Scientist', 'Research and develop AI algorithms')
) AS roles(role_name, role_desc)
WHERE d.department_name = 'Data Science & Analytics'
ON CONFLICT DO NOTHING;

-- Product Management Department
INSERT INTO role_categories (department_id, role_category_name, description)
SELECT d.id, role_name, role_desc FROM departments d, (VALUES
  ('Product Manager', 'Define product strategy and roadmap'),
  ('Senior Product Manager', 'Lead product development initiatives'),
  ('Product Owner', 'Manage product backlog and priorities'),
  ('Technical Product Manager', 'Bridge technical and product teams'),
  ('Director of Product', 'Oversee product organization'),
  ('VP of Product', 'Executive product leadership')
) AS roles(role_name, role_desc)
WHERE d.department_name = 'Product Management'
ON CONFLICT DO NOTHING;

-- UI/UX Design Department
INSERT INTO role_categories (department_id, role_category_name, description)
SELECT d.id, role_name, role_desc FROM departments d, (VALUES
  ('UI Designer', 'Design user interfaces'),
  ('UX Designer', 'Design user experiences'),
  ('Product Designer', 'Design end-to-end product experiences'),
  ('Visual Designer', 'Create visual designs and branding'),
  ('Interaction Designer', 'Design interactive experiences'),
  ('UX Researcher', 'Research user behavior and needs'),
  ('Design Manager', 'Lead design teams')
) AS roles(role_name, role_desc)
WHERE d.department_name = 'UI/UX Design'
ON CONFLICT DO NOTHING;

-- DevOps & Infrastructure Department
INSERT INTO role_categories (department_id, role_category_name, description)
SELECT d.id, role_name, role_desc FROM departments d, (VALUES
  ('DevOps Engineer', 'Automate deployment and infrastructure'),
  ('Cloud Engineer', 'Manage cloud infrastructure'),
  ('Infrastructure Engineer', 'Build and maintain infrastructure'),
  ('Platform Engineer', 'Build internal development platforms'),
  ('Systems Administrator', 'Manage servers and systems'),
  ('Network Engineer', 'Design and maintain networks'),
  ('Security Engineer', 'Implement security measures')
) AS roles(role_name, role_desc)
WHERE d.department_name = 'DevOps & Infrastructure'
ON CONFLICT DO NOTHING;

-- Quality Assurance Department
INSERT INTO role_categories (department_id, role_category_name, description)
SELECT d.id, role_name, role_desc FROM departments d, (VALUES
  ('QA Engineer', 'Test software quality'),
  ('Test Automation Engineer', 'Build automated tests'),
  ('Performance Test Engineer', 'Test system performance'),
  ('Security Test Engineer', 'Test security vulnerabilities'),
  ('QA Manager', 'Lead QA teams'),
  ('QA Analyst', 'Analyze quality metrics')
) AS roles(role_name, role_desc)
WHERE d.department_name = 'Quality Assurance'
ON CONFLICT DO NOTHING;

-- Customer Support Department
INSERT INTO role_categories (department_id, role_category_name, description)
SELECT d.id, role_name, role_desc FROM departments d, (VALUES
  ('Customer Support Representative', 'Assist customers with issues'),
  ('Technical Support Engineer', 'Provide technical customer support'),
  ('Customer Success Manager', 'Ensure customer success and retention'),
  ('Support Team Lead', 'Lead support teams'),
  ('Customer Support Manager', 'Manage customer support operations')
) AS roles(role_name, role_desc)
WHERE d.department_name = 'Customer Support'
ON CONFLICT DO NOTHING;

-- Technical Support Department
INSERT INTO role_categories (department_id, role_category_name, description)
SELECT d.id, role_name, role_desc FROM departments d, (VALUES
  ('Technical Support Specialist', 'Provide technical assistance'),
  ('L1 Support Engineer', 'First level technical support'),
  ('L2 Support Engineer', 'Advanced technical support'),
  ('L3 Support Engineer', 'Expert level technical support'),
  ('Technical Support Manager', 'Manage technical support teams')
) AS roles(role_name, role_desc)
WHERE d.department_name = 'Technical Support'
ON CONFLICT DO NOTHING;

-- Administration Department
INSERT INTO role_categories (department_id, role_category_name, description)
SELECT d.id, role_name, role_desc FROM departments d, (VALUES
  ('Administrative Assistant', 'Provide administrative support'),
  ('Office Manager', 'Manage office operations'),
  ('Executive Assistant', 'Support executives'),
  ('Receptionist', 'Manage front desk operations'),
  ('Office Coordinator', 'Coordinate office activities')
) AS roles(role_name, role_desc)
WHERE d.department_name = 'Administration'
ON CONFLICT DO NOTHING;

-- Legal & Compliance Department
INSERT INTO role_categories (department_id, role_category_name, description)
SELECT d.id, role_name, role_desc FROM departments d, (VALUES
  ('Legal Counsel', 'Provide legal advice'),
  ('Compliance Officer', 'Ensure regulatory compliance'),
  ('Contract Manager', 'Manage contracts and agreements'),
  ('Paralegal', 'Provide legal support'),
  ('General Counsel', 'Lead legal department')
) AS roles(role_name, role_desc)
WHERE d.department_name = 'Legal & Compliance'
ON CONFLICT DO NOTHING;

-- Add "Other" role category to all departments
INSERT INTO role_categories (department_id, role_category_name, description)
SELECT id, 'Other', 'Other roles not listed above'
FROM departments
WHERE NOT EXISTS (
  SELECT 1 FROM role_categories 
  WHERE department_id = departments.id 
  AND role_category_name = 'Other'
);

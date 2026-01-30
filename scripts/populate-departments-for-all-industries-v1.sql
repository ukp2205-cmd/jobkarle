-- This script populates departments for ALL existing industries in the database
-- It queries the industries table and inserts appropriate departments for each industry type

-- First, let's add industry-specific departments based on industry names/categories

-- Technology/IT related industries (Software Development, IT, Technology, etc.)
INSERT INTO public.departments (department_name, industry_id, description) 
SELECT 'Software Development', id, 'Design, development, and maintenance of software applications'
FROM public.industries 
WHERE LOWER(name) LIKE '%software%' OR LOWER(name) LIKE '%technology%' OR LOWER(name) LIKE '%it%' OR LOWER(name) = 'information technology'
ON CONFLICT DO NOTHING;

INSERT INTO public.departments (department_name, industry_id, description) 
SELECT 'Quality Assurance', id, 'Testing and quality control'
FROM public.industries 
WHERE LOWER(name) LIKE '%software%' OR LOWER(name) LIKE '%technology%' OR LOWER(name) LIKE '%it%'
ON CONFLICT DO NOTHING;

INSERT INTO public.departments (department_name, industry_id, description) 
SELECT 'DevOps & Infrastructure', id, 'System operations and infrastructure'
FROM public.industries 
WHERE LOWER(name) LIKE '%software%' OR LOWER(name) LIKE '%technology%' OR LOWER(name) LIKE '%it%'
ON CONFLICT DO NOTHING;

INSERT INTO public.departments (department_name, industry_id, description) 
SELECT 'Data Science & Analytics', id, 'Data analysis and machine learning'
FROM public.industries 
WHERE LOWER(name) LIKE '%software%' OR LOWER(name) LIKE '%technology%' OR LOWER(name) LIKE '%it%' OR LOWER(name) LIKE '%data%'
ON CONFLICT DO NOTHING;

INSERT INTO public.departments (department_name, industry_id, description) 
SELECT 'Product Management', id, 'Product strategy and development'
FROM public.industries 
WHERE LOWER(name) LIKE '%software%' OR LOWER(name) LIKE '%technology%' OR LOWER(name) LIKE '%it%' OR LOWER(name) LIKE '%product%'
ON CONFLICT DO NOTHING;

INSERT INTO public.departments (department_name, industry_id, description) 
SELECT 'UI/UX Design', id, 'User interface and experience design'
FROM public.industries 
WHERE LOWER(name) LIKE '%software%' OR LOWER(name) LIKE '%technology%' OR LOWER(name) LIKE '%it%' OR LOWER(name) LIKE '%design%'
ON CONFLICT DO NOTHING;

INSERT INTO public.departments (department_name, industry_id, description) 
SELECT 'Technical Support', id, 'IT support and customer technical assistance'
FROM public.industries 
WHERE LOWER(name) LIKE '%software%' OR LOWER(name) LIKE '%technology%' OR LOWER(name) LIKE '%it%' OR LOWER(name) LIKE '%support%'
ON CONFLICT DO NOTHING;

-- Healthcare related industries
INSERT INTO public.departments (department_name, industry_id, description) 
SELECT 'Medical Services', id, 'Clinical care and treatment'
FROM public.industries 
WHERE LOWER(name) LIKE '%health%' OR LOWER(name) LIKE '%medical%' OR LOWER(name) LIKE '%hospital%'
ON CONFLICT DO NOTHING;

INSERT INTO public.departments (department_name, industry_id, description) 
SELECT 'Nursing', id, 'Patient care services'
FROM public.industries 
WHERE LOWER(name) LIKE '%health%' OR LOWER(name) LIKE '%medical%' OR LOWER(name) LIKE '%hospital%'
ON CONFLICT DO NOTHING;

INSERT INTO public.departments (department_name, industry_id, description) 
SELECT 'Pharmacy', id, 'Pharmaceutical services'
FROM public.industries 
WHERE LOWER(name) LIKE '%health%' OR LOWER(name) LIKE '%medical%' OR LOWER(name) LIKE '%hospital%' OR LOWER(name) LIKE '%pharm%'
ON CONFLICT DO NOTHING;

-- Marketing related industries
INSERT INTO public.departments (department_name, industry_id, description) 
SELECT 'Digital Marketing', id, 'Online and social media marketing'
FROM public.industries 
WHERE LOWER(name) LIKE '%market%' OR LOWER(name) LIKE '%advertis%' OR LOWER(name) LIKE '%media%'
ON CONFLICT DO NOTHING;

INSERT INTO public.departments (department_name, industry_id, description) 
SELECT 'Content Creation', id, 'Content writing and creative production'
FROM public.industries 
WHERE LOWER(name) LIKE '%market%' OR LOWER(name) LIKE '%advertis%' OR LOWER(name) LIKE '%media%' OR LOWER(name) LIKE '%content%'
ON CONFLICT DO NOTHING;

INSERT INTO public.departments (department_name, industry_id, description) 
SELECT 'Brand Management', id, 'Brand strategy and positioning'
FROM public.industries 
WHERE LOWER(name) LIKE '%market%' OR LOWER(name) LIKE '%advertis%' OR LOWER(name) LIKE '%brand%'
ON CONFLICT DO NOTHING;

INSERT INTO public.departments (department_name, industry_id, description) 
SELECT 'SEO & SEM', id, 'Search engine optimization and marketing'
FROM public.industries 
WHERE LOWER(name) LIKE '%market%' OR LOWER(name) LIKE '%digital%'
ON CONFLICT DO NOTHING;

-- Finance/Banking related industries
INSERT INTO public.departments (department_name, industry_id, description) 
SELECT 'Accounting', id, 'Financial accounting and reporting'
FROM public.industries 
WHERE LOWER(name) LIKE '%financ%' OR LOWER(name) LIKE '%bank%' OR LOWER(name) LIKE '%account%'
ON CONFLICT DO NOTHING;

INSERT INTO public.departments (department_name, industry_id, description) 
SELECT 'Risk Management', id, 'Financial risk assessment'
FROM public.industries 
WHERE LOWER(name) LIKE '%financ%' OR LOWER(name) LIKE '%bank%' OR LOWER(name) LIKE '%insurance%'
ON CONFLICT DO NOTHING;

INSERT INTO public.departments (department_name, industry_id, description) 
SELECT 'Investment Banking', id, 'Corporate finance services'
FROM public.industries 
WHERE LOWER(name) LIKE '%bank%' OR LOWER(name) LIKE '%investment%'
ON CONFLICT DO NOTHING;

-- BPO/Call Center industries
INSERT INTO public.departments (department_name, industry_id, description) 
SELECT 'Customer Service', id, 'Customer support and assistance'
FROM public.industries 
WHERE LOWER(name) LIKE '%bpo%' OR LOWER(name) LIKE '%call%' OR LOWER(name) LIKE '%customer%' OR LOWER(name) LIKE '%service%' OR LOWER(name) LIKE '%support%'
ON CONFLICT DO NOTHING;

INSERT INTO public.departments (department_name, industry_id, description) 
SELECT 'Technical Support', id, 'Technical helpdesk services'
FROM public.industries 
WHERE LOWER(name) LIKE '%bpo%' OR LOWER(name) LIKE '%call%' OR LOWER(name) LIKE '%support%' OR LOWER(name) LIKE '%technical%'
ON CONFLICT DO NOTHING;

INSERT INTO public.departments (department_name, industry_id, description) 
SELECT 'Sales & Telemarketing', id, 'Outbound sales and telemarketing'
FROM public.industries 
WHERE LOWER(name) LIKE '%bpo%' OR LOWER(name) LIKE '%call%' OR LOWER(name) LIKE '%tele%'
ON CONFLICT DO NOTHING;

INSERT INTO public.departments (department_name, industry_id, description) 
SELECT 'Quality Assurance', id, 'Call quality monitoring'
FROM public.industries 
WHERE LOWER(name) LIKE '%bpo%' OR LOWER(name) LIKE '%call%'
ON CONFLICT DO NOTHING;

INSERT INTO public.departments (department_name, industry_id, description) 
SELECT 'Training & Development', id, 'Employee training programs'
FROM public.industries 
WHERE LOWER(name) LIKE '%bpo%' OR LOWER(name) LIKE '%call%' OR LOWER(name) LIKE '%training%'
ON CONFLICT DO NOTHING;

-- Manufacturing industries
INSERT INTO public.departments (department_name, industry_id, description) 
SELECT 'Production', id, 'Manufacturing operations'
FROM public.industries 
WHERE LOWER(name) LIKE '%manufactur%' OR LOWER(name) LIKE '%production%' OR LOWER(name) LIKE '%industry%'
ON CONFLICT DO NOTHING;

INSERT INTO public.departments (department_name, industry_id, description) 
SELECT 'Quality Control', id, 'Product quality assurance'
FROM public.industries 
WHERE LOWER(name) LIKE '%manufactur%' OR LOWER(name) LIKE '%production%'
ON CONFLICT DO NOTHING;

INSERT INTO public.departments (department_name, industry_id, description) 
SELECT 'Supply Chain & Logistics', id, 'Supply chain management'
FROM public.industries 
WHERE LOWER(name) LIKE '%manufactur%' OR LOWER(name) LIKE '%production%' OR LOWER(name) LIKE '%logistics%' OR LOWER(name) LIKE '%supply%'
ON CONFLICT DO NOTHING;

INSERT INTO public.departments (department_name, industry_id, description) 
SELECT 'Engineering', id, 'Manufacturing engineering'
FROM public.industries 
WHERE LOWER(name) LIKE '%manufactur%' OR LOWER(name) LIKE '%engineering%'
ON CONFLICT DO NOTHING;

-- Retail/E-commerce industries
INSERT INTO public.departments (department_name, industry_id, description) 
SELECT 'Store Operations', id, 'Retail store management'
FROM public.industries 
WHERE LOWER(name) LIKE '%retail%' OR LOWER(name) LIKE '%store%' OR LOWER(name) LIKE '%shop%'
ON CONFLICT DO NOTHING;

INSERT INTO public.departments (department_name, industry_id, description) 
SELECT 'Merchandising', id, 'Product display and merchandising'
FROM public.industries 
WHERE LOWER(name) LIKE '%retail%' OR LOWER(name) LIKE '%e-commerce%' OR LOWER(name) LIKE '%ecommerce%'
ON CONFLICT DO NOTHING;

INSERT INTO public.departments (department_name, industry_id, description) 
SELECT 'Inventory Management', id, 'Stock control and inventory'
FROM public.industries 
WHERE LOWER(name) LIKE '%retail%' OR LOWER(name) LIKE '%e-commerce%' OR LOWER(name) LIKE '%warehouse%'
ON CONFLICT DO NOTHING;

-- Education industries
INSERT INTO public.departments (department_name, industry_id, description) 
SELECT 'Teaching & Faculty', id, 'Academic teaching staff'
FROM public.industries 
WHERE LOWER(name) LIKE '%educat%' OR LOWER(name) LIKE '%school%' OR LOWER(name) LIKE '%univers%' OR LOWER(name) LIKE '%college%'
ON CONFLICT DO NOTHING;

INSERT INTO public.departments (department_name, industry_id, description) 
SELECT 'Administration', id, 'Educational administration'
FROM public.industries 
WHERE LOWER(name) LIKE '%educat%' OR LOWER(name) LIKE '%school%' OR LOWER(name) LIKE '%univers%'
ON CONFLICT DO NOTHING;

INSERT INTO public.departments (department_name, industry_id, description) 
SELECT 'Student Services', id, 'Student support and counseling'
FROM public.industries 
WHERE LOWER(name) LIKE '%educat%' OR LOWER(name) LIKE '%school%' OR LOWER(name) LIKE '%univers%'
ON CONFLICT DO NOTHING;

-- Consulting industries
INSERT INTO public.departments (department_name, industry_id, description) 
SELECT 'Management Consulting', id, 'Business strategy consulting'
FROM public.industries 
WHERE LOWER(name) LIKE '%consult%' OR LOWER(name) LIKE '%advisory%'
ON CONFLICT DO NOTHING;

INSERT INTO public.departments (department_name, industry_id, description) 
SELECT 'IT Consulting', id, 'Technology consulting services'
FROM public.industries 
WHERE LOWER(name) LIKE '%consult%'
ON CONFLICT DO NOTHING;

-- Now add GENERIC departments that apply to ALL industries
-- These are common departments every organization needs

-- HR for all industries
INSERT INTO public.departments (department_name, industry_id, description) 
SELECT 'Human Resources', i.id, 'HR management, recruitment, and employee relations'
FROM public.industries i
WHERE NOT EXISTS (
  SELECT 1 FROM public.departments d 
  WHERE d.industry_id = i.id AND d.department_name = 'Human Resources'
)
ON CONFLICT DO NOTHING;

-- Finance for all industries (except those already with Accounting)
INSERT INTO public.departments (department_name, industry_id, description) 
SELECT 'Finance & Accounts', i.id, 'Financial planning, accounting, and reporting'
FROM public.industries i
WHERE NOT EXISTS (
  SELECT 1 FROM public.departments d 
  WHERE d.industry_id = i.id AND d.department_name IN ('Finance & Accounts', 'Accounting')
)
ON CONFLICT DO NOTHING;

-- Operations for all industries
INSERT INTO public.departments (department_name, industry_id, description) 
SELECT 'Operations', i.id, 'Business operations and management'
FROM public.industries i
WHERE NOT EXISTS (
  SELECT 1 FROM public.departments d 
  WHERE d.industry_id = i.id AND d.department_name = 'Operations'
)
ON CONFLICT DO NOTHING;

-- Sales & Marketing for most industries (except those with specific marketing depts)
INSERT INTO public.departments (department_name, industry_id, description) 
SELECT 'Sales & Marketing', i.id, 'Sales and marketing functions'
FROM public.industries i
WHERE NOT EXISTS (
  SELECT 1 FROM public.departments d 
  WHERE d.industry_id = i.id AND d.department_name IN ('Sales & Marketing', 'Digital Marketing')
)
ON CONFLICT DO NOTHING;

-- IT/Technology department for all industries
INSERT INTO public.departments (department_name, industry_id, description) 
SELECT 'IT & Technology', i.id, 'Information technology and systems'
FROM public.industries i
WHERE NOT EXISTS (
  SELECT 1 FROM public.departments d 
  WHERE d.industry_id = i.id AND d.department_name IN ('IT & Technology', 'Software Development')
)
AND LOWER(i.name) NOT LIKE '%software%' 
AND LOWER(i.name) NOT LIKE '%technology%'
AND LOWER(i.name) NOT LIKE '%it%'
ON CONFLICT DO NOTHING;

-- Administration for all industries
INSERT INTO public.departments (department_name, industry_id, description) 
SELECT 'Administration', i.id, 'General administration and office management'
FROM public.industries i
WHERE NOT EXISTS (
  SELECT 1 FROM public.departments d 
  WHERE d.industry_id = i.id AND d.department_name = 'Administration'
)
ON CONFLICT DO NOTHING;

-- Customer Support for service-oriented industries
INSERT INTO public.departments (department_name, industry_id, description) 
SELECT 'Customer Support', i.id, 'Customer service and support'
FROM public.industries i
WHERE NOT EXISTS (
  SELECT 1 FROM public.departments d 
  WHERE d.industry_id = i.id AND d.department_name IN ('Customer Support', 'Customer Service')
)
ON CONFLICT DO NOTHING;

-- Legal & Compliance for all industries
INSERT INTO public.departments (department_name, industry_id, description) 
SELECT 'Legal & Compliance', i.id, 'Legal affairs and regulatory compliance'
FROM public.industries i
WHERE NOT EXISTS (
  SELECT 1 FROM public.departments d 
  WHERE d.industry_id = i.id AND d.department_name = 'Legal & Compliance'
)
ON CONFLICT DO NOTHING;

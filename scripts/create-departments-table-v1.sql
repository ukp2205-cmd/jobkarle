-- Create departments table with industry_id foreign key
CREATE TABLE IF NOT EXISTS public.departments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  department_name VARCHAR(255) NOT NULL,
  industry_id UUID NOT NULL REFERENCES public.industries(id) ON DELETE CASCADE,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_departments_industry_id ON public.departments(industry_id);
CREATE INDEX IF NOT EXISTS idx_departments_active ON public.departments(is_active) WHERE is_active = true;

-- Enable RLS
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow public read access to departments" ON public.departments FOR SELECT USING (true);
CREATE POLICY "Allow authenticated insert to departments" ON public.departments FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated update to departments" ON public.departments FOR UPDATE USING (auth.role() = 'authenticated');

-- Now populate with comprehensive department data for each industry
-- First, let's get all industries and add departments for each

-- IT/Technology Industry Departments
INSERT INTO public.departments (department_name, industry_id, description) 
SELECT 'Software Development', id, 'Design, development, and maintenance of software applications'
FROM public.industries WHERE name = 'Information Technology';

INSERT INTO public.departments (department_name, industry_id, description) 
SELECT 'Quality Assurance', id, 'Testing and quality control of software products'
FROM public.industries WHERE name = 'Information Technology';

INSERT INTO public.departments (department_name, industry_id, description) 
SELECT 'DevOps', id, 'Infrastructure, deployment, and operations'
FROM public.industries WHERE name = 'Information Technology';

INSERT INTO public.departments (department_name, industry_id, description) 
SELECT 'Data Science & Analytics', id, 'Data analysis, machine learning, and AI'
FROM public.industries WHERE name = 'Information Technology';

INSERT INTO public.departments (department_name, industry_id, description) 
SELECT 'Cybersecurity', id, 'Security operations and threat management'
FROM public.industries WHERE name = 'Information Technology';

INSERT INTO public.departments (department_name, industry_id, description) 
SELECT 'IT Support', id, 'Technical support and helpdesk services'
FROM public.industries WHERE name = 'Information Technology';

INSERT INTO public.departments (department_name, industry_id, description) 
SELECT 'Product Management', id, 'Product strategy and roadmap planning'
FROM public.industries WHERE name = 'Information Technology';

-- Healthcare Industry Departments
INSERT INTO public.departments (department_name, industry_id, description) 
SELECT 'Medical Services', id, 'Clinical care and medical treatment'
FROM public.industries WHERE name = 'Healthcare';

INSERT INTO public.departments (department_name, industry_id, description) 
SELECT 'Nursing', id, 'Patient care and nursing services'
FROM public.industries WHERE name = 'Healthcare';

INSERT INTO public.departments (department_name, industry_id, description) 
SELECT 'Pharmacy', id, 'Pharmaceutical services and medication management'
FROM public.industries WHERE name = 'Healthcare';

INSERT INTO public.departments (department_name, industry_id, description) 
SELECT 'Laboratory', id, 'Diagnostic testing and lab analysis'
FROM public.industries WHERE name = 'Healthcare';

INSERT INTO public.departments (department_name, industry_id, description) 
SELECT 'Radiology', id, 'Medical imaging and diagnostic radiology'
FROM public.industries WHERE name = 'Healthcare';

INSERT INTO public.departments (department_name, industry_id, description) 
SELECT 'Administration', id, 'Healthcare facility management'
FROM public.industries WHERE name = 'Healthcare';

-- Finance & Banking Industry Departments
INSERT INTO public.departments (department_name, industry_id, description) 
SELECT 'Retail Banking', id, 'Customer banking services'
FROM public.industries WHERE name = 'Banking & Finance';

INSERT INTO public.departments (department_name, industry_id, description) 
SELECT 'Investment Banking', id, 'Corporate finance and capital markets'
FROM public.industries WHERE name = 'Banking & Finance';

INSERT INTO public.departments (department_name, industry_id, description) 
SELECT 'Risk Management', id, 'Financial risk assessment and mitigation'
FROM public.industries WHERE name = 'Banking & Finance';

INSERT INTO public.departments (department_name, industry_id, description) 
SELECT 'Accounting', id, 'Financial accounting and reporting'
FROM public.industries WHERE name = 'Banking & Finance';

INSERT INTO public.departments (department_name, industry_id, description) 
SELECT 'Compliance', id, 'Regulatory compliance and auditing'
FROM public.industries WHERE name = 'Banking & Finance';

-- Education Industry Departments  
INSERT INTO public.departments (department_name, industry_id, description) 
SELECT 'Teaching & Instruction', id, 'Classroom teaching and instruction'
FROM public.industries WHERE name = 'Education';

INSERT INTO public.departments (department_name, industry_id, description) 
SELECT 'Administration', id, 'School/college administration'
FROM public.industries WHERE name = 'Education';

INSERT INTO public.departments (department_name, industry_id, description) 
SELECT 'Curriculum Development', id, 'Course design and curriculum planning'
FROM public.industries WHERE name = 'Education';

INSERT INTO public.departments (department_name, industry_id, description) 
SELECT 'Student Services', id, 'Student support and counseling'
FROM public.industries WHERE name = 'Education';

INSERT INTO public.departments (department_name, industry_id, description) 
SELECT 'Research', id, 'Academic research and publications'
FROM public.industries WHERE name = 'Education';

-- Manufacturing Industry Departments
INSERT INTO public.departments (department_name, industry_id, description) 
SELECT 'Production', id, 'Manufacturing and production operations'
FROM public.industries WHERE name = 'Manufacturing';

INSERT INTO public.departments (department_name, industry_id, description) 
SELECT 'Quality Control', id, 'Product quality assurance'
FROM public.industries WHERE name = 'Manufacturing';

INSERT INTO public.departments (department_name, industry_id, description) 
SELECT 'Supply Chain', id, 'Logistics and supply chain management'
FROM public.industries WHERE name = 'Manufacturing';

INSERT INTO public.departments (department_name, industry_id, description) 
SELECT 'Engineering', id, 'Manufacturing engineering and process improvement'
FROM public.industries WHERE name = 'Manufacturing';

INSERT INTO public.departments (department_name, industry_id, description) 
SELECT 'Maintenance', id, 'Equipment and facility maintenance'
FROM public.industries WHERE name = 'Manufacturing';

-- Retail Industry Departments
INSERT INTO public.departments (department_name, industry_id, description) 
SELECT 'Sales', id, 'Customer sales and service'
FROM public.industries WHERE name = 'Retail';

INSERT INTO public.departments (department_name, industry_id, description) 
SELECT 'Store Operations', id, 'Store management and operations'
FROM public.industries WHERE name = 'Retail';

INSERT INTO public.departments (department_name, industry_id, description) 
SELECT 'Merchandising', id, 'Product selection and display'
FROM public.industries WHERE name = 'Retail';

INSERT INTO public.departments (department_name, industry_id, description) 
SELECT 'Inventory Management', id, 'Stock control and inventory'
FROM public.industries WHERE name = 'Retail';

INSERT INTO public.departments (department_name, industry_id, description) 
SELECT 'Customer Service', id, 'Customer support and relations'
FROM public.industries WHERE name = 'Retail';

-- Marketing & Advertising Industry Departments
INSERT INTO public.departments (department_name, industry_id, description) 
SELECT 'Digital Marketing', id, 'Online marketing and social media'
FROM public.industries WHERE name = 'Marketing & Advertising';

INSERT INTO public.departments (department_name, industry_id, description) 
SELECT 'Brand Management', id, 'Brand strategy and positioning'
FROM public.industries WHERE name = 'Marketing & Advertising';

INSERT INTO public.departments (department_name, industry_id, description) 
SELECT 'Content Creation', id, 'Content writing and creative production'
FROM public.industries WHERE name = 'Marketing & Advertising';

INSERT INTO public.departments (department_name, industry_id, description) 
SELECT 'Market Research', id, 'Consumer insights and market analysis'
FROM public.industries WHERE name = 'Marketing & Advertising';

INSERT INTO public.departments (department_name, industry_id, description) 
SELECT 'Public Relations', id, 'Media relations and communications'
FROM public.industries WHERE name = 'Marketing & Advertising';

-- Generic departments that apply to most industries
INSERT INTO public.departments (department_name, industry_id, description) 
SELECT 'Human Resources', id, 'HR management and recruitment'
FROM public.industries;

INSERT INTO public.departments (department_name, industry_id, description) 
SELECT 'Finance & Accounts', id, 'Financial planning and accounting'
FROM public.industries WHERE name NOT IN ('Banking & Finance');

INSERT INTO public.departments (department_name, industry_id, description) 
SELECT 'Operations', id, 'Business operations and management'
FROM public.industries;

INSERT INTO public.departments (department_name, industry_id, description) 
SELECT 'Sales & Marketing', id, 'Sales and marketing functions'
FROM public.industries WHERE name NOT IN ('Marketing & Advertising', 'Retail');

-- Create the role_categories table with department_id foreign key
CREATE TABLE IF NOT EXISTS public.role_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id UUID NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
  role_category_name VARCHAR(255) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_role_categories_department_id ON public.role_categories(department_id);
CREATE INDEX IF NOT EXISTS idx_role_categories_name ON public.role_categories(role_category_name);

-- Enable RLS
ALTER TABLE public.role_categories ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Allow public read access to role_categories"
ON public.role_categories FOR SELECT
TO public
USING (true);

CREATE POLICY "Allow authenticated insert to role_categories"
ON public.role_categories FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow authenticated update to role_categories"
ON public.role_categories FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Now populate with comprehensive role category data for each department
-- First, get department IDs and populate role categories

-- Software Development Department Role Categories
INSERT INTO public.role_categories (department_id, role_category_name, description)
SELECT d.id, role_cat, role_desc FROM departments d
CROSS JOIN (VALUES
  ('Full Stack Developer', 'Develops both front-end and back-end applications'),
  ('Frontend Developer', 'Specializes in user interface and client-side development'),
  ('Backend Developer', 'Focuses on server-side logic and databases'),
  ('Mobile App Developer', 'Develops iOS/Android mobile applications'),
  ('DevOps Engineer', 'Manages infrastructure, CI/CD, and deployment'),
  ('Software Architect', 'Designs system architecture and technical solutions'),
  ('QA Engineer', 'Tests software quality and ensures bug-free releases'),
  ('Database Administrator', 'Manages and optimizes databases'),
  ('UI/UX Designer', 'Designs user interfaces and user experiences'),
  ('Cloud Engineer', 'Works with cloud platforms like AWS, Azure, GCP'),
  ('Security Engineer', 'Ensures application and infrastructure security'),
  ('Data Engineer', 'Builds and maintains data pipelines'),
  ('Machine Learning Engineer', 'Develops ML models and AI solutions'),
  ('Game Developer', 'Creates video games and gaming applications'),
  ('Embedded Systems Developer', 'Develops software for embedded hardware')
) AS role_data(role_cat, role_desc)
WHERE d.department_name = 'Software Development';

-- IT Support & Infrastructure Role Categories
INSERT INTO public.role_categories (department_id, role_category_name, description)
SELECT d.id, role_cat, role_desc FROM departments d
CROSS JOIN (VALUES
  ('Technical Support Engineer', 'Provides technical assistance to users'),
  ('System Administrator', 'Manages servers and IT infrastructure'),
  ('Network Administrator', 'Manages network infrastructure and connectivity'),
  ('Help Desk Technician', 'First-line support for technical issues'),
  ('IT Infrastructure Manager', 'Oversees IT infrastructure operations'),
  ('Server Administrator', 'Manages and maintains server systems'),
  ('Network Security Specialist', 'Secures network infrastructure'),
  ('Desktop Support Engineer', 'Provides end-user desktop support'),
  ('IT Operations Manager', 'Manages day-to-day IT operations'),
  ('Cloud Infrastructure Engineer', 'Manages cloud-based infrastructure')
) AS role_data(role_cat, role_desc)
WHERE d.department_name = 'IT Support & Infrastructure';

-- Data Science & Analytics Role Categories
INSERT INTO public.role_categories (department_id, role_category_name, description)
SELECT d.id, role_cat, role_desc FROM departments d
CROSS JOIN (VALUES
  ('Data Scientist', 'Analyzes data and builds predictive models'),
  ('Data Analyst', 'Analyzes business data and creates insights'),
  ('Business Intelligence Analyst', 'Creates BI dashboards and reports'),
  ('Machine Learning Scientist', 'Researches and develops ML algorithms'),
  ('Data Architect', 'Designs data architecture and infrastructure'),
  ('Big Data Engineer', 'Works with big data technologies like Hadoop, Spark'),
  ('Statistical Analyst', 'Performs statistical analysis and modeling'),
  ('Analytics Manager', 'Leads analytics team and strategy'),
  ('Research Scientist', 'Conducts research in data science domain'),
  ('Quantitative Analyst', 'Performs quantitative analysis for business decisions')
) AS role_data(role_cat, role_desc)
WHERE d.department_name = 'Data Science & Analytics';

-- Cybersecurity Role Categories
INSERT INTO public.role_categories (department_id, role_category_name, description)
SELECT d.id, role_cat, role_desc FROM departments d
CROSS JOIN (VALUES
  ('Security Analyst', 'Monitors and analyzes security threats'),
  ('Penetration Tester', 'Tests security by simulating attacks'),
  ('Security Engineer', 'Implements security solutions'),
  ('Cybersecurity Consultant', 'Advises on security best practices'),
  ('Incident Response Specialist', 'Responds to security incidents'),
  ('Security Architect', 'Designs secure systems and architecture'),
  ('Compliance Officer', 'Ensures regulatory compliance'),
  ('Threat Intelligence Analyst', 'Analyzes cyber threats and vulnerabilities'),
  ('Forensic Analyst', 'Investigates cyber crimes and breaches'),
  ('Chief Information Security Officer (CISO)', 'Leads organization security strategy')
) AS role_data(role_cat, role_desc)
WHERE d.department_name = 'Cybersecurity';

-- Sales & Marketing Role Categories (for BPO/Corporate departments)
INSERT INTO public.role_categories (department_id, role_category_name, description)
SELECT d.id, role_cat, role_desc FROM departments d
CROSS JOIN (VALUES
  ('Sales Executive', 'Manages sales and client relationships'),
  ('Business Development Manager', 'Identifies and develops new business opportunities'),
  ('Account Manager', 'Manages client accounts and relationships'),
  ('Marketing Manager', 'Oversees marketing campaigns and strategy'),
  ('Digital Marketing Specialist', 'Manages online marketing channels'),
  ('Content Marketing Manager', 'Creates and manages content strategy'),
  ('SEO Specialist', 'Optimizes content for search engines'),
  ('Social Media Manager', 'Manages social media presence and campaigns'),
  ('Brand Manager', 'Manages brand identity and positioning'),
  ('Product Marketing Manager', 'Markets products and manages launches'),
  ('Lead Generation Specialist', 'Generates and qualifies sales leads'),
  ('Email Marketing Specialist', 'Manages email marketing campaigns'),
  ('Growth Hacker', 'Drives user growth through innovative strategies'),
  ('Marketing Analyst', 'Analyzes marketing data and performance')
) AS role_data(role_cat, role_desc)
WHERE d.department_name IN ('Sales & Marketing', 'Business Development');

-- Customer Support Role Categories
INSERT INTO public.role_categories (department_id, role_category_name, description)
SELECT d.id, role_cat, role_desc FROM departments d
CROSS JOIN (VALUES
  ('Customer Service Representative', 'Provides customer support via phone/email/chat'),
  ('Customer Success Manager', 'Ensures customer satisfaction and retention'),
  ('Technical Support Specialist', 'Provides technical product support'),
  ('Support Team Lead', 'Leads customer support team'),
  ('Customer Experience Manager', 'Manages overall customer experience'),
  ('Call Center Agent', 'Handles inbound/outbound calls'),
  ('Chat Support Agent', 'Provides real-time chat support'),
  ('Help Desk Agent', 'Provides first-level support'),
  ('Client Relations Manager', 'Manages client relationships'),
  ('Escalation Specialist', 'Handles escalated customer issues')
) AS role_data(role_cat, role_desc)
WHERE d.department_name IN ('Customer Support', 'Customer Service');

-- Operations & Quality Role Categories
INSERT INTO public.role_categories (department_id, role_category_name, description)
SELECT d.id, role_cat, role_desc FROM departments d
CROSS JOIN (VALUES
  ('Operations Manager', 'Oversees daily operations'),
  ('Quality Analyst', 'Monitors and ensures quality standards'),
  ('Process Excellence Manager', 'Improves business processes'),
  ('Operations Coordinator', 'Coordinates operational activities'),
  ('Quality Assurance Manager', 'Manages quality assurance programs'),
  ('Six Sigma Black Belt', 'Leads process improvement initiatives'),
  ('Operations Analyst', 'Analyzes operational data and metrics'),
  ('Workforce Manager', 'Manages workforce planning and scheduling'),
  ('Project Coordinator', 'Coordinates project activities'),
  ('Continuous Improvement Manager', 'Drives continuous improvement efforts')
) AS role_data(role_cat, role_desc)
WHERE d.department_name IN ('Operations', 'Quality Assurance', 'Operations & Quality');

-- Healthcare - Medical Staff Role Categories
INSERT INTO public.role_categories (department_id, role_category_name, description)
SELECT d.id, role_cat, role_desc FROM departments d
CROSS JOIN (VALUES
  ('Physician', 'Medical doctor providing patient care'),
  ('Surgeon', 'Performs surgical procedures'),
  ('Registered Nurse (RN)', 'Provides nursing care to patients'),
  ('Nurse Practitioner', 'Advanced practice registered nurse'),
  ('Physician Assistant', 'Practices medicine under physician supervision'),
  ('Anesthesiologist', 'Administers anesthesia for surgeries'),
  ('Radiologist', 'Interprets medical imaging'),
  ('Cardiologist', 'Specializes in heart and cardiovascular conditions'),
  ('Neurologist', 'Specializes in nervous system disorders'),
  ('Pediatrician', 'Specializes in children healthcare'),
  ('Psychiatrist', 'Specializes in mental health treatment'),
  ('Emergency Medicine Physician', 'Provides emergency medical care'),
  ('ICU Nurse', 'Provides critical care nursing'),
  ('Operating Room Nurse', 'Assists in surgical procedures')
) AS role_data(role_cat, role_desc)
WHERE d.department_name IN ('Medical Staff', 'Clinical Services', 'Nursing');

-- Healthcare - Allied Health Role Categories
INSERT INTO public.role_categories (department_id, role_category_name, description)
SELECT d.id, role_cat, role_desc FROM departments d
CROSS JOIN (VALUES
  ('Pharmacist', 'Dispenses medications and provides pharmaceutical care'),
  ('Physical Therapist', 'Provides rehabilitation and physical therapy'),
  ('Occupational Therapist', 'Helps patients with daily living activities'),
  ('Medical Technologist', 'Performs laboratory tests'),
  ('Radiologic Technologist', 'Performs diagnostic imaging procedures'),
  ('Respiratory Therapist', 'Treats breathing and cardiopulmonary disorders'),
  ('Dietitian/Nutritionist', 'Provides nutrition counseling'),
  ('Medical Laboratory Scientist', 'Analyzes body fluids and tissues'),
  ('Ultrasound Technician', 'Performs ultrasound imaging'),
  ('Phlebotomist', 'Draws blood for testing')
) AS role_data(role_cat, role_desc)
WHERE d.department_name IN ('Allied Health', 'Laboratory', 'Diagnostic Services');

-- Healthcare Administration Role Categories
INSERT INTO public.role_categories (department_id, role_category_name, description)
SELECT d.id, role_cat, role_desc FROM departments d
CROSS JOIN (VALUES
  ('Hospital Administrator', 'Manages hospital operations'),
  ('Healthcare Manager', 'Manages healthcare facility or department'),
  ('Medical Records Manager', 'Manages patient medical records'),
  ('Patient Care Coordinator', 'Coordinates patient care services'),
  ('Healthcare Quality Manager', 'Ensures healthcare quality standards'),
  ('Medical Billing Specialist', 'Manages medical billing and coding'),
  ('Health Information Manager', 'Manages health information systems'),
  ('Compliance Officer', 'Ensures healthcare regulatory compliance'),
  ('Healthcare HR Manager', 'Manages healthcare human resources'),
  ('Facility Manager', 'Manages healthcare facility operations')
) AS role_data(role_cat, role_desc)
WHERE d.department_name IN ('Healthcare Administration', 'Administration', 'Hospital Management');

-- Finance & Accounting Role Categories
INSERT INTO public.role_categories (department_id, role_category_name, description)
SELECT d.id, role_cat, role_desc FROM departments d
CROSS JOIN (VALUES
  ('Accountant', 'Manages financial records and transactions'),
  ('Financial Analyst', 'Analyzes financial data and trends'),
  ('Tax Specialist', 'Manages tax planning and compliance'),
  ('Auditor', 'Reviews financial records for accuracy'),
  ('Accounts Payable Specialist', 'Manages outgoing payments'),
  ('Accounts Receivable Specialist', 'Manages incoming payments'),
  ('Payroll Specialist', 'Processes employee payroll'),
  ('Budget Analyst', 'Analyzes and manages budgets'),
  ('Treasury Analyst', 'Manages cash and investments'),
  ('Financial Controller', 'Oversees financial operations'),
  ('Chief Financial Officer (CFO)', 'Leads financial strategy'),
  ('Investment Analyst', 'Analyzes investment opportunities'),
  ('Credit Analyst', 'Evaluates credit risk'),
  ('Financial Planning & Analysis Manager', 'Manages FP&A activities')
) AS role_data(role_cat, role_desc)
WHERE d.department_name IN ('Finance', 'Accounting', 'Finance & Accounting');

-- Human Resources Role Categories
INSERT INTO public.role_categories (department_id, role_category_name, description)
SELECT d.id, role_cat, role_desc FROM departments d
CROSS JOIN (VALUES
  ('HR Manager', 'Manages human resources functions'),
  ('Recruitment Specialist', 'Manages hiring and recruitment'),
  ('HR Business Partner', 'Partners with business units on HR matters'),
  ('Talent Acquisition Manager', 'Leads talent acquisition strategy'),
  ('Compensation & Benefits Specialist', 'Manages employee compensation'),
  ('Training & Development Manager', 'Manages employee training programs'),
  ('Employee Relations Specialist', 'Handles employee relations issues'),
  ('HR Analyst', 'Analyzes HR data and metrics'),
  ('Organizational Development Specialist', 'Improves organizational effectiveness'),
  ('HR Operations Manager', 'Manages HR operational processes'),
  ('HRIS Specialist', 'Manages HR information systems'),
  ('Payroll Manager', 'Oversees payroll processing'),
  ('Diversity & Inclusion Manager', 'Leads D&I initiatives')
) AS role_data(role_cat, role_desc)
WHERE d.department_name IN ('Human Resources', 'HR', 'Talent Acquisition');

-- Legal & Compliance Role Categories
INSERT INTO public.role_categories (department_id, role_category_name, description)
SELECT d.id, role_cat, role_desc FROM departments d
CROSS JOIN (VALUES
  ('Corporate Lawyer', 'Provides legal counsel on corporate matters'),
  ('Compliance Manager', 'Ensures regulatory compliance'),
  ('Legal Counsel', 'Provides legal advice and representation'),
  ('Contract Manager', 'Manages contract negotiations and agreements'),
  ('Intellectual Property Lawyer', 'Manages IP rights and patents'),
  ('Regulatory Affairs Specialist', 'Manages regulatory submissions'),
  ('Paralegal', 'Assists lawyers with legal work'),
  ('Legal Analyst', 'Analyzes legal documents and issues'),
  ('Risk & Compliance Officer', 'Manages risk and compliance programs'),
  ('Chief Legal Officer', 'Leads legal department')
) AS role_data(role_cat, role_desc)
WHERE d.department_name IN ('Legal', 'Compliance', 'Legal & Compliance');

-- Manufacturing - Production Role Categories
INSERT INTO public.role_categories (department_id, role_category_name, description)
SELECT d.id, role_cat, role_desc FROM departments d
CROSS JOIN (VALUES
  ('Production Manager', 'Manages manufacturing production'),
  ('Production Supervisor', 'Supervises production floor operations'),
  ('Machine Operator', 'Operates manufacturing machinery'),
  ('Assembly Line Worker', 'Works on product assembly'),
  ('Quality Control Inspector', 'Inspects product quality'),
  ('Production Planner', 'Plans production schedules'),
  ('Manufacturing Engineer', 'Improves manufacturing processes'),
  ('Process Engineer', 'Optimizes production processes'),
  ('Industrial Engineer', 'Improves operational efficiency'),
  ('Maintenance Technician', 'Maintains manufacturing equipment'),
  ('CNC Operator', 'Operates CNC machines'),
  ('Welder', 'Performs welding operations'),
  ('Forklift Operator', 'Operates forklifts for material handling')
) AS role_data(role_cat, role_desc)
WHERE d.department_name IN ('Production', 'Manufacturing', 'Operations');

-- Supply Chain & Logistics Role Categories
INSERT INTO public.role_categories (department_id, role_category_name, description)
SELECT d.id, role_cat, role_desc FROM departments d
CROSS JOIN (VALUES
  ('Supply Chain Manager', 'Manages end-to-end supply chain'),
  ('Logistics Coordinator', 'Coordinates logistics operations'),
  ('Warehouse Manager', 'Manages warehouse operations'),
  ('Procurement Specialist', 'Manages purchasing and procurement'),
  ('Inventory Manager', 'Manages inventory levels'),
  ('Transportation Manager', 'Manages transportation operations'),
  ('Distribution Manager', 'Oversees product distribution'),
  ('Demand Planner', 'Forecasts product demand'),
  ('Supply Planner', 'Plans supply to meet demand'),
  ('Logistics Analyst', 'Analyzes logistics data'),
  ('Import/Export Specialist', 'Manages international shipping'),
  ('Materials Manager', 'Manages raw materials inventory'),
  ('Shipping & Receiving Clerk', 'Handles incoming/outgoing shipments')
) AS role_data(role_cat, role_desc)
WHERE d.department_name IN ('Supply Chain', 'Logistics', 'Supply Chain & Logistics', 'Procurement');

-- Research & Development Role Categories
INSERT INTO public.role_categories (department_id, role_category_name, description)
SELECT d.id, role_cat, role_desc FROM departments d
CROSS JOIN (VALUES
  ('Research Scientist', 'Conducts scientific research'),
  ('R&D Engineer', 'Develops new products and technologies'),
  ('Product Development Manager', 'Manages product development lifecycle'),
  ('Innovation Manager', 'Drives innovation initiatives'),
  ('Lab Technician', 'Performs laboratory experiments'),
  ('Research Analyst', 'Analyzes research data'),
  ('Clinical Research Associate', 'Manages clinical trials'),
  ('Materials Scientist', 'Researches new materials'),
  ('Chemical Engineer', 'Develops chemical processes'),
  ('Biomedical Engineer', 'Develops medical devices and equipment')
) AS role_data(role_cat, role_desc)
WHERE d.department_name IN ('Research & Development', 'R&D', 'Innovation');

-- Education & Training Role Categories
INSERT INTO public.role_categories (department_id, role_category_name, description)
SELECT d.id, role_cat, role_desc FROM departments d
CROSS JOIN (VALUES
  ('Teacher', 'Provides classroom instruction'),
  ('Professor', 'Teaches at university level'),
  ('Lecturer', 'Delivers lectures and courses'),
  ('Training Manager', 'Manages training programs'),
  ('Instructional Designer', 'Designs learning materials'),
  ('Curriculum Developer', 'Develops educational curriculum'),
  ('Academic Counselor', 'Provides academic guidance'),
  ('Education Coordinator', 'Coordinates educational programs'),
  ('Online Course Instructor', 'Teaches online courses'),
  ('Corporate Trainer', 'Provides corporate training'),
  ('Special Education Teacher', 'Teaches students with special needs'),
  ('Tutor', 'Provides one-on-one tutoring'),
  ('Learning & Development Specialist', 'Develops employee training')
) AS role_data(role_cat, role_desc)
WHERE d.department_name IN ('Education', 'Training', 'Academic', 'Learning & Development');

-- Retail - Store Operations Role Categories
INSERT INTO public.role_categories (department_id, role_category_name, description)
SELECT d.id, role_cat, role_desc FROM departments d
CROSS JOIN (VALUES
  ('Store Manager', 'Manages retail store operations'),
  ('Assistant Store Manager', 'Assists in store management'),
  ('Sales Associate', 'Provides customer service and sales'),
  ('Cashier', 'Handles customer transactions'),
  ('Visual Merchandiser', 'Creates product displays'),
  ('Store Supervisor', 'Supervises store staff'),
  ('Inventory Specialist', 'Manages store inventory'),
  ('Loss Prevention Specialist', 'Prevents theft and loss'),
  ('Customer Service Representative', 'Assists customers'),
  ('Product Specialist', 'Provides product expertise'),
  ('Stock Clerk', 'Manages stock and replenishment')
) AS role_data(role_cat, role_desc)
WHERE d.department_name IN ('Retail', 'Store Operations');

-- E-commerce Role Categories
INSERT INTO public.role_categories (department_id, role_category_name, description)
SELECT d.id, role_cat, role_desc FROM departments d
CROSS JOIN (VALUES
  ('E-commerce Manager', 'Manages online sales platform'),
  ('Product Listing Specialist', 'Manages product listings'),
  ('E-commerce Analyst', 'Analyzes e-commerce metrics'),
  ('Marketplace Manager', 'Manages third-party marketplaces'),
  ('Digital Content Manager', 'Manages online content'),
  ('Conversion Rate Optimizer', 'Optimizes conversion rates'),
  ('E-commerce Operations Manager', 'Manages e-commerce operations'),
  ('Online Merchandiser', 'Manages online product merchandising'),
  ('Customer Experience Manager', 'Optimizes online customer experience'),
  ('E-commerce SEO Specialist', 'Optimizes e-commerce for search engines')
) AS role_data(role_cat, role_desc)
WHERE d.department_name IN ('E-commerce', 'Digital Commerce', 'Online Sales');

-- Project Management Role Categories
INSERT INTO public.role_categories (department_id, role_category_name, description)
SELECT d.id, role_cat, role_desc FROM departments d
CROSS JOIN (VALUES
  ('Project Manager', 'Manages projects from initiation to closure'),
  ('Program Manager', 'Manages multiple related projects'),
  ('Scrum Master', 'Facilitates Agile/Scrum processes'),
  ('Product Owner', 'Defines product vision and backlog'),
  ('Project Coordinator', 'Coordinates project activities'),
  ('PMO Manager', 'Manages Project Management Office'),
  ('Agile Coach', 'Coaches teams on Agile practices'),
  ('Technical Project Manager', 'Manages technical projects'),
  ('Portfolio Manager', 'Manages project portfolio'),
  ('Business Analyst', 'Analyzes business requirements')
) AS role_data(role_cat, role_desc)
WHERE d.department_name IN ('Project Management', 'PMO', 'Program Management');

-- Product Management Role Categories
INSERT INTO public.role_categories (department_id, role_category_name, description)
SELECT d.id, role_cat, role_desc FROM departments d
CROSS JOIN (VALUES
  ('Product Manager', 'Manages product lifecycle and strategy'),
  ('Senior Product Manager', 'Leads product initiatives'),
  ('Product Owner', 'Defines product requirements and backlog'),
  ('Technical Product Manager', 'Manages technical products'),
  ('Growth Product Manager', 'Focuses on user growth'),
  ('Product Analyst', 'Analyzes product metrics'),
  ('Product Operations Manager', 'Manages product operations')
) AS role_data(role_cat, role_desc)
WHERE d.department_name IN ('Product Management', 'Product');

-- Consulting Role Categories
INSERT INTO public.role_categories (department_id, role_category_name, description)
SELECT d.id, role_cat, role_desc FROM departments d
CROSS JOIN (VALUES
  ('Management Consultant', 'Provides strategic business advice'),
  ('IT Consultant', 'Provides technology consulting services'),
  ('Business Analyst', 'Analyzes business processes and requirements'),
  ('Strategy Consultant', 'Advises on business strategy'),
  ('Financial Consultant', 'Provides financial advisory services'),
  ('HR Consultant', 'Advises on HR practices'),
  ('Operations Consultant', 'Improves operational efficiency'),
  ('Change Management Consultant', 'Manages organizational change')
) AS role_data(role_cat, role_desc)
WHERE d.department_name IN ('Consulting', 'Advisory');

-- Add "Other" category for all departments
INSERT INTO public.role_categories (department_id, role_category_name, description)
SELECT d.id, 'Other', 'Other role categories not listed'
FROM departments d;

-- Update timestamp function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_role_categories_updated_at BEFORE UPDATE ON public.role_categories
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

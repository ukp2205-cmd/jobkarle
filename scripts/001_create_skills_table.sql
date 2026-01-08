-- Create skills table for job portal
CREATE TABLE skills (
  id SERIAL PRIMARY KEY,
  skill_name VARCHAR(255) NOT NULL UNIQUE,
  category VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;

-- Create policy to allow read access to all users
CREATE POLICY "Allow public read access to skills" ON skills
  FOR SELECT USING (true);

-- Insert skills data across different industries

-- Digital Marketing Skills
INSERT INTO skills (skill_name, category) VALUES
('Digital Marketing', 'Digital Marketing'),
('Social Media Marketing', 'Digital Marketing'),
('Search Engine Optimization', 'Digital Marketing'),
('Search Engine Marketing', 'Digital Marketing'),
('Google Ads', 'Digital Marketing'),
('Facebook Ads', 'Digital Marketing'),
('Instagram Marketing', 'Digital Marketing'),
('LinkedIn Marketing', 'Digital Marketing'),
('Content Marketing', 'Digital Marketing'),
('Email Marketing', 'Digital Marketing'),
('Affiliate Marketing', 'Digital Marketing'),
('Influencer Marketing', 'Digital Marketing'),
('PPC Advertising', 'Digital Marketing'),
('Google Analytics', 'Digital Marketing'),
('Marketing Automation', 'Digital Marketing'),
('Conversion Rate Optimization', 'Digital Marketing'),
('A/B Testing', 'Digital Marketing'),
('Lead Generation', 'Digital Marketing'),
('Brand Management', 'Digital Marketing'),
('Online Reputation Management', 'Digital Marketing');

-- Programming & Software Development Skills
INSERT INTO skills (skill_name, category) VALUES
('JavaScript', 'Programming'),
('Python', 'Programming'),
('Java', 'Programming'),
('C++', 'Programming'),
('C#', 'Programming'),
('PHP', 'Programming'),
('Ruby', 'Programming'),
('Swift', 'Programming'),
('Kotlin', 'Programming'),
('Go', 'Programming'),
('Rust', 'Programming'),
('TypeScript', 'Programming'),
('React.js', 'Programming'),
('Angular', 'Programming'),
('Vue.js', 'Programming'),
('Node.js', 'Programming'),
('Express.js', 'Programming'),
('Django', 'Programming'),
('Flask', 'Programming'),
('Spring Boot', 'Programming'),
('ASP.NET', 'Programming'),
('Ruby on Rails', 'Programming'),
('Laravel', 'Programming'),
('MongoDB', 'Programming'),
('PostgreSQL', 'Programming'),
('MySQL', 'Programming'),
('Redis', 'Programming'),
('Docker', 'Programming'),
('Kubernetes', 'Programming'),
('AWS', 'Programming'),
('Azure', 'Programming'),
('Google Cloud Platform', 'Programming'),
('Git', 'Programming'),
('CI/CD', 'Programming'),
('RESTful APIs', 'Programming'),
('GraphQL', 'Programming'),
('Microservices', 'Programming'),
('Machine Learning', 'Programming'),
('Data Science', 'Programming'),
('Artificial Intelligence', 'Programming');

-- Content Writing Skills
INSERT INTO skills (skill_name, category) VALUES
('Content Writing', 'Content Writing'),
('Copywriting', 'Content Writing'),
('Blog Writing', 'Content Writing'),
('Article Writing', 'Content Writing'),
('Technical Writing', 'Content Writing'),
('Creative Writing', 'Content Writing'),
('SEO Writing', 'Content Writing'),
('Ghostwriting', 'Content Writing'),
('Press Release Writing', 'Content Writing'),
('Social Media Content', 'Content Writing'),
('Script Writing', 'Content Writing'),
('UX Writing', 'Content Writing'),
('Grant Writing', 'Content Writing'),
('Resume Writing', 'Content Writing'),
('Editing', 'Content Writing'),
('Proofreading', 'Content Writing'),
('Research', 'Content Writing'),
('Storytelling', 'Content Writing'),
('Content Strategy', 'Content Writing'),
('Brand Voice Development', 'Content Writing');

-- Recruitment & HR Skills
INSERT INTO skills (skill_name, category) VALUES
('Talent Acquisition', 'Recruitment'),
('Recruiting', 'Recruitment'),
('Sourcing', 'Recruitment'),
('Candidate Screening', 'Recruitment'),
('Interview Coordination', 'Recruitment'),
('Applicant Tracking Systems', 'Recruitment'),
('LinkedIn Recruiting', 'Recruitment'),
('Campus Recruitment', 'Recruitment'),
('Executive Search', 'Recruitment'),
('Technical Recruiting', 'Recruitment'),
('HR Management', 'Recruitment'),
('Employee Relations', 'Recruitment'),
('Performance Management', 'Recruitment'),
('Compensation & Benefits', 'Recruitment'),
('Onboarding', 'Recruitment'),
('Training & Development', 'Recruitment'),
('HRIS', 'Recruitment'),
('Payroll Management', 'Recruitment'),
('Labor Law Compliance', 'Recruitment'),
('Workforce Planning', 'Recruitment');

-- Design Skills
INSERT INTO skills (skill_name, category) VALUES
('Graphic Design', 'Design'),
('UI Design', 'Design'),
('UX Design', 'Design'),
('Web Design', 'Design'),
('Mobile App Design', 'Design'),
('Logo Design', 'Design'),
('Brand Identity Design', 'Design'),
('Adobe Photoshop', 'Design'),
('Adobe Illustrator', 'Design'),
('Adobe XD', 'Design'),
('Figma', 'Design'),
('Sketch', 'Design'),
('InVision', 'Design'),
('Motion Graphics', 'Design'),
('Video Editing', 'Design'),
('Adobe Premiere Pro', 'Design'),
('Adobe After Effects', 'Design'),
('3D Modeling', 'Design'),
('Animation', 'Design'),
('Typography', 'Design');

-- Sales Skills
INSERT INTO skills (skill_name, category) VALUES
('Sales', 'Sales'),
('Business Development', 'Sales'),
('Account Management', 'Sales'),
('Lead Qualification', 'Sales'),
('Cold Calling', 'Sales'),
('Negotiation', 'Sales'),
('CRM Software', 'Sales'),
('Salesforce', 'Sales'),
('HubSpot', 'Sales'),
('Pipeline Management', 'Sales'),
('Sales Strategy', 'Sales'),
('B2B Sales', 'Sales'),
('B2C Sales', 'Sales'),
('Inside Sales', 'Sales'),
('Field Sales', 'Sales'),
('Channel Sales', 'Sales'),
('Enterprise Sales', 'Sales'),
('Solution Selling', 'Sales'),
('Consultative Selling', 'Sales'),
('Sales Forecasting', 'Sales');

-- Finance & Accounting Skills
INSERT INTO skills (skill_name, category) VALUES
('Financial Analysis', 'Finance'),
('Accounting', 'Finance'),
('Bookkeeping', 'Finance'),
('Financial Reporting', 'Finance'),
('Budgeting', 'Finance'),
('Forecasting', 'Finance'),
('Tax Preparation', 'Finance'),
('Auditing', 'Finance'),
('Cost Accounting', 'Finance'),
('Management Accounting', 'Finance'),
('Tally', 'Finance'),
('SAP FICO', 'Finance'),
('QuickBooks', 'Finance'),
('Excel Financial Modeling', 'Finance'),
('GST', 'Finance'),
('Accounts Payable', 'Finance'),
('Accounts Receivable', 'Finance'),
('Payroll', 'Finance'),
('Treasury Management', 'Finance'),
('Financial Planning', 'Finance');

-- Data & Analytics Skills
INSERT INTO skills (skill_name, category) VALUES
('Data Analysis', 'Data & Analytics'),
('Data Visualization', 'Data & Analytics'),
('SQL', 'Data & Analytics'),
('Tableau', 'Data & Analytics'),
('Power BI', 'Data & Analytics'),
('Excel', 'Data & Analytics'),
('R Programming', 'Data & Analytics'),
('Statistical Analysis', 'Data & Analytics'),
('Predictive Analytics', 'Data & Analytics'),
('Business Intelligence', 'Data & Analytics'),
('ETL', 'Data & Analytics'),
('Data Warehousing', 'Data & Analytics'),
('Big Data', 'Data & Analytics'),
('Hadoop', 'Data & Analytics'),
('Spark', 'Data & Analytics'),
('Data Mining', 'Data & Analytics'),
('Quantitative Analysis', 'Data & Analytics'),
('Data Modeling', 'Data & Analytics'),
('Reporting', 'Data & Analytics'),
('Dashboard Development', 'Data & Analytics');

-- Customer Service Skills
INSERT INTO skills (skill_name, category) VALUES
('Customer Service', 'Customer Service'),
('Customer Support', 'Customer Service'),
('Call Center', 'Customer Service'),
('Technical Support', 'Customer Service'),
('Help Desk', 'Customer Service'),
('Ticketing Systems', 'Customer Service'),
('Zendesk', 'Customer Service'),
('Freshdesk', 'Customer Service'),
('Live Chat Support', 'Customer Service'),
('Email Support', 'Customer Service'),
('Phone Support', 'Customer Service'),
('Complaint Resolution', 'Customer Service'),
('Customer Retention', 'Customer Service'),
('Customer Success', 'Customer Service'),
('Client Relations', 'Customer Service'),
('Communication Skills', 'Customer Service'),
('Problem Solving', 'Customer Service'),
('Empathy', 'Customer Service'),
('Patience', 'Customer Service'),
('Multitasking', 'Customer Service');

-- Project Management Skills
INSERT INTO skills (skill_name, category) VALUES
('Project Management', 'Project Management'),
('Agile', 'Project Management'),
('Scrum', 'Project Management'),
('Kanban', 'Project Management'),
('Waterfall', 'Project Management'),
('JIRA', 'Project Management'),
('Asana', 'Project Management'),
('Trello', 'Project Management'),
('Microsoft Project', 'Project Management'),
('Risk Management', 'Project Management'),
('Stakeholder Management', 'Project Management'),
('Resource Planning', 'Project Management'),
('Project Planning', 'Project Management'),
('Sprint Planning', 'Project Management'),
('Backlog Management', 'Project Management'),
('PMP', 'Project Management'),
('Prince2', 'Project Management'),
('Team Leadership', 'Project Management'),
('Time Management', 'Project Management'),
('Budget Management', 'Project Management');

-- Healthcare Skills
INSERT INTO skills (skill_name, category) VALUES
('Nursing', 'Healthcare'),
('Patient Care', 'Healthcare'),
('Clinical Research', 'Healthcare'),
('Medical Coding', 'Healthcare'),
('Medical Billing', 'Healthcare'),
('Pharmacy', 'Healthcare'),
('Healthcare Administration', 'Healthcare'),
('EMR/EHR', 'Healthcare'),
('HIPAA Compliance', 'Healthcare'),
('Medical Terminology', 'Healthcare'),
('Diagnostic Testing', 'Healthcare'),
('Phlebotomy', 'Healthcare'),
('Vital Signs Monitoring', 'Healthcare'),
('Medication Administration', 'Healthcare'),
('Wound Care', 'Healthcare'),
('CPR', 'Healthcare'),
('First Aid', 'Healthcare'),
('Healthcare Quality', 'Healthcare'),
('Patient Education', 'Healthcare'),
('Medical Records', 'Healthcare');

-- Legal Skills
INSERT INTO skills (skill_name, category) VALUES
('Legal Research', 'Legal'),
('Contract Drafting', 'Legal'),
('Contract Review', 'Legal'),
('Litigation', 'Legal'),
('Corporate Law', 'Legal'),
('Intellectual Property', 'Legal'),
('Labor Law', 'Legal'),
('Real Estate Law', 'Legal'),
('Criminal Law', 'Legal'),
('Family Law', 'Legal'),
('Due Diligence', 'Legal'),
('Legal Writing', 'Legal'),
('Case Management', 'Legal'),
('Legal Compliance', 'Legal'),
('Paralegal', 'Legal'),
('Legal Documentation', 'Legal'),
('Court Filings', 'Legal'),
('Mediation', 'Legal'),
('Arbitration', 'Legal'),
('Regulatory Affairs', 'Legal');

-- Manufacturing & Operations Skills
INSERT INTO skills (skill_name, category) VALUES
('Manufacturing', 'Manufacturing'),
('Production Planning', 'Manufacturing'),
('Quality Control', 'Manufacturing'),
('Quality Assurance', 'Manufacturing'),
('Lean Manufacturing', 'Manufacturing'),
('Six Sigma', 'Manufacturing'),
('Supply Chain Management', 'Manufacturing'),
('Inventory Management', 'Manufacturing'),
('Warehouse Management', 'Manufacturing'),
('Logistics', 'Manufacturing'),
('Procurement', 'Manufacturing'),
('Vendor Management', 'Manufacturing'),
('Operations Management', 'Manufacturing'),
('Process Improvement', 'Manufacturing'),
('ERP Systems', 'Manufacturing'),
('SAP MM', 'Manufacturing'),
('ISO Standards', 'Manufacturing'),
('Health & Safety', 'Manufacturing'),
('Maintenance', 'Manufacturing'),
('Plant Management', 'Manufacturing');

-- Education & Training Skills
INSERT INTO skills (skill_name, category) VALUES
('Teaching', 'Education'),
('Curriculum Development', 'Education'),
('Instructional Design', 'Education'),
('E-Learning', 'Education'),
('Training Delivery', 'Education'),
('Learning Management Systems', 'Education'),
('Classroom Management', 'Education'),
('Student Assessment', 'Education'),
('Lesson Planning', 'Education'),
('Educational Technology', 'Education'),
('Tutoring', 'Education'),
('Mentoring', 'Education'),
('Coaching', 'Education'),
('Corporate Training', 'Education'),
('Workshop Facilitation', 'Education'),
('Public Speaking', 'Education'),
('Presentation Skills', 'Education'),
('Adult Learning', 'Education'),
('Special Education', 'Education'),
('Academic Writing', 'Education');

-- Create index for faster searches
CREATE INDEX idx_skills_category ON skills(category);
CREATE INDEX idx_skills_name ON skills(skill_name);

-- Changed all role_desc to description to match database schema
-- Fix BPO role categories - Add comprehensive role categories for departments that only have "Other"
-- Specifically targeting Customer Service, Finance & Accounts, IT & Technology, Sales & Telemarketing, and Training & Development

-- BPO Customer Service Role Categories (8f766e45-5997-4d33-a8f2-eef498ddfeaa)
INSERT INTO role_categories (department_id, role_category_name, description) VALUES
('8f766e45-5997-4d33-a8f2-eef498ddfeaa', 'Customer Service Representative', 'Handle customer inquiries, complaints, and provide support'),
('8f766e45-5997-4d33-a8f2-eef498ddfeaa', 'Customer Support Specialist', 'Provide technical and product support to customers'),
('8f766e45-5997-4d33-a8f2-eef498ddfeaa', 'Call Center Agent', 'Handle inbound and outbound calls for customer service'),
('8f766e45-5997-4d33-a8f2-eef498ddfeaa', 'Team Leader - Customer Service', 'Lead and manage customer service teams'),
('8f766e45-5997-4d33-a8f2-eef498ddfeaa', 'Customer Service Manager', 'Manage customer service operations and teams'),
('8f766e45-5997-4d33-a8f2-eef498ddfeaa', 'Customer Experience Specialist', 'Focus on improving overall customer experience'),
('8f766e45-5997-4d33-a8f2-eef498ddfeaa', 'Escalation Specialist', 'Handle complex customer escalations and complaints'),
('8f766e45-5997-4d33-a8f2-eef498ddfeaa', 'Chat Support Specialist', 'Provide customer support via live chat'),
('8f766e45-5997-4d33-a8f2-eef498ddfeaa', 'Email Support Specialist', 'Handle customer inquiries via email'),
('8f766e45-5997-4d33-a8f2-eef498ddfeaa', 'Voice Support Agent', 'Provide phone-based customer support')
ON CONFLICT DO NOTHING;

-- BPO Finance & Accounts Role Categories (10ca6f06-3601-4908-8999-1658629d7c41)
INSERT INTO role_categories (department_id, role_category_name, description) VALUES
('10ca6f06-3601-4908-8999-1658629d7c41', 'Accounts Receivable Specialist', 'Manage incoming payments and collections'),
('10ca6f06-3601-4908-8999-1658629d7c41', 'Accounts Payable Specialist', 'Process vendor payments and invoices'),
('10ca6f06-3601-4908-8999-1658629d7c41', 'Financial Analyst', 'Analyze financial data and prepare reports'),
('10ca6f06-3601-4908-8999-1658629d7c41', 'Billing Specialist', 'Prepare and process customer bills'),
('10ca6f06-3601-4908-8999-1658629d7c41', 'Collections Specialist', 'Follow up on overdue accounts'),
('10ca6f06-3601-4908-8999-1658629d7c41', 'Bookkeeper', 'Maintain financial records and ledgers'),
('10ca6f06-3601-4908-8999-1658629d7c41', 'Finance Manager', 'Oversee finance operations and team'),
('10ca6f06-3601-4908-8999-1658629d7c41', 'Payroll Specialist', 'Process employee payroll and benefits'),
('10ca6f06-3601-4908-8999-1658629d7c41', 'Tax Specialist', 'Handle tax compliance and filings'),
('10ca6f06-3601-4908-8999-1658629d7c41', 'Audit Specialist', 'Conduct internal audits and compliance checks')
ON CONFLICT DO NOTHING;

-- BPO IT & Technology Role Categories (ce49fb60-748f-4b8a-9e5c-7a2d6f876437)
INSERT INTO role_categories (department_id, role_category_name, description) VALUES
('ce49fb60-748f-4b8a-9e5c-7a2d6f876437', 'IT Support Specialist', 'Provide technical support for IT systems'),
('ce49fb60-748f-4b8a-9e5c-7a2d6f876437', 'Network Administrator', 'Manage and maintain network infrastructure'),
('ce49fb60-748f-4b8a-9e5c-7a2d6f876437', 'System Administrator', 'Manage servers and IT systems'),
('ce49fb60-748f-4b8a-9e5c-7a2d6f876437', 'Help Desk Technician', 'Provide first-level technical support'),
('ce49fb60-748f-4b8a-9e5c-7a2d6f876437', 'Database Administrator', 'Manage and maintain databases'),
('ce49fb60-748f-4b8a-9e5c-7a2d6f876437', 'IT Manager', 'Oversee IT operations and team'),
('ce49fb60-748f-4b8a-9e5c-7a2d6f876437', 'Cybersecurity Analyst', 'Monitor and protect IT security'),
('ce49fb60-748f-4b8a-9e5c-7a2d6f876437', 'Software Developer', 'Develop and maintain software applications'),
('ce49fb60-748f-4b8a-9e5c-7a2d6f876437', 'DevOps Engineer', 'Manage deployment and operations'),
('ce49fb60-748f-4b8a-9e5c-7a2d6f876437', 'IT Project Manager', 'Manage IT projects and implementations')
ON CONFLICT DO NOTHING;

-- BPO Sales & Telemarketing Role Categories (f914412c-2bd0-453f-befc-62213f0ed1bb)
INSERT INTO role_categories (department_id, role_category_name, description) VALUES
('f914412c-2bd0-453f-befc-62213f0ed1bb', 'Telemarketing Executive', 'Make outbound sales calls to prospects'),
('f914412c-2bd0-453f-befc-62213f0ed1bb', 'Telesales Representative', 'Sell products and services over the phone'),
('f914412c-2bd0-453f-befc-62213f0ed1bb', 'Inside Sales Representative', 'Handle inbound sales inquiries'),
('f914412c-2bd0-453f-befc-62213f0ed1bb', 'Lead Generation Specialist', 'Identify and qualify sales leads'),
('f914412c-2bd0-453f-befc-62213f0ed1bb', 'Sales Team Leader', 'Lead and manage telemarketing teams'),
('f914412c-2bd0-453f-befc-62213f0ed1bb', 'Appointment Setter', 'Schedule appointments for sales teams'),
('f914412c-2bd0-453f-befc-62213f0ed1bb', 'Cold Calling Specialist', 'Make cold calls to potential customers'),
('f914412c-2bd0-453f-befc-62213f0ed1bb', 'Sales Manager - Telemarketing', 'Manage telemarketing operations'),
('f914412c-2bd0-453f-befc-62213f0ed1bb', 'Business Development Executive', 'Develop new business opportunities'),
('f914412c-2bd0-453f-befc-62213f0ed1bb', 'Outbound Sales Agent', 'Make outbound sales calls')
ON CONFLICT DO NOTHING;

-- BPO Training & Development Role Categories (52d02ce4-8351-44f2-b3b0-453d75451bea)
INSERT INTO role_categories (department_id, role_category_name, description) VALUES
('52d02ce4-8351-44f2-b3b0-453d75451bea', 'Training Specialist', 'Conduct training sessions for employees'),
('52d02ce4-8351-44f2-b3b0-453d75451bea', 'Training Manager', 'Manage training programs and teams'),
('52d02ce4-8351-44f2-b3b0-453d75451bea', 'Onboarding Specialist', 'Handle new employee onboarding'),
('52d02ce4-8351-44f2-b3b0-453d75451bea', 'Learning & Development Specialist', 'Design and implement learning programs'),
('52d02ce4-8351-44f2-b3b0-453d75451bea', 'Instructional Designer', 'Create training materials and content'),
('52d02ce4-8351-44f2-b3b0-453d75451bea', 'Corporate Trainer', 'Deliver corporate training programs'),
('52d02ce4-8351-44f2-b3b0-453d75451bea', 'E-Learning Specialist', 'Develop online training modules'),
('52d02ce4-8351-44f2-b3b0-453d75451bea', 'Training Coordinator', 'Coordinate training schedules and logistics'),
('52d02ce4-8351-44f2-b3b0-453d75451bea', 'Performance Coach', 'Coach employees on performance improvement'),
('52d02ce4-8351-44f2-b3b0-453d75451bea', 'Soft Skills Trainer', 'Conduct soft skills training sessions')
ON CONFLICT DO NOTHING;

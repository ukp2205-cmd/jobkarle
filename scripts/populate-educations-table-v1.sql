-- Populate educations table with comprehensive education names for all levels
-- Table name: educations
-- Columns: id (uuid), education_name (varchar), education_level (varchar)

-- Note: 10th qualification level has NO education names (disabled)

-- 12th Standard Education Names
INSERT INTO educations (id, education_name, education_level) VALUES
(gen_random_uuid(), '12th Science', '12th'),
(gen_random_uuid(), '12th Commerce', '12th'),
(gen_random_uuid(), '12th Arts', '12th'),
(gen_random_uuid(), '12th Vocational', '12th');

-- Diploma Education Names
INSERT INTO educations (id, education_name, education_level) VALUES
(gen_random_uuid(), 'Diploma in Engineering', 'Diploma'),
(gen_random_uuid(), 'Diploma in Computer Science', 'Diploma'),
(gen_random_uuid(), 'Diploma in Mechanical Engineering', 'Diploma'),
(gen_random_uuid(), 'Diploma in Civil Engineering', 'Diploma'),
(gen_random_uuid(), 'Diploma in Electrical Engineering', 'Diploma'),
(gen_random_uuid(), 'Diploma in Electronics', 'Diploma'),
(gen_random_uuid(), 'Diploma in Business Management', 'Diploma'),
(gen_random_uuid(), 'Diploma in Hotel Management', 'Diploma'),
(gen_random_uuid(), 'Diploma in Fashion Design', 'Diploma'),
(gen_random_uuid(), 'Diploma in Interior Design', 'Diploma'),
(gen_random_uuid(), 'Diploma in Nursing', 'Diploma'),
(gen_random_uuid(), 'Diploma in Pharmacy', 'Diploma');

-- Graduate Education Names
INSERT INTO educations (id, education_name, education_level) VALUES
(gen_random_uuid(), 'B.A.', 'Graduate'),
(gen_random_uuid(), 'B.Com', 'Graduate'),
(gen_random_uuid(), 'B.Sc', 'Graduate'),
(gen_random_uuid(), 'B.Tech', 'Graduate'),
(gen_random_uuid(), 'B.E.', 'Graduate'),
(gen_random_uuid(), 'BCA', 'Graduate'),
(gen_random_uuid(), 'BBA', 'Graduate'),
(gen_random_uuid(), 'B.Ed', 'Graduate'),
(gen_random_uuid(), 'B.Pharm', 'Graduate'),
(gen_random_uuid(), 'BDS', 'Graduate'),
(gen_random_uuid(), 'MBBS', 'Graduate'),
(gen_random_uuid(), 'BAMS', 'Graduate'),
(gen_random_uuid(), 'BHMS', 'Graduate'),
(gen_random_uuid(), 'B.Arch', 'Graduate'),
(gen_random_uuid(), 'LLB', 'Graduate'),
(gen_random_uuid(), 'B.Des', 'Graduate'),
(gen_random_uuid(), 'B.F.A.', 'Graduate'),
(gen_random_uuid(), 'B.P.E.', 'Graduate'),
(gen_random_uuid(), 'B.Lib.Sc', 'Graduate'),
(gen_random_uuid(), 'B.Voc', 'Graduate'),
(gen_random_uuid(), 'B.El.Ed', 'Graduate'),
(gen_random_uuid(), 'B.P.Ed', 'Graduate'),
(gen_random_uuid(), 'BSW', 'Graduate'),
(gen_random_uuid(), 'B.J.M.C.', 'Graduate'),
(gen_random_uuid(), 'BHM', 'Graduate');

-- Post Graduate Education Names
INSERT INTO educations (id, education_name, education_level) VALUES
(gen_random_uuid(), 'M.A.', 'Post Graduate'),
(gen_random_uuid(), 'M.Com', 'Post Graduate'),
(gen_random_uuid(), 'M.Sc', 'Post Graduate'),
(gen_random_uuid(), 'M.Tech', 'Post Graduate'),
(gen_random_uuid(), 'M.E.', 'Post Graduate'),
(gen_random_uuid(), 'MBA', 'Post Graduate'),
(gen_random_uuid(), 'MCA', 'Post Graduate'),
(gen_random_uuid(), 'M.Ed', 'Post Graduate'),
(gen_random_uuid(), 'M.Pharm', 'Post Graduate'),
(gen_random_uuid(), 'MDS', 'Post Graduate'),
(gen_random_uuid(), 'MD', 'Post Graduate'),
(gen_random_uuid(), 'MS', 'Post Graduate'),
(gen_random_uuid(), 'M.Ch', 'Post Graduate'),
(gen_random_uuid(), 'M.Arch', 'Post Graduate'),
(gen_random_uuid(), 'LLM', 'Post Graduate'),
(gen_random_uuid(), 'M.Des', 'Post Graduate'),
(gen_random_uuid(), 'M.F.A.', 'Post Graduate'),
(gen_random_uuid(), 'M.P.E.', 'Post Graduate'),
(gen_random_uuid(), 'M.Lib.Sc', 'Post Graduate'),
(gen_random_uuid(), 'M.Phil', 'Post Graduate'),
(gen_random_uuid(), 'M.P.Ed', 'Post Graduate'),
(gen_random_uuid(), 'MSW', 'Post Graduate'),
(gen_random_uuid(), 'M.J.M.C.', 'Post Graduate'),
(gen_random_uuid(), 'MHM', 'Post Graduate'),
(gen_random_uuid(), 'PGDM', 'Post Graduate'),
(gen_random_uuid(), 'PGDCA', 'Post Graduate'),
(gen_random_uuid(), 'PG Diploma in Management', 'Post Graduate');

-- Doctorate Education Names
INSERT INTO educations (id, education_name, education_level) VALUES
(gen_random_uuid(), 'Ph.D.', 'Doctorate'),
(gen_random_uuid(), 'D.Sc', 'Doctorate'),
(gen_random_uuid(), 'D.Litt', 'Doctorate'),
(gen_random_uuid(), 'DBA', 'Doctorate'),
(gen_random_uuid(), 'Ed.D', 'Doctorate'),
(gen_random_uuid(), 'DM', 'Doctorate'),
(gen_random_uuid(), 'D.Pharm', 'Doctorate'),
(gen_random_uuid(), 'LL.D', 'Doctorate');

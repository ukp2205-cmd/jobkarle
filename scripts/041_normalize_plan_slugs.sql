-- Normalize all plan slugs to lowercase without hyphens
-- This ensures consistency for the payment system

UPDATE plans 
SET slug = LOWER(REPLACE(REPLACE(slug, '-', ''), ' ', ''))
WHERE slug IS NOT NULL;

-- Verify the updates
SELECT id, name, slug FROM plans;

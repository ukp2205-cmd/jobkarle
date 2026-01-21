-- Create employer_documents table for document verification
CREATE TABLE IF NOT EXISTS employer_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_id UUID NOT NULL REFERENCES employers(id) ON DELETE CASCADE,
  
  -- Document URLs (stored in Vercel Blob or Supabase Storage)
  pan_card_url TEXT,
  gst_certificate_url TEXT,
  incorporation_certificate_url TEXT,
  
  -- Company email verification
  company_email TEXT,
  company_email_verified BOOLEAN DEFAULT FALSE,
  company_email_verification_token TEXT,
  company_email_verified_at TIMESTAMPTZ,
  
  -- Document verification status
  document_status TEXT DEFAULT 'pending' CHECK (document_status IN ('pending', 'under_review', 'verified', 'rejected')),
  rejection_reason TEXT,
  verified_by UUID,
  verified_at TIMESTAMPTZ,
  
  -- Metadata
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX idx_employer_documents_employer_id ON employer_documents(employer_id);
CREATE INDEX idx_employer_documents_status ON employer_documents(document_status);

-- Add RLS policies
ALTER TABLE employer_documents ENABLE ROW LEVEL SECURITY;

-- Policy: Employers can view their own documents
CREATE POLICY "Employers can view own documents" ON employer_documents
  FOR SELECT
  USING (employer_id = auth.uid());

-- Policy: Employers can insert their own documents
CREATE POLICY "Employers can insert own documents" ON employer_documents
  FOR INSERT
  WITH CHECK (employer_id = auth.uid());

-- Policy: Employers can update their own pending documents
CREATE POLICY "Employers can update own pending documents" ON employer_documents
  FOR UPDATE
  USING (employer_id = auth.uid() AND document_status = 'pending');

-- Add columns to employers table for document verification tracking
ALTER TABLE employers 
ADD COLUMN IF NOT EXISTS documents_submitted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS documents_verified BOOLEAN DEFAULT FALSE;

COMMENT ON TABLE employer_documents IS 'Stores employer verification documents (PAN, GST, Incorporation Certificate) and company email verification';
COMMENT ON COLUMN employer_documents.document_status IS 'Status: pending (submitted), under_review (admin reviewing), verified (approved), rejected (not approved)';
COMMENT ON COLUMN employer_documents.company_email IS 'Official company email for verification (must be company domain, not gmail/yahoo/zoho)';

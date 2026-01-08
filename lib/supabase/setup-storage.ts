// Run this script once to set up the storage bucket for resumes
// Usage: npm run setup-storage

import { createClient } from "@supabase/supabase-js"

async function setupResumeStorage() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error("❌ Missing environment variables:")
    console.error("   - NEXT_PUBLIC_SUPABASE_URL")
    console.error("   - SUPABASE_SERVICE_ROLE_KEY")
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  console.log("🚀 Setting up resume storage bucket...")

  try {
    // Check if bucket already exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets()

    if (listError) {
      console.error("❌ Error listing buckets:", listError)
      process.exit(1)
    }

    const bucketExists = buckets?.some((b) => b.name === "resume_storage")

    if (bucketExists) {
      console.log("ℹ️  Resume storage bucket already exists")
      process.exit(0)
    }

    const { data, error } = await supabase.storage.createBucket("resume_storage", {
      public: true,
      fileSizeLimit: 5242880, // 5MB
      allowedMimeTypes: [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/rtf",
      ],
    })

    if (error) {
      console.error("❌ Error creating bucket:", error.message)
      process.exit(1)
    }

    console.log("✅ Resume storage bucket created successfully!")
    console.log("   - Name: resume_storage")
    console.log("   - Public: Yes")
    console.log("   - File size limit: 5MB")
    console.log("   - Allowed types: PDF, DOC, DOCX, RTF")
  } catch (error) {
    console.error("❌ Exception:", error)
    process.exit(1)
  }
}

// Run the setup
setupResumeStorage()

import { createClient } from "@/lib/supabase/client"

export async function createBrowserClient() {
  return createClient()
}

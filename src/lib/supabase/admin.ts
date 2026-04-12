import { createClient } from "@supabase/supabase-js";

// Admin client using service_role key — server-side only
// Required env: SUPABASE_SERVICE_ROLE_KEY
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

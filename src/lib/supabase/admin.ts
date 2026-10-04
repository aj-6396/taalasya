import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

let adminSupabaseClient: SupabaseClient | null = null;

export function getAdminSupabase(): SupabaseClient {
  const apiKey = supabaseServiceRoleKey || supabaseAnonKey;

  if (!supabaseUrl || !apiKey) {
    console.warn(
      "[Supabase Admin] Warning: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not configured. " +
        "Database operations will run in local demo mode."
    );
  }

  if (!adminSupabaseClient) {
    adminSupabaseClient = createClient(
      supabaseUrl || "https://placeholder-project.supabase.co",
      apiKey || "placeholder-key",
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    );
  }

  return adminSupabaseClient;
}

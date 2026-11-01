import { createClient } from "@supabase/supabase-js";
import { Database } from "./database.types";
import { env } from "@/lib/env";

const supabaseUrl = env.supabaseUrl;
const supabaseAnonKey = env.supabaseAnonKey;

export const isSupabaseConfigured = env.isSupabaseConfigured;

export const supabase = createClient<Database>(
  supabaseUrl || "https://placeholder-project.supabase.co",
  supabaseAnonKey || "placeholder-anon-key",
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: "pkce",
    },
  }
);

/**
 * Returns a Supabase client configured with the caller's JWT Bearer token
 * for authenticated server-side mutations respecting Row Level Security (RLS).
 */
export function getAuthenticatedSupabaseClient(accessToken?: string) {
  if (!accessToken || !supabaseUrl || !supabaseAnonKey) {
    return supabase;
  }
  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}


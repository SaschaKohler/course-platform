import { createClient } from "@supabase/supabase-js";
import { Database } from "../types/supabase";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl) throw new Error("Missing env.VITE_SUPABASE_URL");
if (!supabaseAnonKey) throw new Error("Missing env.VITE_SUPABASE_ANON_KEY");

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    storageKey: "supabase-auth",
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

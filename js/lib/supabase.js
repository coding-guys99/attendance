import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { APP_CONFIG } from "../core/config.js";

export const supabase = createClient(
  APP_CONFIG.supabaseUrl,
  APP_CONFIG.supabaseAnonKey
);
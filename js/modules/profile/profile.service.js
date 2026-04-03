import { supabase } from "../../lib/supabase.js";
import { state } from "../../core/state.js";

export async function fetchMyProfile() {
  if (!state.user?.id) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", state.user.id)
    .single();

  if (error) {
    console.error("fetchMyProfile error:", error);
    return null;
  }

  state.profile = data || null;
  return state.profile;
}

export function isAdminUser() {
  return state.profile?.role === "admin";
}
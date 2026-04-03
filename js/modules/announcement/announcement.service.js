import { supabase } from "../../lib/supabase.js";

export async function fetchAnnouncements() {
  const { data, error } = await supabase
    .from("announcements")
    .select("*")
    .eq("is_published", true)
    .order("published_at", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}
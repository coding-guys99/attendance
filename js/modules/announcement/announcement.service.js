import { supabase } from "../../lib/supabase.js";
import { state } from "../../core/state.js";

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

export async function createAnnouncement({
  title,
  content,
  category = "general",
}) {
  if (!state.user?.id) {
    throw new Error("請先登入");
  }

  const payload = {
    title: title.trim(),
    content: content.trim(),
    category,
    is_published: true,
    published_at: new Date().toISOString(),
    created_by: state.user.id,
  };

  const { data, error } = await supabase
    .from("announcements")
    .insert(payload)
    .select("*")
    .single();

  if (error) throw error;

  return data;
}
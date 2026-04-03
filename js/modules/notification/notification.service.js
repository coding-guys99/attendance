import { supabase } from "../../lib/supabase.js";
import { state } from "../../core/state.js";

export async function fetchNotifications() {
  if (!state.user?.id) return [];

  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", state.user.id)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getUnreadNotificationCount() {
  if (!state.user?.id) return 0;

  const { count, error } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", state.user.id)
    .eq("is_read", false);

  if (error) throw error;
  return count || 0;
}

export async function markNotificationAsRead(notificationId) {
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", notificationId)
    .eq("user_id", state.user.id);

  if (error) throw error;
}
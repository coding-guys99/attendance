import { supabase } from "../../lib/supabase.js";
import { state } from "../../core/state.js";

export async function initializeAuth() {
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    console.error("initializeAuth error:", error);
    state.session = null;
    state.user = null;
    return null;
  }

  state.session = data.session;
  state.user = data.session?.user || null;

  supabase.auth.onAuthStateChange((_event, session) => {
    state.session = session;
    state.user = session?.user || null;
  });

  return state.user;
}

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (!error) {
    state.session = data.session;
    state.user = data.user;
  }

  return { data, error };
}

export async function signUp(email, password) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  return { data, error };
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();

  if (!error) {
    state.session = null;
    state.user = null;
  }

  return { error };
}
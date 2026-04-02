import { supabase } from "../../lib/supabase.js";
import { state } from "../../core/state.js";

export async function initializeAuth() {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  state.session = session;
  state.user = session?.user ?? null;

  supabase.auth.onAuthStateChange((_event, session) => {
    state.session = session;
    state.user = session?.user ?? null;
  });
}

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
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
import { supabase } from "../../lib/supabase.js";
import { state } from "../../core/state.js";

/**
 * 初始化登入狀態
 * - 頁面刷新後還能保持登入
 * - 監聽登入/登出變化
 */
export async function initializeAuth() {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) {
    console.error("initializeAuth error:", error);
  }

  state.session = session ?? null;
  state.user = session?.user ?? null;

  // 監聽登入狀態變化
  supabase.auth.onAuthStateChange((_event, session) => {
    state.session = session ?? null;
    state.user = session?.user ?? null;

    console.log("Auth changed:", _event, session);
  });

  return { session, error };
}

/**
 * 登入
 */
export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error("signIn error:", error);
  }

  return { data, error };
}

/**
 * 註冊
 */
export async function signUp(email, password) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    console.error("signUp error:", error);
  }

  return { data, error };
}

/**
 * 登出
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error("signOut error:", error);
    return { error };
  }

  // 清掉本地 state
  state.session = null;
  state.user = null;

  return { error: null };
}

/**
 * 是否已登入
 */
export function isAuthenticated() {
  return !!state.user;
}

/**
 * 取得目前使用者
 */
export function getCurrentUser() {
  return state.user;
}
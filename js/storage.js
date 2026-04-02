import { DEFAULT_USERS, STORAGE_KEYS } from "./constants.js";

export function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (error) {
    console.error(`讀取 ${key} 失敗`, error);
    return fallback;
  }
}

export function writeJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`寫入 ${key} 失敗`, error);
  }
}

export function initStorage() {
  const users = readJSON(STORAGE_KEYS.USERS, null);
  if (!users) {
    writeJSON(STORAGE_KEYS.USERS, DEFAULT_USERS);
  }

  const records = readJSON(STORAGE_KEYS.RECORDS, null);
  if (!records) {
    writeJSON(STORAGE_KEYS.RECORDS, []);
  }
}

export function getUsers() {
  return readJSON(STORAGE_KEYS.USERS, []);
}

export function saveUsers(users) {
  writeJSON(STORAGE_KEYS.USERS, users);
}

export function getCurrentUser() {
  return readJSON(STORAGE_KEYS.CURRENT_USER, null);
}

export function saveCurrentUser(user) {
  writeJSON(STORAGE_KEYS.CURRENT_USER, user);
}

export function clearCurrentUser() {
  localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
}

export function getRecords() {
  return readJSON(STORAGE_KEYS.RECORDS, []);
}

export function saveRecords(records) {
  writeJSON(STORAGE_KEYS.RECORDS, records);
}
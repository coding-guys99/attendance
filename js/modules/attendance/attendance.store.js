import { APP_CONFIG } from "../../core/config.js";

export function loadRecords() {
  try {
    const raw = localStorage.getItem(APP_CONFIG.storageKey);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("loadRecords error:", error);
    return [];
  }
}

export function saveRecords(records) {
  localStorage.setItem(APP_CONFIG.storageKey, JSON.stringify(records));
}

export function replaceAllRecords(records) {
  localStorage.setItem(APP_CONFIG.storageKey, JSON.stringify(records));
}
import { APP_CONFIG } from "../core/config.js";

export function getNow() {
  return new Date();
}

export function toISO(date) {
  return date.toISOString();
}

export function getDateKey(date = new Date()) {
  const formatter = new Intl.DateTimeFormat("sv-SE", {
    timeZone: APP_CONFIG.timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(date);
}

export function getMonthKey(date = new Date()) {
  const formatter = new Intl.DateTimeFormat("sv-SE", {
    timeZone: APP_CONFIG.timezone,
    year: "numeric",
    month: "2-digit",
  });

  return formatter.format(date);
}

export function formatDate(dateInput) {
  const date = new Date(dateInput);
  return new Intl.DateTimeFormat(APP_CONFIG.locale, {
    timeZone: APP_CONFIG.timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "long",
  }).format(date);
}

export function formatDateOnly(dateInput) {
  const date = new Date(dateInput);
  return new Intl.DateTimeFormat(APP_CONFIG.locale, {
    timeZone: APP_CONFIG.timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function formatDateTime(dateInput) {
  const date = new Date(dateInput);
  return new Intl.DateTimeFormat(APP_CONFIG.locale, {
    timeZone: APP_CONFIG.timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(date);
}

export function formatTime(dateInput) {
  const date = new Date(dateInput);
  return new Intl.DateTimeFormat(APP_CONFIG.locale, {
    timeZone: APP_CONFIG.timezone,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(date);
}

export function toLocalDatetimeValue(dateInput) {
  const date = new Date(dateInput);
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60 * 1000);
  return localDate.toISOString().slice(0, 19);
}

export function fromLocalDatetimeValue(value) {
  return new Date(value);
}

export function buildDateFromParts(dateKey, timeString = "00:00:00") {
  return new Date(`${dateKey}T${timeString}`);
}

export function getDaysInMonth(monthKey) {
  const [year, month] = monthKey.split("-").map(Number);
  return new Date(year, month, 0).getDate();
}

export function getFirstWeekdayOfMonth(monthKey) {
  const [year, month] = monthKey.split("-").map(Number);
  return new Date(year, month - 1, 1).getDay();
}

export function buildMonthDateKey(monthKey, dayNumber) {
  return `${monthKey}-${String(dayNumber).padStart(2, "0")}`;
}
import { state } from "../../core/state.js";

function ensureHolidayCache() {
  if (!state.holidayCache) {
    state.holidayCache = {};
  }
}

function getCacheKey(year, country) {
  return `${country}-${year}`;
}

export async function fetchPublicHolidays(year, country) {
  const url = `https://date.nager.at/api/v3/PublicHolidays/${year}/${country}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`假期 API 請求失敗：${response.status}`);
  }

  const data = await response.json();

  return Array.isArray(data) ? data : [];
}

export async function ensurePublicHolidays(year, country) {
  ensureHolidayCache();

  const cacheKey = getCacheKey(year, country);
  if (state.holidayCache[cacheKey]) {
    return state.holidayCache[cacheKey];
  }

  const holidays = await fetchPublicHolidays(year, country);

  const holidayMap = {};
  holidays.forEach((item) => {
    holidayMap[item.date] = {
      date: item.date,
      localName: item.localName || item.name || "Public Holiday",
      name: item.name || item.localName || "Public Holiday",
      countryCode: item.countryCode || country,
      global: item.global ?? true,
      types: item.types || [],
    };
  });

  state.holidayCache[cacheKey] = holidayMap;
  return holidayMap;
}

export function getCachedPublicHolidays(year, country) {
  ensureHolidayCache();
  return state.holidayCache[getCacheKey(year, country)] || {};
}

export function clearHolidayCache() {
  state.holidayCache = {};
}
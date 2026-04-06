import { state } from "../../core/state.js";

function ensureHolidayCache() {
  if (!state.holidayCache) {
    state.holidayCache = {};
  }
}

function getCacheKey(year, country) {
  return `${country}-${year}`;
}

// 手動 fallback，至少先補你現在最需要的
const HOLIDAY_FALLBACK = {
  "TW-2026": {
    "2026-04-03": {
      date: "2026-04-03",
      localName: "兒童節補假",
      name: "Children's Day Holiday",
      countryCode: "TW",
    },
    "2026-04-04": {
      date: "2026-04-04",
      localName: "兒童節",
      name: "Children's Day",
      countryCode: "TW",
    },
    "2026-04-05": {
      date: "2026-04-05",
      localName: "清明節",
      name: "Tomb Sweeping Day",
      countryCode: "TW",
    },
    "2026-04-06": {
      date: "2026-04-06",
      localName: "清明節補假",
      name: "Tomb Sweeping Day Holiday",
      countryCode: "TW",
    },
  },
};

export async function fetchPublicHolidays(year, country) {
  const url = `https://date.nager.at/api/v3/PublicHolidays/${year}/${country}`;
  const response = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  });

  // 有些情況可能不是 JSON 或空 body，先用 text 再自己 parse，比較穩
  const rawText = await response.text();

  if (!response.ok) {
    throw new Error(`假期 API 請求失敗：${response.status} ${rawText || ""}`.trim());
  }

  if (!rawText || !rawText.trim()) {
    throw new Error("假期 API 回傳空內容。");
  }

  let data;
  try {
    data = JSON.parse(rawText);
  } catch (error) {
    console.error("fetchPublicHolidays JSON parse error:", rawText);
    throw new Error("假期 API JSON 解析失敗。");
  }

  return Array.isArray(data) ? data : [];
}

export async function ensurePublicHolidays(year, country) {
  ensureHolidayCache();

  const cacheKey = getCacheKey(year, country);
  if (state.holidayCache[cacheKey]) {
    return state.holidayCache[cacheKey];
  }

  try {
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
  } catch (error) {
    console.error("ensurePublicHolidays fallback:", error);

    // API 失敗時走 fallback
    const fallback = HOLIDAY_FALLBACK[cacheKey] || {};
    state.holidayCache[cacheKey] = fallback;
    return fallback;
  }
}

export function getCachedPublicHolidays(year, country) {
  ensureHolidayCache();
  return state.holidayCache[getCacheKey(year, country)] || {};
}

export function clearHolidayCache() {
  state.holidayCache = {};
}
import { DAY_TYPES, DAY_TYPE_LABELS } from "../../core/day-types.js";

function toDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * 先手動放特殊日期
 * 後續你可以每年更新這份資料
 */
export const SPECIAL_DATES = {
  // 範例
  // "2026-01-01": { type: DAY_TYPES.NATIONAL_HOLIDAY, label: "開國紀念日" },
  // "2026-02-07": { type: DAY_TYPES.MAKEUP_WORKDAY, label: "補班日" },
};

export function getDayRule(date = new Date()) {
  const dateKey = toDateKey(date);

  if (SPECIAL_DATES[dateKey]) {
    return {
      date: dateKey,
      type: SPECIAL_DATES[dateKey].type,
      label: SPECIAL_DATES[dateKey].label,
      isSpecialDate: true,
    };
  }

  const day = date.getDay();

  if (day === 0) {
    return {
      date: dateKey,
      type: DAY_TYPES.REGULAR_DAY_OFF,
      label: DAY_TYPE_LABELS[DAY_TYPES.REGULAR_DAY_OFF],
      isSpecialDate: false,
    };
  }

  if (day === 6) {
    return {
      date: dateKey,
      type: DAY_TYPES.REST_DAY,
      label: DAY_TYPE_LABELS[DAY_TYPES.REST_DAY],
      isSpecialDate: false,
    };
  }

  return {
    date: dateKey,
    type: DAY_TYPES.WORKDAY,
    label: DAY_TYPE_LABELS[DAY_TYPES.WORKDAY],
    isSpecialDate: false,
  };
}
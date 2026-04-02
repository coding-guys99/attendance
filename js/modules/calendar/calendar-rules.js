import { DAY_TYPES, DAY_TYPE_LABELS } from "../../core/day-types.js";

function toDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getDayTypeLabel(type) {
  return DAY_TYPE_LABELS[type] || "工作日";
}

/**
 * 特殊日期規則
 * 你之後可以每年更新這份資料
 *
 * 建議格式：
 * "2026-01-01": {
 *   type: DAY_TYPES.NATIONAL_HOLIDAY,
 *   label: "國定假日",
 *   name: "開國紀念日",
 * }
 */
export const SPECIAL_DATES = {
  // "2026-01-01": {
  //   type: DAY_TYPES.NATIONAL_HOLIDAY,
  //   label: "國定假日",
  //   name: "開國紀念日",
  // },
  // "2026-02-07": {
  //   type: DAY_TYPES.MAKEUP_WORKDAY,
  //   label: "補班日",
  //   name: "補班日",
  // },
};

export function getDayRule(date = new Date()) {
  const dateKey = toDateKey(date);

  if (SPECIAL_DATES[dateKey]) {
    const special = SPECIAL_DATES[dateKey];

    const type = special.type;
    const label = special.label || getDayTypeLabel(type);
    const name = special.name || label;

    return {
      date: dateKey,
      type,
      label,
      name,
      isSpecialDate: true,
      isWeekend: false,
      isHoliday:
        type === DAY_TYPES.NATIONAL_HOLIDAY ||
        type === DAY_TYPES.REST_DAY ||
        type === DAY_TYPES.REGULAR_DAY_OFF,
      isWorkday:
        type === DAY_TYPES.WORKDAY ||
        type === DAY_TYPES.MAKEUP_WORKDAY,
    };
  }

  const day = date.getDay();

  if (day === 0) {
    return {
      date: dateKey,
      type: DAY_TYPES.REGULAR_DAY_OFF,
      label: getDayTypeLabel(DAY_TYPES.REGULAR_DAY_OFF),
      name: getDayTypeLabel(DAY_TYPES.REGULAR_DAY_OFF),
      isSpecialDate: false,
      isWeekend: true,
      isHoliday: true,
      isWorkday: false,
    };
  }

  if (day === 6) {
    return {
      date: dateKey,
      type: DAY_TYPES.REST_DAY,
      label: getDayTypeLabel(DAY_TYPES.REST_DAY),
      name: getDayTypeLabel(DAY_TYPES.REST_DAY),
      isSpecialDate: false,
      isWeekend: true,
      isHoliday: true,
      isWorkday: false,
    };
  }

  return {
    date: dateKey,
    type: DAY_TYPES.WORKDAY,
    label: getDayTypeLabel(DAY_TYPES.WORKDAY),
    name: getDayTypeLabel(DAY_TYPES.WORKDAY),
    isSpecialDate: false,
    isWeekend: false,
    isHoliday: false,
    isWorkday: true,
  };
}
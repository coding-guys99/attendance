import {
  getDaysInMonth,
  getFirstWeekdayOfMonth,
  buildMonthDateKey,
} from "../../utils/date.js";
import { getAttendanceAnalysis } from "../../utils/attendance-status.js";

export function buildCalendarData(records, monthKey) {
  const daysInMonth = getDaysInMonth(monthKey);
  const firstWeekday = getFirstWeekdayOfMonth(monthKey);

  const map = new Map(records.map((item) => [item.date, item]));
  const cells = [];

  for (let i = 0; i < firstWeekday; i += 1) {
    cells.push({
      type: "empty",
      key: `empty-${i}`,
    });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const dateKey = buildMonthDateKey(monthKey, day);
    const record = map.get(dateKey) || null;
    const analysis = record ? getAttendanceAnalysis(record) : null;

    cells.push({
      type: "day",
      key: dateKey,
      dayNumber: day,
      dateKey,
      record,
      analysis,
    });
  }

  return cells;
}
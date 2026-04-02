import { state } from "../../core/state.js";
import { RECORD_TYPES } from "../../core/constants.js";
import { sumWorkSeconds } from "../../utils/time.js";
import { getMonthKey, getDateKey } from "../../utils/date.js";
import { getAttendanceAnalysis } from "../../utils/attendance-status.js";

export function getAllRecords() {
  return [...state.records].sort((a, b) => {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

export function getCurrentMonthRecords(now = new Date()) {
  const currentMonthKey = getMonthKey(now);
  return getAllRecords().filter((item) => item.date.slice(0, 7) === currentMonthKey);
}

export function filterRecords({ month = "", keyword = "" } = {}) {
  const safeKeyword = (keyword || "").trim().toLowerCase();

  return getAllRecords().filter((item) => {
    const matchMonth = month ? item.date.slice(0, 7) === month : true;
    const source = `${item.date} ${item.note || ""} ${item.status || ""} ${item.type || ""}`.toLowerCase();
    const matchKeyword = safeKeyword ? source.includes(safeKeyword) : true;
    return matchMonth && matchKeyword;
  });
}

export function getMonthOptions() {
  const monthSet = new Set(getAllRecords().map((item) => item.date.slice(0, 7)));
  return [...monthSet].sort((a, b) => b.localeCompare(a));
}

export function getRecent7DaysTrend(now = new Date()) {
  const records = getAllRecords();
  const map = new Map(records.map((item) => [item.date, item]));

  const result = [];

  for (let i = 6; i >= 0; i -= 1) {
    const date = new Date(now);
    date.setDate(now.getDate() - i);

    const dateKey = getDateKey(date);
    const record = map.get(dateKey);

    result.push({
      dateKey,
      label: dateKey.slice(5),
      seconds: record?.type === RECORD_TYPES.WORK ? record?.workSeconds || 0 : 0,
    });
  }

  return result;
}

export function getMonthlyReport(monthKey) {
  const records = getAllRecords().filter((item) => item.date.slice(0, 7) === monthKey);
  const workRecords = records.filter((item) => item.type === RECORD_TYPES.WORK);
  const completed = workRecords.filter((item) => item.clockIn && item.clockOut);
  const totalSeconds = sumWorkSeconds(completed);

  let lateCount = 0;
  let earlyLeaveCount = 0;
  let overtimeCount = 0;

  completed.forEach((record) => {
    const analysis = getAttendanceAnalysis(record);
    if (analysis.isLate) lateCount += 1;
    if (analysis.isEarlyLeave) earlyLeaveCount += 1;
    if (analysis.isOvertime) overtimeCount += 1;
  });

  const leaveCount = records.filter((item) => item.type === RECORD_TYPES.LEAVE).length;
  const sickCount = records.filter((item) => item.type === RECORD_TYPES.SICK).length;
  const tripCount = records.filter((item) => item.type === RECORD_TYPES.BUSINESS_TRIP).length;
  const outCount = records.filter((item) => item.type === RECORD_TYPES.OUT_OF_OFFICE).length;

  return {
    monthKey,
    totalRecords: records.length,
    workDays: completed.length,
    totalSeconds,
    averageSeconds: completed.length ? Math.floor(totalSeconds / completed.length) : 0,
    lateCount,
    earlyLeaveCount,
    overtimeCount,
    leaveCount,
    sickCount,
    tripCount,
    outCount,
    records,
  };
}

export function getHistorySummary(now = new Date()) {
  const records = getAllRecords();
  const completed = records.filter((item) => item.type === RECORD_TYPES.WORK && item.clockIn && item.clockOut);
  const totalSeconds = sumWorkSeconds(completed);

  const monthRecords = getCurrentMonthRecords(now);
  const monthCompleted = monthRecords.filter((item) => item.type === RECORD_TYPES.WORK && item.clockIn && item.clockOut);
  const monthSeconds = sumWorkSeconds(monthCompleted);

  return {
    totalDays: records.length,
    completedDays: completed.length,
    totalSeconds,
    currentMonthDays: monthRecords.length,
    currentMonthCompletedDays: monthCompleted.length,
    currentMonthSeconds: monthSeconds,
    currentMonthKey: getMonthKey(now),
  };
}
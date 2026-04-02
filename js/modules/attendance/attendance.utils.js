import { getDateKey, toISO } from "../../utils/date.js";
import { getSecondsBetween } from "../../utils/time.js";
import { ATTENDANCE_STATUS, RECORD_TYPES } from "../../core/constants.js";

export function findTodayRecord(records, now = new Date()) {
  const todayKey = getDateKey(now);
  return records.find((item) => item.date === todayKey) || null;
}

export function findRecordByDate(records, dateKey) {
  return records.find((item) => item.date === dateKey) || null;
}

export function completeRecord(record, now = new Date()) {
  const clockOutISO = toISO(now);
  const workSeconds = getSecondsBetween(record.clockIn, clockOutISO);

  return {
    ...record,
    clockOut: clockOutISO,
    workSeconds,
    status: ATTENDANCE_STATUS.COMPLETED,
    updatedAt: clockOutISO,
  };
}

export function buildManualCompletedRecord({
  id,
  date,
  clockInISO,
  clockOutISO,
  note = "",
  type = RECORD_TYPES.WORK,
}) {
  return {
    id,
    date,
    type,
    clockIn: clockInISO,
    clockOut: clockOutISO,
    workSeconds: type === RECORD_TYPES.WORK ? getSecondsBetween(clockInISO, clockOutISO) : 0,
    status: ATTENDANCE_STATUS.COMPLETED,
    note,
    createdAt: clockInISO,
    updatedAt: toISO(new Date()),
  };
}
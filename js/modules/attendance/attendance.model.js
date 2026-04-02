import { generateId } from "../../utils/id.js";
import { getDateKey, toISO } from "../../utils/date.js";
import { ATTENDANCE_STATUS, RECORD_TYPES } from "../../core/constants.js";

export function createClockInRecord(now = new Date()) {
  return {
    id: generateId(),
    date: getDateKey(now),
    type: RECORD_TYPES.WORK,
    clockIn: toISO(now),
    clockOut: null,
    workSeconds: 0,
    status: ATTENDANCE_STATUS.WORKING,
    note: "",
    createdAt: toISO(now),
    updatedAt: toISO(now),
  };
}
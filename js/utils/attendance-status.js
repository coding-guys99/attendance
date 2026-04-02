import { state } from "../core/state.js";
import { RECORD_TYPES, RECORD_TYPE_LABELS } from "../core/constants.js";
import { buildDateFromParts } from "./date.js";

function diffMinutes(a, b) {
  return Math.floor((a.getTime() - b.getTime()) / 60000);
}

export function getRecordTypeLabel(type) {
  return RECORD_TYPE_LABELS[type] || "未知";
}

export function getAttendanceAnalysis(record) {
  if (!record) {
    return {
      isLate: false,
      isEarlyLeave: false,
      isOvertime: false,
      lateMinutes: 0,
      earlyLeaveMinutes: 0,
      overtimeMinutes: 0,
      label: "未完成",
    };
  }

  if (record.type && record.type !== RECORD_TYPES.WORK) {
    return {
      isLate: false,
      isEarlyLeave: false,
      isOvertime: false,
      lateMinutes: 0,
      earlyLeaveMinutes: 0,
      overtimeMinutes: 0,
      label: getRecordTypeLabel(record.type),
    };
  }

  if (!record.clockIn || !record.clockOut) {
    return {
      isLate: false,
      isEarlyLeave: false,
      isOvertime: false,
      lateMinutes: 0,
      earlyLeaveMinutes: 0,
      overtimeMinutes: 0,
      label: "未完成",
    };
  }

  const rules = state.settings;

  const expectedIn = buildDateFromParts(record.date, rules.expectedClockIn);
  const expectedOut = buildDateFromParts(record.date, rules.expectedClockOut);

  const actualIn = new Date(record.clockIn);
  const actualOut = new Date(record.clockOut);

  const lateMinutesRaw = diffMinutes(actualIn, expectedIn);
  const earlyLeaveMinutesRaw = diffMinutes(expectedOut, actualOut);
  const overtimeMinutesRaw = diffMinutes(actualOut, expectedOut);

  const lateMinutes = Math.max(0, lateMinutesRaw);
  const earlyLeaveMinutes = Math.max(0, earlyLeaveMinutesRaw);
  const overtimeMinutes = Math.max(0, overtimeMinutesRaw);

  const isLate = lateMinutes > rules.lateGraceMinutes;
  const isEarlyLeave = earlyLeaveMinutes > rules.earlyLeaveGraceMinutes;
  const isOvertime = overtimeMinutes >= rules.overtimeThresholdMinutes;

  let label = "正常";
  if (isLate && isEarlyLeave) {
    label = "遲到 / 早退";
  } else if (isLate) {
    label = "遲到";
  } else if (isEarlyLeave) {
    label = "早退";
  } else if (isOvertime) {
    label = "加班";
  }

  return {
    isLate,
    isEarlyLeave,
    isOvertime,
    lateMinutes,
    earlyLeaveMinutes,
    overtimeMinutes,
    label,
  };
}
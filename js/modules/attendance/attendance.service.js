import { state } from "../../core/state.js";
import { ATTENDANCE_STATUS, RECORD_TYPES } from "../../core/constants.js";
import { createClockInRecord } from "./attendance.model.js";
import { loadRecords, saveRecords, replaceAllRecords } from "./attendance.store.js";
import {
  completeRecord,
  findTodayRecord,
  findRecordByDate,
  buildManualCompletedRecord,
} from "./attendance.utils.js";
import { generateId } from "../../utils/id.js";
import { getDateKey } from "../../utils/date.js";
import { getSecondsBetween } from "../../utils/time.js";
import { evaluateGeofence } from "../../utils/geofence.js";

function sortRecords(records) {
  return [...records].sort((a, b) => {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

export function initializeAttendance() {
  state.records = sortRecords(loadRecords()).map((item) => ({
    type: RECORD_TYPES.WORK,
    ...item,
  }));
}

export function getTodayRecord(now = new Date()) {
  return findTodayRecord(state.records, now);
}

export function clockIn(now = new Date()) {
  const existing = getTodayRecord(now);

  if (existing) {
    if (existing.status === ATTENDANCE_STATUS.WORKING) {
      return { ok: false, message: "今天已經上班打卡了。" };
    }
    if (existing.status === ATTENDANCE_STATUS.COMPLETED) {
      return { ok: false, message: "今天的上下班紀錄已完成。" };
    }
  }

  const record = createClockInRecord(now);

  state.records = sortRecords([record, ...state.records]);
  saveRecords(state.records);

  return { ok: true, message: "上班打卡成功。", record };
}

export function clockOut(now = new Date()) {
  const existing = getTodayRecord(now);

  if (!existing) {
    return { ok: false, message: "今天還沒有上班打卡，不能先下班。" };
  }

  if (existing.type !== RECORD_TYPES.WORK) {
    return { ok: false, message: "這筆不是上班紀錄，不能進行下班打卡。" };
  }

  if (existing.status === ATTENDANCE_STATUS.COMPLETED) {
    return { ok: false, message: "今天已經完成下班打卡。" };
  }

  const updated = completeRecord(existing, now);

  state.records = sortRecords(
    state.records.map((item) => (item.id === updated.id ? updated : item))
  );

  saveRecords(state.records);

  return { ok: true, message: "下班打卡成功。", record: updated };
}

export function createManualRecord({ clockInValue, clockOutValue, note = "", type = RECORD_TYPES.WORK }) {
  if (!clockInValue || !clockOutValue) {
    return { ok: false, message: "請先填寫上班與下班時間。" };
  }

  const clockInDate = new Date(clockInValue);
  const clockOutDate = new Date(clockOutValue);

  if (Number.isNaN(clockInDate.getTime()) || Number.isNaN(clockOutDate.getTime())) {
    return { ok: false, message: "補卡時間格式不正確。" };
  }

  if (clockOutDate.getTime() <= clockInDate.getTime()) {
    return { ok: false, message: "下班時間必須晚於上班時間。" };
  }

  const dateKey = getDateKey(clockInDate);

  if (getDateKey(clockOutDate) !== dateKey) {
    return { ok: false, message: "目前版本補卡只支援同一天內的上下班時間。" };
  }

  const existing = findRecordByDate(state.records, dateKey);
  if (existing) {
    return { ok: false, message: "該日期已有紀錄，不能重複補卡。" };
  }

  const record = buildManualCompletedRecord({
    id: generateId(),
    date: dateKey,
    clockInISO: clockInDate.toISOString(),
    clockOutISO: clockOutDate.toISOString(),
    note: note.trim(),
    type,
  });

  state.records = sortRecords([record, ...state.records]);
  saveRecords(state.records);

  return { ok: true, message: "補卡成功。", record };
}

export function createStatusRecord({ dateValue, type, note = "" }) {
  if (!dateValue) {
    return { ok: false, message: "請先選擇日期。" };
  }

  const targetDate = new Date(`${dateValue}T09:00:00`);
  if (Number.isNaN(targetDate.getTime())) {
    return { ok: false, message: "日期格式不正確。" };
  }

  const dateKey = getDateKey(targetDate);
  const existing = findRecordByDate(state.records, dateKey);
  if (existing) {
    return { ok: false, message: "該日期已有紀錄，不能重複新增。" };
  }

  const start = new Date(`${dateKey}T09:00:00`);
  const end = new Date(`${dateKey}T18:00:00`);

  const record = buildManualCompletedRecord({
    id: generateId(),
    date: dateKey,
    clockInISO: start.toISOString(),
    clockOutISO: end.toISOString(),
    note: note.trim(),
    type,
  });

  state.records = sortRecords([record, ...state.records]);
  saveRecords(state.records);

  return { ok: true, message: "狀態紀錄已新增。", record };
}

export function updateFullRecord({ recordId, clockInValue, clockOutValue, note = "", type = RECORD_TYPES.WORK }) {
  const target = state.records.find((item) => item.id === recordId);
  if (!target) {
    return { ok: false, message: "找不到要編輯的紀錄。" };
  }

  if (!clockInValue || !clockOutValue) {
    return { ok: false, message: "請填寫完整的上班與下班時間。" };
  }

  const clockInDate = new Date(clockInValue);
  const clockOutDate = new Date(clockOutValue);

  if (Number.isNaN(clockInDate.getTime()) || Number.isNaN(clockOutDate.getTime())) {
    return { ok: false, message: "時間格式不正確。" };
  }

  if (clockOutDate.getTime() <= clockInDate.getTime()) {
    return { ok: false, message: "下班時間必須晚於上班時間。" };
  }

  const dateKey = getDateKey(clockInDate);
  if (getDateKey(clockOutDate) !== dateKey) {
    return { ok: false, message: "目前只支援同一天內的編輯紀錄。" };
  }

  const duplicate = state.records.find(
    (item) => item.id !== recordId && item.date === dateKey
  );
  if (duplicate) {
    return { ok: false, message: "該日期已有其他紀錄，不能重複。" };
  }

  const updated = {
    ...target,
    date: dateKey,
    type,
    clockIn: clockInDate.toISOString(),
    clockOut: clockOutDate.toISOString(),
    workSeconds: type === RECORD_TYPES.WORK
      ? getSecondsBetween(clockInDate.toISOString(), clockOutDate.toISOString())
      : 0,
    status: ATTENDANCE_STATUS.COMPLETED,
    note: note.trim(),
    createdAt: clockInDate.toISOString(),
    updatedAt: new Date().toISOString(),
  };

  state.records = sortRecords(
    state.records.map((item) => (item.id === recordId ? updated : item))
  );

  saveRecords(state.records);

  return { ok: true, message: "紀錄已更新。", record: updated };
}

export function importRecordsFromJSON(records) {
  if (!Array.isArray(records)) {
    return { ok: false, message: "JSON 格式不正確，必須是陣列。" };
  }

  const normalized = records
    .filter((item) => item && typeof item === "object" && item.id && item.date)
    .map((item) => ({
      id: item.id,
      date: item.date,
      type: item.type || RECORD_TYPES.WORK,
      clockIn: item.clockIn || null,
      clockOut: item.clockOut || null,
      workSeconds: Number(item.workSeconds || 0),
      status: item.status || ATTENDANCE_STATUS.COMPLETED,
      note: item.note || "",
      createdAt: item.createdAt || item.clockIn || new Date().toISOString(),
      updatedAt: item.updatedAt || new Date().toISOString(),
    }));

  state.records = sortRecords(normalized);
  replaceAllRecords(state.records);

  return {
    ok: true,
    message: `已匯入 ${state.records.length} 筆紀錄。`,
    count: state.records.length,
  };
}

export function deleteRecord(recordId) {
  state.records = sortRecords(state.records.filter((item) => item.id !== recordId));
  saveRecords(state.records);
}

export function clearAllRecords() {
  state.records = [];
  saveRecords(state.records);
}

import { supabase } from "../../lib/supabase.js";
import { mapRecordFromDb, mapRecordToDb } from "./attendance.mapper.js";

export async function fetchAttendanceRecords() {
  if (!state.user) return [];

  const { data, error } = await supabase
    .from("attendance_records")
    .select("*")
    .order("date", { ascending: false });

  if (error) throw error;

  state.records = (data || []).map(mapRecordFromDb);
  return state.records;
}

export async function createAttendanceRecord(record) {
  if (!state.user) throw new Error("User not logged in");

  const payload = mapRecordToDb(record, state.user.id);

  const { data, error } = await supabase
    .from("attendance_records")
    .insert(payload)
    .select()
    .single();

  if (error) throw error;

  const mapped = mapRecordFromDb(data);
  state.records = [mapped, ...state.records];
  return mapped;
}

export async function updateAttendanceRecord(recordId, updates) {
  const { data, error } = await supabase
    .from("attendance_records")
    .update(updates)
    .eq("id", recordId)
    .select()
    .single();

  if (error) throw error;

  const mapped = mapRecordFromDb(data);
  state.records = state.records.map((item) =>
    item.id === recordId ? mapped : item
  );

  return mapped;
}

export async function deleteAttendanceRecord(recordId) {
  const { error } = await supabase
    .from("attendance_records")
    .delete()
    .eq("id", recordId);

  if (error) throw error;

  state.records = state.records.filter((item) => item.id !== recordId);
}


export async function createClockInRecordWithLocation(record, userPosition) {
  if (!state.user) throw new Error("User not logged in");

  const fence = evaluateGeofence(userPosition, state.settings);

  if (!fence.allowed) {
    return {
      ok: false,
      message: `你目前不在公司打卡範圍內，距離約 ${Math.round(fence.distanceMeters)} 公尺。`,
    };
  }

  const payload = {
    user_id: state.user.id,
    date: record.date,
    type: record.type,
    clock_in: record.clockIn,
    clock_out: record.clockOut,
    work_seconds: record.workSeconds,
    status: record.status,
    note: record.note || "",
    clock_in_latitude: userPosition.latitude,
    clock_in_longitude: userPosition.longitude,
    clock_in_accuracy: userPosition.accuracy,
    clock_in_distance_meters: fence.distanceMeters,
    clock_in_inside_fence: fence.insideFence,
  };

  const { data, error } = await supabase
    .from("attendance_records")
    .insert(payload)
    .select("*")
    .single();

  if (error) throw error;

  return {
    ok: true,
    message: "上班打卡成功。",
    record: data,
  };
}

export async function clockOutWithLocation(recordId, userPosition) {
  if (!state.user) throw new Error("User not logged in");

  const fence = evaluateGeofence(userPosition, state.settings);

  if (!fence.allowed) {
    return {
      ok: false,
      message: `你目前不在公司打卡範圍內，距離約 ${Math.round(fence.distanceMeters)} 公尺。`,
    };
  }

  const { data, error } = await supabase
    .from("attendance_records")
    .update({
      clock_out_latitude: userPosition.latitude,
      clock_out_longitude: userPosition.longitude,
      clock_out_accuracy: userPosition.accuracy,
      clock_out_distance_meters: fence.distanceMeters,
      clock_out_inside_fence: fence.insideFence,
    })
    .eq("id", recordId)
    .select("*")
    .single();

  if (error) throw error;

  return {
    ok: true,
    message: "下班打卡成功。",
    record: data,
  };
}
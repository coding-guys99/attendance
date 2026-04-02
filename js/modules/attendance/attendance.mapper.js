import { RECORD_TYPES, ATTENDANCE_STATUS } from "../../core/constants.js";

export function mapRecordFromDb(row) {
  if (!row) return null;

  return {
    id: row.id,
    date: row.date,
    type: row.type || RECORD_TYPES.WORK,
    clockIn: row.clock_in || null,
    clockOut: row.clock_out || null,
    workSeconds: Number(row.work_seconds || 0),
    status: row.status || ATTENDANCE_STATUS.COMPLETED,
    note: row.note || "",
    dayType: row.day_type || null,
    dayLabel: row.day_label || null,
    clockInLatitude: row.clock_in_latitude ?? null,
    clockInLongitude: row.clock_in_longitude ?? null,
    clockInAccuracy: row.clock_in_accuracy ?? null,
    clockInDistanceMeters: row.clock_in_distance_meters ?? null,
    clockInInsideFence: row.clock_in_inside_fence ?? null,
    clockOutLatitude: row.clock_out_latitude ?? null,
    clockOutLongitude: row.clock_out_longitude ?? null,
    clockOutAccuracy: row.clock_out_accuracy ?? null,
    clockOutDistanceMeters: row.clock_out_distance_meters ?? null,
    clockOutInsideFence: row.clock_out_inside_fence ?? null,
    createdAt: row.created_at || row.clock_in || new Date().toISOString(),
    updatedAt: row.updated_at || new Date().toISOString(),
  };
}

export function mapRecordToDb(record, userId) {
  if (!record) return null;

  return {
    user_id: userId,
    date: record.date,
    type: record.type || RECORD_TYPES.WORK,
    clock_in: record.clockIn || null,
    clock_out: record.clockOut || null,
    work_seconds: Number(record.workSeconds || 0),
    status: record.status || ATTENDANCE_STATUS.COMPLETED,
    note: record.note || "",
    day_type: record.dayType || null,
    day_label: record.dayLabel || null,
    clock_in_latitude: record.clockInLatitude ?? null,
    clock_in_longitude: record.clockInLongitude ?? null,
    clock_in_accuracy: record.clockInAccuracy ?? null,
    clock_in_distance_meters: record.clockInDistanceMeters ?? null,
    clock_in_inside_fence: record.clockInInsideFence ?? null,
    clock_out_latitude: record.clockOutLatitude ?? null,
    clock_out_longitude: record.clockOutLongitude ?? null,
    clock_out_accuracy: record.clockOutAccuracy ?? null,
    clock_out_distance_meters: record.clockOutDistanceMeters ?? null,
    clock_out_inside_fence: record.clockOutInsideFence ?? null,
    created_at: record.createdAt || new Date().toISOString(),
    updated_at: record.updatedAt || new Date().toISOString(),
  };
}
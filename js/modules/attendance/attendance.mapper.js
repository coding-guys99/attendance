export function mapRecordFromDb(row) {
  return {
    id: row.id,
    userId: row.user_id,
    date: row.date,
    type: row.type,
    clockIn: row.clock_in,
    clockOut: row.clock_out,
    workSeconds: row.work_seconds,
    status: row.status,
    note: row.note,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapRecordToDb(record, userId) {
  return {
    user_id: userId,
    date: record.date,
    type: record.type,
    clock_in: record.clockIn,
    clock_out: record.clockOut,
    work_seconds: record.workSeconds,
    status: record.status,
    note: record.note,
  };
}
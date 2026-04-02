import { getAllRecords } from "../history/history.service.js";
import { formatDate, formatDateTime, formatDuration } from "../../utils/format.js";

function escapeCSV(value) {
  const text = String(value ?? "");
  if (text.includes(",") || text.includes('"') || text.includes("\n")) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function downloadBlob(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

export function exportAttendanceCSV() {
  const records = getAllRecords();

  const headers = [
    "日期",
    "上班完整時間",
    "下班完整時間",
    "工時",
    "狀態",
    "備註",
  ];

  const rows = records.map((record) => [
    formatDate(record.date),
    record.clockIn ? formatDateTime(record.clockIn) : "",
    record.clockOut ? formatDateTime(record.clockOut) : "",
    formatDuration(record.workSeconds || 0),
    record.status,
    record.note || "",
  ]);

  const content = [headers, ...rows]
    .map((row) => row.map(escapeCSV).join(","))
    .join("\n");

  const blob = new Blob(["\uFEFF" + content], { type: "text/csv;charset=utf-8;" });
  const fileName = `attendance-export-${new Date().toISOString().slice(0, 10)}.csv`;

  downloadBlob(blob, fileName);
}

export function exportAttendanceJSON() {
  const records = getAllRecords();
  const blob = new Blob([JSON.stringify(records, null, 2)], {
    type: "application/json;charset=utf-8;",
  });

  const fileName = `attendance-backup-${new Date().toISOString().slice(0, 10)}.json`;
  downloadBlob(blob, fileName);
}
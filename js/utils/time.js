export function getSecondsBetween(startISO, endISO) {
  if (!startISO || !endISO) return 0;
  const start = new Date(startISO).getTime();
  const end = new Date(endISO).getTime();
  return Math.max(0, Math.floor((end - start) / 1000));
}

export function formatDuration(totalSeconds = 0) {
  const seconds = Math.max(0, Number(totalSeconds) || 0);

  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;

  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function sumWorkSeconds(records = []) {
  return records.reduce((sum, item) => sum + (item.workSeconds || 0), 0);
}
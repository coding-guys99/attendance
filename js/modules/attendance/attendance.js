import { ATTENDANCE_STATUS } from "./constants.js";
import { getCurrentUser, getRecords, saveRecords } from "./storage.js";

export function canUserCheckIn(user = getCurrentUser()) {
  if (!user) {
    return {
      ok: false,
      message: "請先登入",
    };
  }

  if (!user.isActive) {
    return {
      ok: false,
      message: "此帳號已停用",
    };
  }

  if (!user.canCheckIn) {
    return {
      ok: false,
      message: "此帳號目前沒有打卡權限",
    };
  }

  return {
    ok: true,
    message: "",
  };
}

function formatDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatTime(date = new Date()) {
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  return `${hours}:${minutes}:${seconds}`;
}

export function getTodayRecordByUser(userId) {
  const records = getRecords();
  const today = formatDateKey();

  return (
    records.find((record) => record.userId === userId && record.date === today) ||
    null
  );
}

export function checkIn() {
  const user = getCurrentUser();
  const permission = canUserCheckIn(user);

  if (!permission.ok) {
    return permission;
  }

  const records = getRecords();
  const today = formatDateKey();
  const existing = records.find(
    (record) => record.userId === user.id && record.date === today
  );

  if (existing?.checkInTime) {
    return {
      ok: false,
      message: "今天已完成上班打卡",
    };
  }

  const newRecord = {
    id: `rec_${Date.now()}`,
    userId: user.id,
    userName: user.name,
    date: today,
    checkInTime: formatTime(),
    checkOutTime: "",
    status: ATTENDANCE_STATUS.WORKING,
  };

  records.push(newRecord);
  saveRecords(records);

  return {
    ok: true,
    message: "上班打卡成功",
    record: newRecord,
  };
}

export function checkOut() {
  const user = getCurrentUser();
  const permission = canUserCheckIn(user);

  if (!permission.ok) {
    return permission;
  }

  const records = getRecords();
  const today = formatDateKey();
  const target = records.find(
    (record) => record.userId === user.id && record.date === today
  );

  if (!target) {
    return {
      ok: false,
      message: "今天尚未上班打卡，不能直接下班",
    };
  }

  if (target.checkOutTime) {
    return {
      ok: false,
      message: "今天已完成下班打卡",
    };
  }

  target.checkOutTime = formatTime();
  target.status = ATTENDANCE_STATUS.COMPLETED;

  saveRecords(records);

  return {
    ok: true,
    message: "下班打卡成功",
    record: target,
  };
}
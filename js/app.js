import { state } from "./core/state.js";
import { VIEW_TYPES } from "./core/constants.js";
import { renderApp } from "./ui/renderer.js";
import { fetchAttendanceRecords } from "./modules/attendance/attendance.service.js";

import {
  initializeAttendance,
  clockIn,
  clockOut,
  createManualRecord,
  createStatusRecord,
  updateFullRecord,
  importRecordsFromJSON,
  deleteRecord,
  clearAllRecords,
} from "./modules/attendance/attendance.service.js";

import { startClock } from "./modules/clock/clock.js";

import {
  exportAttendanceCSV,
  exportAttendanceJSON,
} from "./modules/export/export.service.js";

import { getMonthKey, toLocalDatetimeValue } from "./utils/date.js";

import {
  loadSettings,
  saveSettings,
  resetSettings,
} from "./modules/settings/settings.service.js";

import { getCurrentPositionAsync, evaluateGeofence } from "./utils/geofence.js";

import {
  initializeAuth,
  signIn,
  signOut,
} from "./modules/auth/auth.service.js";

let sidebarToggleBound = false;
let sidebarNavBound = false;
let authModalBound = false;
let userMenuBound = false;
let topbarActionsBound = false;
let clockInitialized = false;

const ATTENDANCE_STATUS = {
  NOT_STARTED: "not_started",
  WORKING: "working",
  COMPLETED: "completed",
};

const statusTextMap = {
  [ATTENDANCE_STATUS.NOT_STARTED]: "未上班",
  [ATTENDANCE_STATUS.WORKING]: "上班中",
  [ATTENDANCE_STATUS.COMPLETED]: "已下班",
};

const statusClassMap = {
  [ATTENDANCE_STATUS.NOT_STARTED]: "status-badge--not-started",
  [ATTENDANCE_STATUS.WORKING]: "status-badge--working",
  [ATTENDANCE_STATUS.COMPLETED]: "status-badge--completed",
};

function $(selector) {
  return document.querySelector(selector);
}

function showMessage(targetId, message, type = "success") {
  const el = document.getElementById(targetId);
  if (!el) return;

  el.textContent = message || "";
  el.className = `message-box is-visible message-box--${type}`;
}

function clearMessage(targetId) {
  const el = document.getElementById(targetId);
  if (!el) return;

  el.textContent = "";
  el.className = "message-box";
}

function openAuthModal() {
  const modal = document.getElementById("auth-modal");
  if (!modal) return;
  modal.classList.remove("is-hidden");
}

function closeAuthModal() {
  const modal = document.getElementById("auth-modal");
  if (!modal) return;
  modal.classList.add("is-hidden");
  clearMessage("auth-message");
}

function requireLogin(message = "請先登入。") {
  if (state.user) return true;
  openAuthModal();
  showMessage("auth-message", message, "error");
  return false;
}

function closeSidebar() {
  document.getElementById("sidebar")?.classList.remove("open");
  document.getElementById("sidebarOverlay")?.classList.remove("show");
}

function bindSidebarToggle() {
  const btn = document.getElementById("menuToggleBtn");
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("sidebarOverlay");

  if (!btn || !sidebar || !overlay) return;

  if (!sidebarToggleBound) {
    btn.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();

      sidebar.classList.toggle("open");
      overlay.classList.toggle("show");
    });

    overlay.addEventListener("click", () => {
      closeSidebar();
    });

    sidebarToggleBound = true;
  }

  document.querySelectorAll(".sidebar .nav-btn").forEach((button) => {
    if (button.dataset.sidebarBound === "true") return;

    button.dataset.sidebarBound = "true";
    button.addEventListener("click", () => {
      closeSidebar();
    });
  });
}

function bindUserMenu() {
  const menu = document.querySelector(".user-menu");
  const trigger = document.querySelector(".user-menu__trigger");

  if (!menu || !trigger || userMenuBound) return;

  trigger.addEventListener("click", (event) => {
    event.stopPropagation();
    menu.classList.toggle("open");
  });

  document.addEventListener("click", (event) => {
    if (!menu.contains(event.target)) {
      menu.classList.remove("open");
    }
  });

  userMenuBound = true;
}

function bindTopbarActions() {
  if (topbarActionsBound) return;

  document.getElementById("loginEntryBtn")?.addEventListener("click", () => {
    openAuthModal();
  });

  async function handleLogout() {
    const { error } = await signOut();

    if (error) {
      console.error("signOut error:", error);
      window.alert(error.message || "登出失敗");
      return;
    }

    closeSidebar();
    closeAuthModal();

    state.currentView = VIEW_TYPES.DASHBOARD;
    state.records = [];

    renderAndBind();
    openAuthModal();
  }

  document.getElementById("logoutBtn")?.addEventListener("click", handleLogout);
  document
    .getElementById("logoutBtnDropdown")
    ?.addEventListener("click", handleLogout);

  topbarActionsBound = true;
}

function updateClock() {
  const clockEl = document.getElementById("statusClock");
  if (!clockEl) return;

  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const date = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");

  clockEl.textContent = `${year}/${month}/${date} ${hours}:${minutes}:${seconds}`;
}

function getTopbarAttendanceStatus() {
  if (!state.user) return ATTENDANCE_STATUS.NOT_STARTED;

  const guessedStatus =
    state.attendanceStatus ||
    state.todayAttendance?.status ||
    state.dashboard?.attendanceStatus ||
    ATTENDANCE_STATUS.WORKING;

  if (
    guessedStatus === ATTENDANCE_STATUS.NOT_STARTED ||
    guessedStatus === ATTENDANCE_STATUS.WORKING ||
    guessedStatus === ATTENDANCE_STATUS.COMPLETED
  ) {
    return guessedStatus;
  }

  return ATTENDANCE_STATUS.WORKING;
}

function renderAttendanceStatus() {
  const statusEl = document.getElementById("attendanceStatus");
  if (!statusEl) return;

  if (!state.user) {
    statusEl.textContent = "未登入";
    statusEl.className = "status-badge status-badge--not-started";
    return;
  }

  const status = getTopbarAttendanceStatus();
  statusEl.textContent = statusTextMap[status] || "上班中";
  statusEl.className = `status-badge ${statusClassMap[status] || "status-badge--working"}`;
}

function renderTopbarUser() {
  const userNameEl = document.getElementById("topbarUserName");
  const userAvatarEl = document.getElementById("topbarUserAvatar");
  const loginEntryBtn = document.getElementById("loginEntryBtn");
  const logoutBtn = document.getElementById("logoutBtn");

  if (!userNameEl || !userAvatarEl) return;

  if (!state.user) {
  userNameEl.textContent = "未登入";
  userAvatarEl.textContent = "?";

  if (loginEntryBtn) loginEntryBtn.style.display = "inline-flex";
  if (logoutBtn) logoutBtn.style.display = "none";
  return;
}

const displayName =
  state.user.name ||
  state.user.full_name ||
  state.user.email ||
  "User";

userNameEl.textContent = displayName;
userAvatarEl.textContent = String(displayName).slice(0, 1).toUpperCase();

if (loginEntryBtn) loginEntryBtn.style.display = "none";
if (logoutBtn) logoutBtn.style.display = "inline-flex";
}

function renderAdminNav() {
  const adminNav = document.getElementById("adminNavItem");
  if (!adminNav) return;

  const isAllowed =
    state.user?.role === "admin" ||
    state.user?.isAdmin === true;

  adminNav.style.display = isAllowed ? "inline-flex" : "none";

  if (!isAllowed && state.currentView === VIEW_TYPES.ADMIN) {
    state.currentView = VIEW_TYPES.DASHBOARD;
  }
}

function syncActiveNav() {
  document.querySelectorAll(".nav-btn").forEach((button) => {
    const isActive = button.dataset.view === state.currentView;
    button.classList.toggle("is-active", isActive);
  });
}

function refreshChrome() {
  updateClock();
  renderAttendanceStatus();
  renderTopbarUser();
  renderAdminNav();
  syncActiveNav();
}

function bindAuthModalEvents() {
  if (authModalBound) return;

  const loginForm = document.getElementById("auth-login-form");
  const closeBtn = document.getElementById("auth-modal-close-btn");

  closeBtn?.addEventListener("click", () => {
    closeAuthModal();
  });

  loginForm?.addEventListener("submit", async (event) => {
    event.preventDefault();

    const formData = new FormData(loginForm);
    const email = formData.get("email");
    const password = formData.get("password");

    const { error } = await signIn(email, password);

if (error) {
  showMessage("auth-message", error.message || "登入失敗。", "error");
  return;
}

await fetchAttendanceRecords();
closeAuthModal();
renderAndBind();
  });

  authModalBound = true;
}

async function readJsonFile(file) {
  const text = await file.text();
  return JSON.parse(text);
}

function bindImportInput(inputEl, messageTargetId = "") {
  if (!inputEl || inputEl.dataset.bound === "true") return;

  inputEl.dataset.bound = "true";

  inputEl.addEventListener("change", async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const data = await readJsonFile(file);
      const result = importRecordsFromJSON(data);
      renderAndBind();

      if (messageTargetId) {
        showMessage(messageTargetId, result.message, result.ok ? "success" : "error");
      } else {
        window.alert(result.message);
      }
    } catch (error) {
      console.error(error);
      if (messageTargetId) {
        showMessage(messageTargetId, "JSON 匯入失敗，請確認檔案格式。", "error");
      } else {
        window.alert("JSON 匯入失敗，請確認檔案格式。");
      }
    } finally {
      inputEl.value = "";
    }
  });
}

function bindSidebarEvents() {
  const navButtons = document.querySelectorAll(".nav-btn");
  if (!navButtons.length) return;

  navButtons.forEach((button) => {
    if (button.dataset.navBound === "true") return;

    button.dataset.navBound = "true";
    button.addEventListener("click", () => {
      const view = button.dataset.view;

      if (view === VIEW_TYPES.HISTORY) {
        state.currentView = VIEW_TYPES.HISTORY;
      } else if (view === VIEW_TYPES.REPORTS) {
        state.currentView = VIEW_TYPES.REPORTS;
      } else if (view === VIEW_TYPES.LEAVE) {
        state.currentView = VIEW_TYPES.LEAVE;
      } else if (view === VIEW_TYPES.NOTIFICATIONS) {
        state.currentView = VIEW_TYPES.NOTIFICATIONS;
      } else if (view === VIEW_TYPES.ANNOUNCEMENTS) {
        state.currentView = VIEW_TYPES.ANNOUNCEMENTS;
      } else if (view === VIEW_TYPES.ADMIN) {
        const isAllowed =
          state.user?.role === "admin" ||
          state.user?.isAdmin === true;

        if (!isAllowed) {
          window.alert("只有管理員可以進入此頁面");
          return;
        }

        state.currentView = VIEW_TYPES.ADMIN;
      } else if (view === VIEW_TYPES.SETTINGS) {
        state.currentView = VIEW_TYPES.SETTINGS;
      } else {
        state.currentView = VIEW_TYPES.DASHBOARD;
      }

      renderAndBind();
    });
  });

  sidebarNavBound = true;
}

function bindDashboardEvents() {
  const clockInBtn = document.getElementById("clock-in-btn");
  const clockOutBtn = document.getElementById("clock-out-btn");
  const manualForm = document.getElementById("manual-entry-form");
  const statusForm = document.getElementById("status-record-form");
  const exportBtn = document.getElementById("export-csv-btn");
  const exportJsonBtn = document.getElementById("export-json-btn");
  const importJsonInput = document.getElementById("import-json-input");

  if (clockInBtn && clockInBtn.dataset.bound !== "true") {
    clockInBtn.dataset.bound = "true";

    clockInBtn.addEventListener("click", async () => {
      if (!requireLogin("請先登入後再進行上班打卡。")) return;

      try {
        const position = await getCurrentPositionAsync();
        const fence = evaluateGeofence(position, state.settings);

        if (!fence.allowed) {
          showMessage(
            "action-message",
            `目前不在公司打卡範圍內，距離約 ${Math.round(fence.distanceMeters)} 公尺。`,
            "error"
          );
          return;
        }

        const result = clockIn(new Date());
        renderAndBind();
        showMessage("action-message", result.message, result.ok ? "success" : "error");
      } catch (error) {
        console.error(error);
        showMessage("action-message", "無法取得定位，請確認已開啟定位權限。", "error");
      }
    });
  }

  if (clockOutBtn && clockOutBtn.dataset.bound !== "true") {
    clockOutBtn.dataset.bound = "true";

    clockOutBtn.addEventListener("click", () => {
      if (!requireLogin("請先登入後再進行下班打卡。")) return;

      const result = clockOut(new Date());
      renderAndBind();
      showMessage("action-message", result.message, result.ok ? "success" : "error");
    });
  }

  if (manualForm && manualForm.dataset.bound !== "true") {
    manualForm.dataset.bound = "true";

    manualForm.addEventListener("submit", (event) => {
      event.preventDefault();
      if (!requireLogin("請先登入後再新增補登紀錄。")) return;

      clearMessage("manual-message");

      const formData = new FormData(manualForm);
      const result = createManualRecord({
        clockInValue: formData.get("manualClockIn"),
        clockOutValue: formData.get("manualClockOut"),
        note: formData.get("manualNote"),
        type: formData.get("manualRecordType") || "work",
      });

      renderAndBind();
      showMessage("manual-message", result.message, result.ok ? "success" : "error");
    });
  }

  if (statusForm && statusForm.dataset.bound !== "true") {
    statusForm.dataset.bound = "true";

    statusForm.addEventListener("submit", (event) => {
      event.preventDefault();
      if (!requireLogin("請先登入後再新增狀態紀錄。")) return;

      clearMessage("status-message");

      const formData = new FormData(statusForm);
      const result = createStatusRecord({
        dateValue: formData.get("statusRecordDate"),
        type: formData.get("statusRecordType"),
        note: formData.get("statusRecordNote"),
      });

      renderAndBind();
      showMessage("status-message", result.message, result.ok ? "success" : "error");
    });
  }

  if (exportBtn && exportBtn.dataset.bound !== "true") {
    exportBtn.dataset.bound = "true";

    exportBtn.addEventListener("click", () => {
      exportAttendanceCSV();
      showMessage("status-message", "CSV 已匯出。", "success");
    });
  }

  if (exportJsonBtn && exportJsonBtn.dataset.bound !== "true") {
    exportJsonBtn.dataset.bound = "true";

    exportJsonBtn.addEventListener("click", () => {
      exportAttendanceJSON();
      showMessage("manual-message", "JSON 備份已匯出。", "success");
    });
  }

  bindImportInput(importJsonInput, "manual-message");
}

function fillEditFormFromButton(button) {
  const idInput = document.getElementById("edit-record-id");
  const typeInput = document.getElementById("edit-record-type");
  const clockInInput = document.getElementById("edit-clock-in");
  const clockOutInput = document.getElementById("edit-clock-out");
  const noteInput = document.getElementById("edit-note");

  if (!idInput || !typeInput || !clockInInput || !clockOutInput || !noteInput) return;

  const recordId = button.dataset.id || "";
  const type = button.dataset.type || "work";
  const clockIn = button.dataset.clockIn || "";
  const clockOut = button.dataset.clockOut || "";
  const note = decodeURIComponent(button.dataset.note || "");

  idInput.value = recordId;
  typeInput.value = type;
  clockInInput.value = clockIn ? toLocalDatetimeValue(clockIn) : "";
  clockOutInput.value = clockOut ? toLocalDatetimeValue(clockOut) : "";
  noteInput.value = note;
}

function bindHistoryEvents() {
  const deleteButtons = document.querySelectorAll(".btn-delete-record");
  const openEditButtons = document.querySelectorAll(".btn-open-edit-record");
  const editForm = document.getElementById("record-edit-form");
  const clearAllBtn = document.getElementById("clear-all-btn");
  const exportBtn = document.getElementById("export-csv-btn");
  const exportJsonBtn = document.getElementById("export-json-btn");
  const importJsonInput = document.getElementById("import-json-input");
  const monthSelect = document.getElementById("filter-month");
  const keywordInput = document.getElementById("filter-keyword");

  deleteButtons.forEach((button) => {
    if (button.dataset.bound === "true") return;
    button.dataset.bound = "true";

    button.addEventListener("click", () => {
      const { id } = button.dataset;
      deleteRecord(id);
      renderAndBind();
    });
  });

  openEditButtons.forEach((button) => {
    if (button.dataset.bound === "true") return;
    button.dataset.bound = "true";

    button.addEventListener("click", () => {
      fillEditFormFromButton(button);
      clearMessage("edit-record-message");

      const formCard = document.getElementById("record-edit-form");
      formCard?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  });

  if (editForm && editForm.dataset.bound !== "true") {
    editForm.dataset.bound = "true";

    editForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const recordId = document.getElementById("edit-record-id")?.value || "";
  const type = document.getElementById("edit-record-type")?.value || "work";
  const clockInValue = document.getElementById("edit-clock-in")?.value || "";
  const clockOutValue = document.getElementById("edit-clock-out")?.value || "";
  const note = document.getElementById("edit-note")?.value || "";

  const result = await updateFullRecord({
    recordId,
    type,
    clockInValue,
    clockOutValue,
    note,
  });

  renderAndBind();
  showMessage("edit-record-message", result.message, result.ok ? "success" : "error");
});
  }

  if (clearAllBtn && clearAllBtn.dataset.bound !== "true") {
    clearAllBtn.dataset.bound = "true";

    clearAllBtn.addEventListener("click", () => {
      const confirmed = window.confirm("確定要清空所有打卡紀錄嗎？");
      if (!confirmed) return;

      clearAllRecords();
      state.filters.month = getMonthKey(new Date());
      state.filters.keyword = "";
      renderAndBind();
    });
  }

  if (exportBtn && exportBtn.dataset.bound !== "true") {
    exportBtn.dataset.bound = "true";
    exportBtn.addEventListener("click", () => {
      exportAttendanceCSV();
    });
  }

  if (exportJsonBtn && exportJsonBtn.dataset.bound !== "true") {
    exportJsonBtn.dataset.bound = "true";
    exportJsonBtn.addEventListener("click", () => {
      exportAttendanceJSON();
    });
  }

  bindImportInput(importJsonInput);

  if (monthSelect && monthSelect.dataset.bound !== "true") {
    monthSelect.dataset.bound = "true";
    monthSelect.addEventListener("change", () => {
      state.filters.month = monthSelect.value;
      renderAndBind();
    });
  }

  if (keywordInput && keywordInput.dataset.bound !== "true") {
    keywordInput.dataset.bound = "true";
    keywordInput.addEventListener("input", () => {
      state.filters.keyword = keywordInput.value;
      renderAndBind();
    });
  }
}

function bindSettingsEvents() {
  const settingsForm = document.getElementById("settings-form");
  const resetBtn = document.getElementById("reset-settings-btn");
  const setOfficeLocationBtn = document.getElementById("set-office-current-location-btn");

  if (settingsForm && settingsForm.dataset.bound !== "true") {
    settingsForm.dataset.bound = "true";

    settingsForm.addEventListener("submit", async (event) => {
      event.preventDefault();

      if (!state.user) {
        openAuthModal();
        showMessage("auth-message", "請先登入後再儲存設定。", "error");
        return;
      }

      const formData = new FormData(settingsForm);

      const result = await saveSettings({
        expectedClockIn: formData.get("expectedClockIn"),
        expectedClockOut: formData.get("expectedClockOut"),
        lateGraceMinutes: formData.get("lateGraceMinutes"),
        earlyLeaveGraceMinutes: formData.get("earlyLeaveGraceMinutes"),
        overtimeThresholdMinutes: formData.get("overtimeThresholdMinutes"),
        officeName: formData.get("officeName"),
        officeLatitude: formData.get("officeLatitude"),
        officeLongitude: formData.get("officeLongitude"),
        clockInRadiusMeters: formData.get("clockInRadiusMeters"),
      });

      renderAndBind();
      showMessage("settings-message", result.message, result.ok ? "success" : "error");
    });
  }

  if (resetBtn && resetBtn.dataset.bound !== "true") {
    resetBtn.dataset.bound = "true";

    resetBtn.addEventListener("click", async () => {
      if (!state.user) {
        openAuthModal();
        showMessage("auth-message", "請先登入後再重設設定。", "error");
        return;
      }

      const result = await resetSettings();
      renderAndBind();
      showMessage("settings-message", result.message, result.ok ? "success" : "error");
    });
  }

  if (setOfficeLocationBtn && setOfficeLocationBtn.dataset.bound !== "true") {
    setOfficeLocationBtn.dataset.bound = "true";

    setOfficeLocationBtn.addEventListener("click", async () => {
      try {
        const position = await getCurrentPositionAsync();

        const latInput = document.getElementById("office-latitude");
        const lngInput = document.getElementById("office-longitude");

        if (latInput) latInput.value = position.latitude;
        if (lngInput) lngInput.value = position.longitude;

        showMessage("geofence-message", "已取得目前位置，請記得按儲存設定。", "success");
      } catch (error) {
        console.error(error);
        showMessage("geofence-message", "無法取得目前位置，請確認已允許定位權限。", "error");
      }
    });
  }
}

function bindReportsEvents() {
  const reportMonthSelect = document.getElementById("report-month-select");

  if (reportMonthSelect && reportMonthSelect.dataset.bound !== "true") {
    reportMonthSelect.dataset.bound = "true";

    reportMonthSelect.addEventListener("change", () => {
      state.filters.month = reportMonthSelect.value;
      renderAndBind();
    });
  }
}

function bindViewEvents() {
  if (state.currentView === VIEW_TYPES.HISTORY) {
    bindHistoryEvents();
    return;
  }

  if (state.currentView === VIEW_TYPES.SETTINGS) {
    bindSettingsEvents();
    return;
  }

  if (state.currentView === VIEW_TYPES.REPORTS) {
    bindReportsEvents();
    return;
  }

  bindDashboardEvents();
}

function renderAndBind() {
  renderApp();
  refreshChrome();
  bindViewEvents();
}

async function bootstrap() {
  await initializeAuth();
  await loadSettings();
  initializeAttendance();

  if (state.user) {
    await fetchAttendanceRecords();
  }

  if (!state.filters.month) {
    state.filters.month = getMonthKey(new Date());
  }

  renderAndBind();
  bindSidebarEvents();
  bindSidebarToggle();
  bindAuthModalEvents();
  bindUserMenu();
  bindTopbarActions();

  if (!clockInitialized) {
    updateClock();
    startClock(() => {
      updateClock();

      if (state.currentView === VIEW_TYPES.DASHBOARD) {
        renderAndBind();
      } else {
        refreshChrome();
      }
    });

    clockInitialized = true;
  }

  if (!state.user) {
    openAuthModal();
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", bootstrap);
} else {
  bootstrap();
}
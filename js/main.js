import { VIEW_TYPES } from "./core/constants.js";
import { login, logout, isAdmin, requireLogin } from "./auth.js";
import {
  checkIn,
  checkOut,
  getTodayRecordByUser,
} from "./modules/attendance/attendance.js";
import {
  getCurrentUser,
  initStorage,
  getUsers,
  saveUsers,
} from "./storage.js";

let currentView = VIEW_TYPES.DASHBOARD;
let sidebarToggleBound = false;

function $(selector) {
  return document.querySelector(selector);
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

function openLoginPanel() {
  document.getElementById("auth-modal")?.classList.remove("is-hidden");
}

function closeLoginPanel() {
  document.getElementById("auth-modal")?.classList.add("is-hidden");
  const messageEl = document.getElementById("auth-message");
  if (messageEl) {
    messageEl.textContent = "";
    messageEl.className = "message-box";
  }
}

function renderTopbarUser() {
  const user = getCurrentUser();
  const userNameEl = document.getElementById("topbarUserName");
  const userAvatarEl = document.getElementById("topbarUserAvatar");

  if (!userNameEl || !userAvatarEl) return;

  if (!user) {
    userNameEl.textContent = "未登入";
    userAvatarEl.textContent = "?";
    return;
  }

  userNameEl.textContent = user.name;
  userAvatarEl.textContent = user.name.slice(0, 1).toUpperCase();
}

function renderTopbarStatus() {
  const user = getCurrentUser();
  const statusEl = document.getElementById("attendanceStatus");

  if (!statusEl) return;

  if (!user) {
    statusEl.textContent = "未登入";
    statusEl.className = "status-badge status-badge--not-started";
    return;
  }

  const todayRecord = getTodayRecordByUser(user.id);

  if (!todayRecord) {
    statusEl.textContent = "未上班";
    statusEl.className = "status-badge status-badge--not-started";
    return;
  }

  if (todayRecord.checkInTime && !todayRecord.checkOutTime) {
    statusEl.textContent = "上班中";
    statusEl.className = "status-badge status-badge--working";
    return;
  }

  if (todayRecord.checkInTime && todayRecord.checkOutTime) {
    statusEl.textContent = "已下班";
    statusEl.className = "status-badge status-badge--completed";
  }
}

function renderAdminNav() {
  const adminNav = document.getElementById("adminNavItem");
  if (!adminNav) return;

  adminNav.style.display = isAdmin() ? "inline-flex" : "none";
}

function renderDashboardActionState() {
  const user = getCurrentUser();
  const checkInBtn = document.getElementById("checkInBtn");
  const checkOutBtn = document.getElementById("checkOutBtn");

  if (!checkInBtn || !checkOutBtn) return;

  if (!user) {
    checkInBtn.disabled = true;
    checkOutBtn.disabled = true;
    return;
  }

  const todayRecord = getTodayRecordByUser(user.id);

  if (!todayRecord) {
    checkInBtn.disabled = false;
    checkOutBtn.disabled = true;
    return;
  }

  if (todayRecord.checkInTime && !todayRecord.checkOutTime) {
    checkInBtn.disabled = true;
    checkOutBtn.disabled = false;
    return;
  }

  checkInBtn.disabled = true;
  checkOutBtn.disabled = true;
}

function renderAuthUI() {
  const user = getCurrentUser();
  const loginEntryBtn = document.getElementById("loginEntryBtn");
  const logoutBtn = document.getElementById("logoutBtn");

  if (loginEntryBtn) {
    loginEntryBtn.style.display = user ? "none" : "inline-flex";
  }

  if (logoutBtn) {
    logoutBtn.style.display = user ? "inline-flex" : "none";
  }

  renderTopbarUser();
  renderTopbarStatus();
  renderAdminNav();
  renderDashboardActionState();
}

function bindLoginForm() {
  const form = document.getElementById("auth-login-form");
  if (!form) return;

  if (form.dataset.bound === "true") return;
  form.dataset.bound = "true";

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const username = document.getElementById("auth-email")?.value?.trim() || "";
    const password =
      document.getElementById("auth-password")?.value?.trim() || "";
    const messageEl = document.getElementById("auth-message");

    const result = login(username, password);

    if (!result.ok) {
      if (messageEl) {
        messageEl.textContent = result.message;
        messageEl.className = "message-box is-visible message-box--error";
      }
      return;
    }

    form.reset();
    closeLoginPanel();
    renderAuthUI();
    renderCurrentView();
  });

  document
    .getElementById("auth-modal-close-btn")
    ?.addEventListener("click", closeLoginPanel);
}

function bindTopbarActions() {
  $("#loginEntryBtn")?.addEventListener("click", openLoginPanel);

  $("#logoutBtn")?.addEventListener("click", () => {
    logout();
    renderAuthUI();
    renderCurrentView();
    openLoginPanel();
  });

  $("#logoutBtnDropdown")?.addEventListener("click", () => {
    logout();
    renderAuthUI();
    renderCurrentView();
    openLoginPanel();
  });
}

function bindAttendanceActions() {
  $("#checkInBtn")?.addEventListener("click", () => {
    const loginState = requireLogin();
    if (!loginState.ok) {
      alert(loginState.message);
      openLoginPanel();
      return;
    }

    const result = checkIn();
    alert(result.message);
    renderAuthUI();
    renderCurrentView();
  });

  $("#checkOutBtn")?.addEventListener("click", () => {
    const loginState = requireLogin();
    if (!loginState.ok) {
      alert(loginState.message);
      openLoginPanel();
      return;
    }

    const result = checkOut();
    alert(result.message);
    renderAuthUI();
    renderCurrentView();
  });
}

function closeSidebar() {
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("sidebarOverlay");
  sidebar?.classList.remove("open");
  overlay?.classList.remove("show");
}

function bindSidebarToggle() {
  const btn = document.getElementById("menuToggleBtn");
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("sidebarOverlay");

  console.log("bindSidebarToggle init", { btn, sidebar, overlay });

  if (!btn || !sidebar || !overlay) {
    return false;
  }

  if (!sidebarToggleBound) {
    btn.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();

      sidebar.classList.toggle("open");
      overlay.classList.toggle("show");

      console.log("menu toggle:", sidebar.className, overlay.className);
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

  return true;
}

function renderDashboardView() {
  const appView = document.getElementById("app-view");
  if (!appView) return;

  const user = getCurrentUser();
  const todayRecord = user ? getTodayRecordByUser(user.id) : null;

  appView.innerHTML = `
    <section class="dashboard-grid">
      <article class="card">
        <h3>今日打卡資訊</h3>
        ${
          user
            ? `
              <p>登入者：${user.name}</p>
              <p>部門：${user.department || "未設定"}</p>
              <p>上班時間：${todayRecord?.checkInTime || "--:--:--"}</p>
              <p>下班時間：${todayRecord?.checkOutTime || "--:--:--"}</p>
            `
            : `
              <p>目前尚未登入，請先登入才能打卡。</p>
            `
        }
      </article>

      <article class="card">
        <h3>快速打卡</h3>
        <div class="card-actions">
          <button id="checkInBtn" class="btn btn--primary" type="button">上班打卡</button>
          <button id="checkOutBtn" class="btn" type="button">下班打卡</button>
        </div>
      </article>
    </section>
  `;

  bindAttendanceActions();
  renderDashboardActionState();
}

function renderAdminView() {
  const appView = document.getElementById("app-view");
  if (!appView) return;

  if (!isAdmin()) {
    appView.innerHTML = `
      <section class="card">
        <h3>無法存取</h3>
        <p>只有管理員可以查看這個頁面。</p>
      </section>
    `;
    return;
  }

  const users = getUsers();

  appView.innerHTML = `
    <section class="admin-page">
      <div class="admin-header">
        <div>
          <h2>白名單管理</h2>
          <p class="admin-header__desc">管理可登入與可打卡的帳號名單</p>
        </div>
        <button id="addUserBtn" class="btn btn--primary" type="button">＋ 新增員工</button>
      </div>

      <div class="admin-table">
        <div class="admin-row admin-row--head">
          <div>姓名</div>
          <div>帳號</div>
          <div>角色</div>
          <div>啟用</div>
          <div>打卡權限</div>
          <div>操作</div>
        </div>

        ${users
          .map(
            (user) => `
            <div class="admin-row">
              <div>${user.name}</div>
              <div>${user.username}</div>
              <div>${user.role}</div>

              <div>
                <label class="switch">
                  <input
                    type="checkbox"
                    data-id="${user.id}"
                    class="toggle-active"
                    ${user.isActive ? "checked" : ""}
                  />
                  <span class="switch__slider"></span>
                </label>
              </div>

              <div>
                <label class="switch">
                  <input
                    type="checkbox"
                    data-id="${user.id}"
                    class="toggle-checkin"
                    ${user.canCheckIn ? "checked" : ""}
                  />
                  <span class="switch__slider"></span>
                </label>
              </div>

              <div>
                <button data-id="${user.id}" class="btn-delete" type="button">刪除</button>
              </div>
            </div>
          `
          )
          .join("")}
      </div>
    </section>
  `;

  bindAdminActions();
}

function bindAdminActions() {
  document.querySelectorAll(".toggle-active").forEach((input) => {
    if (input.dataset.bound === "true") return;
    input.dataset.bound = "true";

    input.addEventListener("change", () => {
      const users = getUsers();
      const id = input.dataset.id;
      const user = users.find((u) => u.id === id);
      if (!user) return;

      user.isActive = input.checked;
      saveUsers(users);
    });
  });

  document.querySelectorAll(".toggle-checkin").forEach((input) => {
    if (input.dataset.bound === "true") return;
    input.dataset.bound = "true";

    input.addEventListener("change", () => {
      const users = getUsers();
      const id = input.dataset.id;
      const user = users.find((u) => u.id === id);
      if (!user) return;

      user.canCheckIn = input.checked;
      saveUsers(users);
    });
  });

  document.querySelectorAll(".btn-delete").forEach((btn) => {
    if (btn.dataset.bound === "true") return;
    btn.dataset.bound = "true";

    btn.addEventListener("click", () => {
      const users = getUsers();
      const id = btn.dataset.id;
      const updated = users.filter((u) => u.id !== id);

      saveUsers(updated);
      renderAdminView();
    });
  });

  const addUserBtn = document.getElementById("addUserBtn");
  if (addUserBtn && addUserBtn.dataset.bound !== "true") {
    addUserBtn.dataset.bound = "true";

    addUserBtn.addEventListener("click", () => {
      const users = getUsers();

      const name = prompt("姓名");
      const username = prompt("帳號");
      const password = prompt("密碼");

      if (!name || !username || !password) return;

      users.push({
        id: `u_${Date.now()}`,
        name,
        username,
        password,
        role: "employee",
        department: "未設定",
        isActive: true,
        canCheckIn: true,
      });

      saveUsers(users);
      renderAdminView();
    });
  }
}

function renderPlaceholderView(title) {
  const appView = document.getElementById("app-view");
  if (!appView) return;

  appView.innerHTML = `
    <section class="card">
      <h3>${title}</h3>
      <p>此頁待接。</p>
    </section>
  `;
}

function renderCurrentView() {
  switch (currentView) {
    case VIEW_TYPES.ADMIN:
      renderAdminView();
      break;
    case VIEW_TYPES.HISTORY:
      renderPlaceholderView("歷史紀錄");
      break;
    case VIEW_TYPES.REPORTS:
      renderPlaceholderView("月報表");
      break;
    case VIEW_TYPES.LEAVE:
      renderPlaceholderView("請假");
      break;
    case VIEW_TYPES.NOTIFICATIONS:
      renderPlaceholderView("通知");
      break;
    case VIEW_TYPES.ANNOUNCEMENTS:
      renderPlaceholderView("公告");
      break;
    case VIEW_TYPES.SETTINGS:
      renderPlaceholderView("設定");
      break;
    case VIEW_TYPES.DASHBOARD:
    default:
      renderDashboardView();
      break;
  }
}

function bindSidebarNav() {
  document.querySelectorAll("[data-view]").forEach((button) => {
    if (button.dataset.bound === "true") return;
    button.dataset.bound = "true";

    button.addEventListener("click", () => {
      const nextView = button.dataset.view;

      if (nextView === VIEW_TYPES.ADMIN && !isAdmin()) {
        alert("只有管理員可以進入此頁面");
        return;
      }

      document.querySelectorAll(".nav-btn").forEach((btn) => {
        btn.classList.remove("is-active");
      });
      button.classList.add("is-active");

      currentView = nextView;
      renderCurrentView();
    });
  });
}

function initApp() {
  console.log("MAIN JS INIT");

  initStorage();
  updateClock();
  setInterval(updateClock, 1000);

  bindLoginForm();
  bindTopbarActions();
  bindSidebarNav();

  renderAuthUI();
  renderCurrentView();

  const bound = bindSidebarToggle();
  if (!bound) {
    requestAnimationFrame(() => {
      bindSidebarToggle();
    });
  }

  if (!getCurrentUser()) {
    openLoginPanel();
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initApp);
} else {
  initApp();
}
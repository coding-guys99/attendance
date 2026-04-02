import { VIEW_TYPES } from "./constants.js";
import { login, logout, isAdmin, requireLogin } from "./auth.js";
import { checkIn, checkOut, getTodayRecordByUser } from "./attendance.js";
import { getCurrentUser, initStorage } from "./storage.js";

let currentView = VIEW_TYPES.DASHBOARD;

function $(selector) {
  return document.querySelector(selector);
}

function bindSidebarToggle() {
  const btn = document.getElementById("menuToggleBtn");
  const sidebar = document.querySelector(".sidebar");
  const overlay = document.getElementById("sidebarOverlay");

  if (!btn || !sidebar || !overlay) return;

  btn.addEventListener("click", () => {
    sidebar.classList.add("open");
    overlay.classList.add("show");
  });

  overlay.addEventListener("click", () => {
    sidebar.classList.remove("open");
    overlay.classList.remove("show");
  });
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
  $("#loginPanel")?.classList.add("is-open");
}

function closeLoginPanel() {
  $("#loginPanel")?.classList.remove("is-open");
  $("#loginMessage").textContent = "";
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

  adminNav.style.display = isAdmin() ? "block" : "none";
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
  const form = document.getElementById("loginForm");
  if (!form) return;

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const username = document.getElementById("loginUsername").value;
    const password = document.getElementById("loginPassword").value;
    const messageEl = document.getElementById("loginMessage");

    const result = login(username, password);

    if (!result.ok) {
      messageEl.textContent = result.message;
      return;
    }

    form.reset();
    closeLoginPanel();
    renderAuthUI();
    renderCurrentView();
  });
}

function bindTopbarActions() {
  $("#loginEntryBtn")?.addEventListener("click", openLoginPanel);

  $("#logoutBtn")?.addEventListener("click", () => {
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

function renderDashboardView() {
  const appView = document.getElementById("app-view");
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
              <p>部門：${user.department}</p>
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
          <button id="checkInBtn" class="btn btn--primary">上班打卡</button>
          <button id="checkOutBtn" class="btn">下班打卡</button>
        </div>
      </article>
    </section>
  `;

  bindAttendanceActions();
  renderDashboardActionState();
}

function renderAdminView() {
  const appView = document.getElementById("app-view");

  if (!isAdmin()) {
    appView.innerHTML = `
      <section class="card">
        <h3>無法存取</h3>
        <p>只有管理員可以查看這個頁面。</p>
      </section>
    `;
    return;
  }

  appView.innerHTML = `
    <section class="card">
      <h3>白名單管理</h3>
      <p>下一步可以在這裡做新增帳號、停用、開關打卡權限。</p>
    </section>
  `;
}

function bindAdminActions() {
  const users = getUsers();

  // 啟用/停用
  document.querySelectorAll(".toggle-active").forEach(input => {
    input.addEventListener("change", () => {
      const id = input.dataset.id;
      const user = users.find(u => u.id === id);
      user.isActive = input.checked;
      saveUsers(users);
    });
  });

  // 打卡權限
  document.querySelectorAll(".toggle-checkin").forEach(input => {
    input.addEventListener("change", () => {
      const id = input.dataset.id;
      const user = users.find(u => u.id === id);
      user.canCheckIn = input.checked;
      saveUsers(users);
    });
  });

  // 刪除
  document.querySelectorAll(".btn-delete").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.id;

      const updated = users.filter(u => u.id !== id);
      saveUsers(updated);

      renderAdminView();
    });
  });

  // 新增
  document.getElementById("addUserBtn")?.addEventListener("click", () => {
    const name = prompt("姓名");
    const username = prompt("帳號");
    const password = prompt("密碼");

    if (!name || !username || !password) return;

    users.push({
      id: "u_" + Date.now(),
      name,
      username,
      password,
      role: "employee",
      isActive: true,
      canCheckIn: true
    });

    saveUsers(users);
    renderAdminView();
  });
}

function renderCurrentView() {
  switch (currentView) {
    case VIEW_TYPES.ADMIN:
      renderAdminView();
      break;
    case VIEW_TYPES.DASHBOARD:
    default:
      renderDashboardView();
      break;
  }
}

function bindSidebarNav() {
  document.querySelectorAll("[data-view]").forEach((button) => {
    button.addEventListener("click", () => {
      const nextView = button.dataset.view;

      if (nextView === VIEW_TYPES.ADMIN && !isAdmin()) {
        alert("只有管理員可以進入此頁面");
        return;
      }

      currentView = nextView;
      renderCurrentView();
    });
  });
}

function init() {
  initStorage();
  updateClock();
  setInterval(updateClock, 1000);

  bindLoginForm();
  bindTopbarActions();
  bindSidebarNav();

  renderAuthUI();
  renderCurrentView();
  
  bindSidebarToggle();

  if (!getCurrentUser()) {
    openLoginPanel();
  }
}

init();
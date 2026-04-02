import { getUsers, saveUsers } from "../../core/storage.js";
import { USER_ROLES } from "../../core/constants.js";

function escapeHTML(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function getAdminCount(users) {
  return users.filter((user) => user.role === USER_ROLES.ADMIN).length;
}

function rerenderAdminPage() {
  const container = document.getElementById("app-view");
  if (!container) return;

  container.innerHTML = renderAdminView();
  bindAdminActions();
}

export function renderAdminView() {
  const users = getUsers();

  return `
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

        ${
          users.length
            ? users
                .map(
                  (user) => `
          <div class="admin-row">
            <div>${escapeHTML(user.name)}</div>
            <div>${escapeHTML(user.username)}</div>
            <div>
              <span class="role-badge role-badge--${escapeHTML(user.role)}">
                ${user.role === USER_ROLES.ADMIN ? "管理員" : "員工"}
              </span>
            </div>

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

            <div class="admin-row__actions">
              <button
                type="button"
                data-id="${user.id}"
                class="btn-delete"
              >
                刪除
              </button>
            </div>
          </div>
        `
                )
                .join("")
            : `
          <div class="admin-empty">
            目前沒有任何帳號
          </div>
        `
        }
      </div>
    </section>
  `;
}

export function bindAdminActions() {
  document.querySelectorAll(".toggle-active").forEach((input) => {
    input.addEventListener("change", () => {
      const users = getUsers();
      const id = input.dataset.id;
      const user = users.find((item) => item.id === id);

      if (!user) return;

      user.isActive = input.checked;
      saveUsers(users);
    });
  });

  document.querySelectorAll(".toggle-checkin").forEach((input) => {
    input.addEventListener("change", () => {
      const users = getUsers();
      const id = input.dataset.id;
      const user = users.find((item) => item.id === id);

      if (!user) return;

      user.canCheckIn = input.checked;
      saveUsers(users);
    });
  });

  document.querySelectorAll(".btn-delete").forEach((btn) => {
    btn.addEventListener("click", () => {
      const users = getUsers();
      const id = btn.dataset.id;
      const targetUser = users.find((item) => item.id === id);

      if (!targetUser) return;

      const isLastAdmin =
        targetUser.role === USER_ROLES.ADMIN && getAdminCount(users) === 1;

      if (isLastAdmin) {
        alert("至少要保留一位管理員帳號");
        return;
      }

      const confirmed = window.confirm(`確定要刪除 ${targetUser.name} 嗎？`);
      if (!confirmed) return;

      const updatedUsers = users.filter((item) => item.id !== id);
      saveUsers(updatedUsers);
      rerenderAdminPage();
    });
  });

  document.getElementById("addUserBtn")?.addEventListener("click", () => {
    const users = getUsers();

    const name = window.prompt("姓名");
    if (!name) return;

    const username = window.prompt("帳號");
    if (!username) return;

    const normalizedUsername = username.trim().toLowerCase();
    const isDuplicate = users.some(
      (user) => user.username.trim().toLowerCase() === normalizedUsername
    );

    if (isDuplicate) {
      alert("這個帳號已存在，請換一個帳號");
      return;
    }

    const password = window.prompt("密碼");
    if (!password) return;

    users.push({
      id: `u_${Date.now()}`,
      name: name.trim(),
      username: username.trim(),
      password: password.trim(),
      role: USER_ROLES.EMPLOYEE,
      department: "未設定",
      isActive: true,
      canCheckIn: true,
    });

    saveUsers(users);
    rerenderAdminPage();
  });
}
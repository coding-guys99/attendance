import { getUsers, saveUsers } from "../../core/storage.js";

export function renderAdminView() {
  const users = getUsers();

  return `
    <section class="admin-page">
      <div class="admin-header">
        <h2>白名單管理</h2>
        <button id="addUserBtn" class="btn btn--primary">＋ 新增員工</button>
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

        ${users.map(user => `
          <div class="admin-row">
            <div>${user.name}</div>
            <div>${user.username}</div>
            <div>${user.role}</div>

            <div>
              <input type="checkbox" data-id="${user.id}" class="toggle-active"
                ${user.isActive ? "checked" : ""}/>
            </div>

            <div>
              <input type="checkbox" data-id="${user.id}" class="toggle-checkin"
                ${user.canCheckIn ? "checked" : ""}/>
            </div>

            <div>
              <button data-id="${user.id}" class="btn-delete">刪除</button>
            </div>
          </div>
        `).join("")}
      </div>
    </section>
  `;
}

export function bindAdminActions() {
  const users = getUsers();

  document.querySelectorAll(".toggle-active").forEach(input => {
    input.addEventListener("change", () => {
      const id = input.dataset.id;
      const user = users.find(u => u.id === id);
      user.isActive = input.checked;
      saveUsers(users);
    });
  });

  document.querySelectorAll(".toggle-checkin").forEach(input => {
    input.addEventListener("change", () => {
      const id = input.dataset.id;
      const user = users.find(u => u.id === id);
      user.canCheckIn = input.checked;
      saveUsers(users);
    });
  });

  document.querySelectorAll(".btn-delete").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.id;
      const updated = users.filter(u => u.id !== id);
      saveUsers(updated);
      location.reload(); // 簡單先用這個
    });
  });

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
    location.reload();
  });
}
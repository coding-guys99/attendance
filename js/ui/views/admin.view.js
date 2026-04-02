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
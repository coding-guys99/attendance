import { state } from "../../core/state.js";

export function renderAdminView() {
  return `
    <div class="section-block">
      <div class="section__header">
        <div>
          <p class="section__eyebrow">Admin Panel</p>
          <h3 class="section__title">管理後台</h3>
        </div>
        <div class="inline-badge">ADMIN</div>
      </div>

      <div class="admin-grid">

        <div class="card">
          <div class="card__body">
            <h4>請假管理</h4>
            <p>查看與審核所有員工請假</p>
            <button class="btn btn--primary" data-admin-tab="leave">
              進入
            </button>
          </div>
        </div>

        <div class="card">
          <div class="card__body">
            <h4>公告管理</h4>
            <p>發布公司公告</p>
            <button class="btn btn--primary" data-admin-tab="announcement">
              進入
            </button>
          </div>
        </div>

      </div>

      <div id="admin-content" style="margin-top:20px;"></div>
    </div>
  `;
}

export function renderAdminLeaveList(leaves = []) {
  return `
    <div class="card">
      <div class="card__body">
        <h4>請假審核</h4>

        <table class="table">
          <thead>
            <tr>
              <th>日期</th>
              <th>類型</th>
              <th>天數</th>
              <th>狀態</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            ${leaves.map(l => `
              <tr>
                <td>${l.start_date} ~ ${l.end_date}</td>
                <td>${l.leave_type}</td>
                <td>${l.days}</td>
                <td>${l.status}</td>
                <td>
                  ${l.status === "pending" ? `
                    <button class="btn-approve" data-id="${l.id}">批准</button>
                    <button class="btn-reject" data-id="${l.id}">駁回</button>
                  ` : "-"}
                </td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    </div>
  `;
}
import { formatDateTime } from "../../utils/format.js";

export function renderNotificationsView(notifications = []) {
  if (!notifications.length) {
    return `
      <div class="empty-state">
        目前沒有通知。
      </div>
    `;
  }

  return `
    <div class="section-block">
      <div class="section__header">
        <div>
          <p class="section__eyebrow">Notifications</p>
          <h3 class="section__title">通知</h3>
        </div>
      </div>

      <div class="notification-list">
        ${notifications
          .map(
            (item) => `
              <article class="card" style="margin-bottom:16px;">
                <div class="card__body">
                  <div class="action-row" style="justify-content:space-between; align-items:center;">
                    <h4 style="margin:0;">${item.title}</h4>
                    ${
                      item.is_read
                        ? `<span class="inline-badge">已讀</span>`
                        : `<span class="inline-badge" style="background: rgba(239,68,68,0.12); color:#b91c1c;">未讀</span>`
                    }
                  </div>
                  <p class="note" style="margin-top:8px;">
                    ${formatDateTime(item.created_at)}
                  </p>
                  <div style="margin-top:12px; line-height:1.8;">
                    ${item.message || ""}
                  </div>
                  <div class="action-row" style="margin-top:12px;">
                    ${
                      !item.is_read
                        ? `<button class="btn btn--ghost btn-mark-notification-read" data-id="${item.id}">標記已讀</button>`
                        : ""
                    }
                  </div>
                </div>
              </article>
            `
          )
          .join("")}
      </div>
    </div>
  `;
}
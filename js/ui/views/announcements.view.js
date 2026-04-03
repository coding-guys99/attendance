import { formatDateTime } from "../../utils/format.js";

export function renderAnnouncementsView(announcements = []) {
  if (!announcements.length) {
    return `
      <div class="empty-state">
        目前沒有公告。
      </div>
    `;
  }

  return `
    <div class="section-block">
      <div class="section__header">
        <div>
          <p class="section__eyebrow">Announcements</p>
          <h3 class="section__title">公告</h3>
        </div>
      </div>

      <div class="announcement-list">
        ${announcements
          .map(
            (item) => `
              <article class="card" style="margin-bottom:16px;">
                <div class="card__body">
                  <div class="action-row" style="justify-content:space-between; align-items:center;">
                    <h4 style="margin:0;">${item.title}</h4>
                    <span class="inline-badge">${item.category || "general"}</span>
                  </div>
                  <p class="note" style="margin-top:8px;">
                    ${formatDateTime(item.published_at || item.created_at)}
                  </p>
                  <div style="margin-top:12px; line-height:1.8; white-space:pre-wrap;">
                    ${item.content || ""}
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
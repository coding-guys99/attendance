import { formatDateTime } from "../../utils/format.js";
import { state } from "../../core/state.js";

function renderAnnouncementForm() {
  const isAdmin = state.profile?.role === "admin";

  if (!isAdmin) return "";

  return `
    <div class="card" style="margin-bottom: 18px;">
      <div class="card__body">
        <div class="section__header">
          <div>
            <p class="section__eyebrow">Announcement Editor</p>
            <h3 class="section__title">新增公告</h3>
          </div>
          <div class="inline-badge">Admin Only</div>
        </div>

        <form id="announcement-form" class="form-grid">
          <div class="field">
            <label for="announcement-title">標題</label>
            <input
              id="announcement-title"
              name="announcementTitle"
              class="input"
              type="text"
              placeholder="例如：清明連假通知"
              required
            />
          </div>

          <div class="field">
            <label for="announcement-category">分類</label>
            <select id="announcement-category" name="announcementCategory" class="input">
              <option value="general">一般</option>
              <option value="holiday">假期</option>
              <option value="system">系統</option>
              <option value="hr">人事</option>
            </select>
          </div>

          <div class="field">
            <label for="announcement-content">內容</label>
            <textarea
              id="announcement-content"
              name="announcementContent"
              class="textarea"
              placeholder="請輸入公告內容"
              required
            ></textarea>
          </div>

          <div class="action-row">
            <button type="submit" class="btn btn--primary">發布公告</button>
          </div>

          <div id="announcement-message" class="message-box"></div>
        </form>
      </div>
    </div>
  `;
}

export function renderAnnouncementsView(announcements = []) {
  return `
    <div class="section-block">
      <div class="section__header">
        <div>
          <p class="section__eyebrow">Announcements</p>
          <h3 class="section__title">公告</h3>
        </div>
      </div>

      ${renderAnnouncementForm()}

      ${
        announcements.length
          ? `
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
          `
          : `
            <div class="empty-state">
              目前沒有公告。
            </div>
          `
      }
    </div>
  `;
}
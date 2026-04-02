import {
  getTodayRecord,
} from "../../modules/attendance/attendance.service.js";
import {
  getHistorySummary,
  getRecent7DaysTrend,
} from "../../modules/history/history.service.js";
import { state } from "../../core/state.js";
import { ATTENDANCE_STATUS, RECORD_TYPES, RECORD_TYPE_LABELS } from "../../core/constants.js";
import {
  formatDate,
  formatTime,
  formatDateTime,
  formatDuration,
} from "../../utils/format.js";
import { getSecondsBetween } from "../../utils/time.js";
import { toLocalDatetimeValue, getDateKey } from "../../utils/date.js";
import { getAttendanceAnalysis } from "../../utils/attendance-status.js";

function getTodayWorkDuration(todayRecord, now) {
  if (!todayRecord) return "00:00:00";

  if (todayRecord.type !== RECORD_TYPES.WORK) return "--:--:--";

  if (todayRecord.status === ATTENDANCE_STATUS.WORKING) {
    const seconds = getSecondsBetween(todayRecord.clockIn, now.toISOString());
    return formatDuration(seconds);
  }

  return formatDuration(todayRecord.workSeconds || 0);
}

function getStatusPill(todayRecord) {
  if (!todayRecord) {
    return `<span class="status-pill status-pill--waiting">尚未建立今日紀錄</span>`;
  }

  if (todayRecord.type !== RECORD_TYPES.WORK) {
    return `<span class="status-pill status-pill--done">${RECORD_TYPE_LABELS[todayRecord.type]}</span>`;
  }

  if (todayRecord.status === ATTENDANCE_STATUS.WORKING) {
    return `<span class="status-pill status-pill--working">工作中</span>`;
  }

  return `<span class="status-pill status-pill--done">今日已完成</span>`;
}

function renderTrendChart(data) {
  const width = 640;
  const height = 220;
  const padding = 24;
  const maxValue = Math.max(...data.map((item) => item.seconds), 3600);

  const points = data.map((item, index) => {
    const x = padding + (index * (width - padding * 2)) / Math.max(data.length - 1, 1);
    const y =
      height - padding - ((item.seconds || 0) / maxValue) * (height - padding * 2);
    return { ...item, x, y };
  });

  const polyline = points.map((p) => `${p.x},${p.y}`).join(" ");

  const labels = points
    .map(
      (p) => `
      <g>
        <circle cx="${p.x}" cy="${p.y}" r="5"></circle>
        <text x="${p.x}" y="${height - 6}" text-anchor="middle">${p.label}</text>
      </g>
    `
    )
    .join("");

  return `
    <div class="trend-chart">
      <svg viewBox="0 0 ${width} ${height}" class="trend-chart__svg">
        <line x1="${padding}" y1="${height - padding}" x2="${width - padding}" y2="${height - padding}"></line>
        <polyline points="${polyline}" fill="none"></polyline>
        ${labels}
      </svg>

      <div class="trend-chart__legend">
        ${data
          .map(
            (item) => `
            <div class="trend-chart__item">
              <span>${item.label}</span>
              <strong>${formatDuration(item.seconds)}</strong>
            </div>
          `
          )
          .join("")}
      </div>
    </div>
  `;
}

function getDashboardReminder(todayRecord, now) {
  const todayKey = getDateKey(now);
  if (!todayRecord || todayRecord.date !== todayKey) {
    return {
      level: "warn",
      title: "今天還沒有任何打卡或狀態紀錄",
      text: "你可以直接按上班打卡，或建立休假 / 出差 / 外出紀錄。",
    };
  }

  if (todayRecord.type === RECORD_TYPES.WORK && todayRecord.status === ATTENDANCE_STATUS.WORKING) {
    return {
      level: "info",
      title: "今天已上班，但還沒下班打卡",
      text: "如果今天工作結束，記得補下班時間，避免工時不完整。",
    };
  }

  return {
    level: "ok",
    title: "今天紀錄已完成",
    text: "今天的出勤或狀態已經有記錄。",
  };
}

export function renderDashboardView() {
  const now = state.now;
  const todayRecord = getTodayRecord(now);
  const summary = getHistorySummary(now);
  const trendData = getRecent7DaysTrend(now);
  const analysis = todayRecord?.clockOut ? getAttendanceAnalysis(todayRecord) : null;
  const reminder = getDashboardReminder(todayRecord, now);

  const canClockIn = !todayRecord;
  const canClockOut = !!todayRecord && todayRecord.type === RECORD_TYPES.WORK && todayRecord.status === ATTENDANCE_STATUS.WORKING;

  const clockInText = todayRecord?.clockIn ? formatDateTime(todayRecord.clockIn) : "尚未打卡";
  const clockOutText = todayRecord?.clockOut ? formatDateTime(todayRecord.clockOut) : "尚未打卡";
  const workDuration = getTodayWorkDuration(todayRecord, now);

  const defaultClockIn = toLocalDatetimeValue(
    new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 0, 0)
  );
  const defaultClockOut = toLocalDatetimeValue(
    new Date(now.getFullYear(), now.getMonth(), now.getDate(), 18, 0, 0)
  );
  const defaultStatusDate = now.toISOString().slice(0, 10);

  return `
  <div class="dashboard-grid">
      <div class="hero-panel">
        <div class="card">
          <div class="card__body hero-clock">
            <div>
              <p class="card__eyebrow">Live Clock</p>
              <h3 class="card__title">目前時間</h3>
            </div>
            <div class="live-time">${formatTime(now)}</div>
            <div class="live-date">${formatDate(now)}</div>
            <div>${getStatusPill(todayRecord)}</div>
            <p class="note">系統會精確記錄到秒，適合作為個人上下班留存紀錄。</p>
          </div>
        </div>

        <div class="card card--solid">
          <div class="card__body">
            <p class="card__eyebrow">Quick Actions</p>
            <h3 class="card__title">快速打卡</h3>
            <div class="action-row" style="margin-top:16px;">
              <button class="btn btn--primary" id="clock-in-btn" ${canClockIn ? "" : "disabled"}>
                上班打卡
              </button>
              <button class="btn btn--success" id="clock-out-btn" ${canClockOut ? "" : "disabled"}>
                下班打卡
              </button>
            </div>
            <div id="action-message" class="message-box"></div>
          </div>
        </div>
      </div>

      <div class="notice-card notice-card--${reminder.level}">
        <div>
          <p class="notice-card__title">${reminder.title}</p>
          <p class="notice-card__text">${reminder.text}</p>
        </div>
      </div>

      <div class="kpi-grid">
        <div class="kpi">
          <p class="kpi__label">今日上班時間</p>
          <h4 class="kpi__value">${todayRecord?.clockIn ? formatTime(todayRecord.clockIn) : "--:--:--"}</h4>
          <div class="kpi__meta">${clockInText}</div>
        </div>

        <div class="kpi">
          <p class="kpi__label">今日下班時間</p>
          <h4 class="kpi__value">${todayRecord?.clockOut ? formatTime(todayRecord.clockOut) : "--:--:--"}</h4>
          <div class="kpi__meta">${clockOutText}</div>
        </div>

        <div class="kpi">
          <p class="kpi__label">今日累計工時</p>
          <h4 class="kpi__value">${workDuration}</h4>
          <div class="kpi__meta">${todayRecord?.type === RECORD_TYPES.WORK ? "自動計算" : (todayRecord ? RECORD_TYPE_LABELS[todayRecord.type] : "等待紀錄")}</div>
        </div>

        <div class="kpi">
          <p class="kpi__label">今日考勤判定</p>
          <h4 class="kpi__value">${analysis ? analysis.label : "待完成"}</h4>
          <div class="kpi__meta">${
            analysis && todayRecord?.type === RECORD_TYPES.WORK
              ? `遲到 ${analysis.lateMinutes} 分 / 早退 ${analysis.earlyLeaveMinutes} 分 / 加班 ${analysis.overtimeMinutes} 分`
              : "完成上下班後自動判定"
          }</div>
        </div>
        
      </div>

      <div class="card">
        <div class="card__body">
          <div class="section__header">
            <div>
              <p class="section__eyebrow">Trend</p>
              <h3 class="section__title">近 7 天工時趨勢</h3>
            </div>
            <div class="inline-badge">Hours Trend</div>
          </div>
          ${renderTrendChart(trendData)}
        </div>
      </div>

      <div class="dashboard-bottom-grid">
        <div class="card">
          <div class="card__body">
            <div class="section__header">
              <div>
                <p class="section__eyebrow">Manual Entry</p>
                <h3 class="section__title">補卡</h3>
              </div>
              <div class="inline-badge">同日補卡</div>
            </div>

            <form id="manual-entry-form" class="form-grid">
              <div class="form-grid form-grid--2">
                <div class="field">
                  <label for="manual-record-type">紀錄類型</label>
                  <select id="manual-record-type" name="manualRecordType" class="input">
                    <option value="work">上班</option>
                    <option value="leave">休假</option>
                    <option value="sick">病假</option>
                    <option value="business_trip">出差</option>
                    <option value="out_of_office">外出</option>
                  </select>
                </div>
                <div class="field">
                  <label for="manual-note">備註</label>
                  <input id="manual-note" name="manualNote" class="input" type="text" placeholder="例如：外出拍攝、補登、請假原因" />
                </div>
              </div>

              <div class="form-grid form-grid--2">
                <div class="field">
                  <label for="manual-clock-in">上班時間</label>
                  <input
                    id="manual-clock-in"
                    name="manualClockIn"
                    class="input"
                    type="datetime-local"
                    step="1"
                    value="${defaultClockIn}"
                    required
                  />
                </div>

                <div class="field">
                  <label for="manual-clock-out">下班時間</label>
                  <input
                    id="manual-clock-out"
                    name="manualClockOut"
                    class="input"
                    type="datetime-local"
                    step="1"
                    value="${defaultClockOut}"
                    required
                  />
                </div>
              </div>

              <div class="action-row">
                <button type="submit" class="btn btn--accent">送出補卡</button>
                <button type="button" class="btn btn--ghost" id="export-json-btn">備份 JSON</button>
                <label class="btn btn--ghost file-btn">
                  匯入 JSON
                  <input type="file" id="import-json-input" accept=".json,application/json" hidden />
                </label>
              </div>

              <div id="manual-message" class="message-box"></div>
            </form>
          </div>
        </div>

        <div class="card card--solid">
          <div class="card__body">
            <div>
              <p class="section__eyebrow">Daily Status</p>
              <h3 class="section__title">假別 / 狀態</h3>
              <div class="month-badge inline-badge">不需要上下班時間</div>
            </div>

            <form id="status-record-form" class="form-grid" style="margin-top: 18px;">
              <div class="field">
                <label for="status-record-date">日期</label>
                <input id="status-record-date" name="statusRecordDate" class="input" type="date" value="${defaultStatusDate}" required />
              </div>

              <div class="field">
                <label for="status-record-type">狀態類型</label>
                <select id="status-record-type" name="statusRecordType" class="input">
                  <option value="leave">休假</option>
                  <option value="sick">病假</option>
                  <option value="business_trip">出差</option>
                  <option value="out_of_office">外出</option>
                </select>
              </div>

              <div class="field">
                <label for="status-record-note">備註</label>
                <input id="status-record-note" name="statusRecordNote" class="input" type="text" placeholder="例如：年假、出差台中、外出拜訪客戶" />
              </div>

              <div class="action-row">
                <button type="submit" class="btn btn--primary">新增狀態紀錄</button>
                <button class="btn btn--ghost" id="export-csv-btn" type="button">匯出 CSV</button>
              </div>

              <div id="status-message" class="message-box"></div>
            </form>
          </div>
        </div>
      </div>
    </div>
  `;
}
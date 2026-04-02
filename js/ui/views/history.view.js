import {
  getHistorySummary,
  filterRecords,
  getMonthOptions,
} from "../../modules/history/history.service.js";
import { buildCalendarData } from "../../modules/calendar/calendar.service.js";
import { state } from "../../core/state.js";
import { RECORD_TYPES, RECORD_TYPE_LABELS } from "../../core/constants.js";
import { formatDate, formatTime, formatDuration } from "../../utils/format.js";
import { getAttendanceAnalysis } from "../../utils/attendance-status.js";
import { toLocalDatetimeValue } from "../../utils/date.js";

function renderCalendar(cells) {
  const weekLabels = ["日", "一", "二", "三", "四", "五", "六"]
    .map((item) => `<div class="calendar__weekday">${item}</div>`)
    .join("");

  const body = cells
    .map((cell) => {
      if (cell.type === "empty") {
        return `<div class="calendar__cell calendar__cell--empty"></div>`;
      }

      const { record, dayNumber, analysis, dayRule } = cell;

      let statusClass = "";
      let statusText = "無紀錄";
      let metaText = "-";
      let infoText = "";
      const dayLabel = record?.dayLabel || dayRule?.label || "";

      if (record) {
        if (record.type && record.type !== RECORD_TYPES.WORK) {
          statusClass = "calendar__cell--status";
          statusText = RECORD_TYPE_LABELS[record.type] || "狀態";
          infoText = RECORD_TYPE_LABELS[record.type] || "狀態紀錄";
          metaText = record.note || dayLabel || "-";
        } else if (analysis?.isLate && analysis?.isEarlyLeave) {
          statusClass = "calendar__cell--warn";
          statusText = "遲到 / 早退";
          infoText = `${record.clockIn ? formatTime(record.clockIn) : "-"} / ${
            record.clockOut ? formatTime(record.clockOut) : "-"
          }`;
          metaText = `${formatDuration(record.workSeconds || 0)}${dayLabel ? `・${dayLabel}` : ""}`;
        } else if (analysis?.isLate || analysis?.isEarlyLeave) {
          statusClass = "calendar__cell--late";
          statusText = analysis.label;
          infoText = `${record.clockIn ? formatTime(record.clockIn) : "-"} / ${
            record.clockOut ? formatTime(record.clockOut) : "-"
          }`;
          metaText = `${formatDuration(record.workSeconds || 0)}${dayLabel ? `・${dayLabel}` : ""}`;
        } else if (analysis?.isOvertime) {
          statusClass = "calendar__cell--overtime";
          statusText = "加班";
          infoText = `${record.clockIn ? formatTime(record.clockIn) : "-"} / ${
            record.clockOut ? formatTime(record.clockOut) : "-"
          }`;
          metaText = `${formatDuration(record.workSeconds || 0)}${dayLabel ? `・${dayLabel}` : ""}`;
        } else {
          statusClass = "calendar__cell--done";
          statusText = "正常";
          infoText =
            record.type === RECORD_TYPES.WORK
              ? `${record.clockIn ? formatTime(record.clockIn) : "-"} / ${
                  record.clockOut ? formatTime(record.clockOut) : "-"
                }`
              : RECORD_TYPE_LABELS[record.type] || "狀態紀錄";
          metaText =
            record.type === RECORD_TYPES.WORK
              ? `${formatDuration(record.workSeconds || 0)}${dayLabel ? `・${dayLabel}` : ""}`
              : record.note || dayLabel || "-";
        }
      } else if (dayLabel) {
        metaText = dayLabel;
      }

      return `
        <div class="calendar__cell ${statusClass}">
          <div class="calendar__day">${dayNumber}</div>
          ${
            record
              ? `
                <div class="calendar__info">${infoText}</div>
                <div class="calendar__meta">${metaText}</div>
                <div class="calendar__status">${statusText}</div>
              `
              : `<div class="calendar__meta">${metaText}</div>`
          }
        </div>
      `;
    })
    .join("");

  return `
    <div class="calendar">
      <div class="calendar__weekdays">${weekLabels}</div>
      <div class="calendar__grid">${body}</div>
    </div>
  `;
}

function renderEditRows(filteredRecords) {
  return filteredRecords
    .map((record) => {
      const analysis = getAttendanceAnalysis(record);
      const dayLabel = record.dayLabel || "-";

      return `
        <tr>
          <td>${formatDate(record.date)}</td>
          <td>${dayLabel}</td>
          <td>${RECORD_TYPE_LABELS[record.type] || "上班"}</td>
          <td>${record.type === RECORD_TYPES.WORK ? (record.clockIn ? formatTime(record.clockIn) : "-") : "-"}</td>
          <td>${record.type === RECORD_TYPES.WORK ? (record.clockOut ? formatTime(record.clockOut) : "-") : "-"}</td>
          <td>${record.type === RECORD_TYPES.WORK ? formatDuration(record.workSeconds || 0) : "-"}</td>
          <td>${analysis.label}</td>
          <td class="table-note">${record.note || "-"}</td>
          <td>
            <div class="action-row">
              <button
                class="btn btn--ghost btn-open-edit-record"
                data-id="${record.id}"
                data-type="${record.type || RECORD_TYPES.WORK}"
                data-clock-in="${record.clockIn || ""}"
                data-clock-out="${record.clockOut || ""}"
                data-note="${encodeURIComponent(record.note || "")}"
              >
                編輯整筆
              </button>
              <button class="btn btn--danger btn-delete-record" data-id="${record.id}">
                刪除
              </button>
            </div>
          </td>
        </tr>
      `;
    })
    .join("");
}

export function renderHistoryView() {
  const summary = getHistorySummary();
  const months = getMonthOptions();
  const { month, keyword } = state.filters;

  const filteredRecords = filterRecords({ month, keyword });
  const calendarCells = buildCalendarData(
    filterRecords({ month, keyword: "" }),
    month || summary.currentMonthKey
  );

  const monthOptionsHtml = months
    .map(
      (item) =>
        `<option value="${item}" ${item === month ? "selected" : ""}>${item}</option>`
    )
    .join("");

  const firstEditable = filteredRecords[0] || null;
  const isWorkRecord = firstEditable?.type === RECORD_TYPES.WORK;

  const defaultEditClockIn =
    firstEditable?.clockIn && isWorkRecord ? toLocalDatetimeValue(firstEditable.clockIn) : "";

  const defaultEditClockOut =
    firstEditable?.clockOut && isWorkRecord ? toLocalDatetimeValue(firstEditable.clockOut) : "";

  const defaultNote = firstEditable?.note || "";

  return `
    <div class="section-block">
      <div class="history-summary">
        <div class="kpi">
          <p class="kpi__label">總紀錄天數</p>
          <h4 class="kpi__value">${summary.totalDays}</h4>
        </div>
        <div class="kpi">
          <p class="kpi__label">完成上下班天數</p>
          <h4 class="kpi__value">${summary.completedDays}</h4>
        </div>
        <div class="kpi">
          <p class="kpi__label">累計工時</p>
          <h4 class="kpi__value">${formatDuration(summary.totalSeconds)}</h4>
        </div>
        <div class="kpi">
          <p class="kpi__label">本月累計工時</p>
          <h4 class="kpi__value">${formatDuration(summary.currentMonthSeconds)}</h4>
        </div>
      </div>

      <div class="card" style="margin-bottom:20px;">
        <div class="card__body">
          <div class="section__header">
            <div>
              <p class="section__eyebrow">Calendar</p>
              <h3 class="section__title">月曆檢視</h3>
            </div>
            <div class="inline-badge">${month || summary.currentMonthKey}</div>
          </div>
          ${renderCalendar(calendarCells)}
        </div>
      </div>

      <div class="section__header">
        <div>
          <p class="section__eyebrow">History</p>
          <h3 class="section__title">歷史紀錄</h3>
        </div>
        <div class="action-row">
          <button class="btn btn--ghost" id="export-csv-btn">匯出 CSV</button>
          <button class="btn btn--ghost" id="export-json-btn">備份 JSON</button>
          <label class="btn btn--ghost file-btn">
            匯入 JSON
            <input type="file" id="import-json-input" accept=".json,application/json" hidden />
          </label>
          <button class="btn btn--ghost" id="clear-all-btn">清空所有紀錄</button>
        </div>
      </div>

      <div class="card" style="margin-bottom:18px;">
        <div class="card__body">
          <div class="form-grid form-grid--2">
            <div class="field">
              <label for="filter-month">月份篩選</label>
              <select id="filter-month" class="input">
                ${monthOptionsHtml}
              </select>
            </div>

            <div class="field">
              <label for="filter-keyword">關鍵字搜尋</label>
              <input
                id="filter-keyword"
                class="input"
                type="text"
                placeholder="搜尋備註、狀態或類型"
                value="${keyword || ""}"
              />
            </div>
          </div>
        </div>
      </div>

      <div class="card" style="margin-bottom:18px;">
        <div class="card__body">
          <div class="section__header">
            <div>
              <p class="section__eyebrow">Record Editor</p>
              <h3 class="section__title">編輯整筆紀錄</h3>
            </div>
            <div class="inline-badge">請先點列表中的「編輯整筆」</div>
          </div>

          <form id="record-edit-form" class="form-grid">
            <input type="hidden" id="edit-record-id" value="${firstEditable?.id || ""}" />

            <div class="form-grid form-grid--2">
              <div class="field">
                <label for="edit-record-type">紀錄類型</label>
                <select id="edit-record-type" name="editRecordType" class="input">
                  <option value="work" ${firstEditable?.type === "work" ? "selected" : ""}>上班</option>
                  <option value="leave" ${firstEditable?.type === "leave" ? "selected" : ""}>休假</option>
                  <option value="sick" ${firstEditable?.type === "sick" ? "selected" : ""}>病假</option>
                  <option value="business_trip" ${firstEditable?.type === "business_trip" ? "selected" : ""}>出差</option>
                  <option value="out_of_office" ${firstEditable?.type === "out_of_office" ? "selected" : ""}>外出</option>
                </select>
              </div>

              <div class="field">
                <label for="edit-note">備註</label>
                <input
                  id="edit-note"
                  name="editNote"
                  class="input"
                  type="text"
                  value="${defaultNote}"
                  placeholder="編輯這筆紀錄的備註"
                />
              </div>
            </div>

            <div class="form-grid form-grid--2">
              <div class="field">
                <label for="edit-clock-in">上班時間</label>
                <input
                  id="edit-clock-in"
                  name="editClockIn"
                  class="input"
                  type="datetime-local"
                  step="1"
                  value="${defaultEditClockIn}"
                  ${isWorkRecord || !firstEditable ? "required" : ""}
                />
              </div>

              <div class="field">
                <label for="edit-clock-out">下班時間</label>
                <input
                  id="edit-clock-out"
                  name="editClockOut"
                  class="input"
                  type="datetime-local"
                  step="1"
                  value="${defaultEditClockOut}"
                  ${isWorkRecord || !firstEditable ? "required" : ""}
                />
              </div>
            </div>

            <div class="action-row">
              <button type="submit" class="btn btn--accent">儲存修改</button>
            </div>

            <div id="edit-record-message" class="message-box"></div>
          </form>
        </div>
      </div>

      ${
        filteredRecords.length
          ? `
            <div class="data-table">
              <table>
                <thead>
                  <tr>
                    <th>日期</th>
                    <th>日別</th>
                    <th>類型</th>
                    <th>上班</th>
                    <th>下班</th>
                    <th>工時</th>
                    <th>考勤判定</th>
                    <th>備註</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  ${renderEditRows(filteredRecords)}
                </tbody>
              </table>
            </div>
          `
          : `
            <div class="empty-state">
              目前這個篩選條件下沒有紀錄。
            </div>
          `
      }
    </div>
  `;
}
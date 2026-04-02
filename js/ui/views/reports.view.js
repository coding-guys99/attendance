import { state } from "../../core/state.js";
import { getMonthOptions, getMonthlyReport } from "../../modules/history/history.service.js";
import { formatDuration, formatDate } from "../../utils/format.js";
import { getAttendanceAnalysis } from "../../utils/attendance-status.js";
import { RECORD_TYPE_LABELS, RECORD_TYPES } from "../../core/constants.js";

function renderMonthlyRows(records = []) {
  return records
    .map((record) => {
      const analysis = getAttendanceAnalysis(record);

      return `
        <tr>
          <td>${formatDate(record.date)}</td>
          <td>${RECORD_TYPE_LABELS[record.type] || "上班"}</td>
          <td>${record.type === RECORD_TYPES.WORK ? formatDuration(record.workSeconds || 0) : "-"}</td>
          <td>${analysis.label}</td>
          <td class="table-note">${record.note || "-"}</td>
        </tr>
      `;
    })
    .join("");
}

function renderEmptyState() {
  return `
    <div class="empty-state">
      這個月份目前沒有任何紀錄。
    </div>
  `;
}

export function renderReportsView() {
  const monthOptions = getMonthOptions();
  const fallbackMonth = new Date().toISOString().slice(0, 7);
  const activeMonth = state.filters.month || monthOptions[0] || fallbackMonth;
  const report = getMonthlyReport(activeMonth);

  const optionsHtml = monthOptions.length
    ? monthOptions
        .map(
          (item) =>
            `<option value="${item}" ${item === activeMonth ? "selected" : ""}>${item}</option>`
        )
        .join("")
    : `<option value="${activeMonth}" selected>${activeMonth}</option>`;

  const rowsHtml = renderMonthlyRows(report.records || []);

  return `
    <div class="section-block">
      <div class="section__header">
        <div>
          <p class="section__eyebrow">Reports</p>
          <h3 class="section__title">月報表</h3>
        </div>
        <div class="inline-badge">${activeMonth}</div>
      </div>

      <div class="card" style="margin-bottom: 18px;">
        <div class="card__body">
          <div class="field report-filter-field">
            <label for="report-month-select">選擇月份</label>
            <select id="report-month-select" class="input">
              ${optionsHtml}
            </select>
          </div>
        </div>
      </div>

      <div class="history-summary">
        <div class="kpi">
          <p class="kpi__label">本月總工時</p>
          <h4 class="kpi__value">${formatDuration(report.totalSeconds || 0)}</h4>
        </div>

        <div class="kpi">
          <p class="kpi__label">平均每日工時</p>
          <h4 class="kpi__value">${formatDuration(report.averageSeconds || 0)}</h4>
        </div>

        <div class="kpi">
          <p class="kpi__label">實際上班天數</p>
          <h4 class="kpi__value">${report.workDays || 0}</h4>
        </div>

        <div class="kpi">
          <p class="kpi__label">遲到次數</p>
          <h4 class="kpi__value">${report.lateCount || 0}</h4>
        </div>

        <div class="kpi">
          <p class="kpi__label">早退次數</p>
          <h4 class="kpi__value">${report.earlyLeaveCount || 0}</h4>
        </div>

        <div class="kpi">
          <p class="kpi__label">加班次數</p>
          <h4 class="kpi__value">${report.overtimeCount || 0}</h4>
        </div>

        <div class="kpi">
          <p class="kpi__label">休假天數</p>
          <h4 class="kpi__value">${report.leaveCount || 0}</h4>
        </div>

        <div class="kpi">
          <p class="kpi__label">病假 / 出差 / 外出</p>
          <h4 class="kpi__value">${(report.sickCount || 0) + (report.tripCount || 0) + (report.outCount || 0)}</h4>
          <div class="kpi__meta">
            病假 ${report.sickCount || 0} / 出差 ${report.tripCount || 0} / 外出 ${report.outCount || 0}
          </div>
        </div>
      </div>

      <div class="card" style="margin-top: 18px;">
        <div class="card__body">
          <div class="section__header">
            <div>
              <p class="section__eyebrow">Monthly Details</p>
              <h3 class="section__title">月明細</h3>
            </div>
            <div class="inline-badge">${activeMonth}</div>
          </div>

          ${
            report.records && report.records.length
              ? `
                <div class="data-table">
                  <table>
                    <thead>
                      <tr>
                        <th>日期</th>
                        <th>類型</th>
                        <th>工時</th>
                        <th>判定</th>
                        <th>備註</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${rowsHtml}
                    </tbody>
                  </table>
                </div>
              `
              : renderEmptyState()
          }
        </div>
      </div>
    </div>
  `;
}
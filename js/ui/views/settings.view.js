import { state } from "../../core/state.js";
import { COUNTRY_OPTIONS } from "../../core/countries.js";

function renderCountryOptions(selectedCountry = "TW") {
  return COUNTRY_OPTIONS.map(
    (item) => `
      <option value="${item.code}" ${
        selectedCountry === item.code ? "selected" : ""
      }>
        ${item.label}
      </option>
    `
  ).join("");
}

export function renderSettingsView() {
  const settings = {
    expectedClockIn: "09:00:00",
    expectedClockOut: "18:00:00",
    lateGraceMinutes: 0,
    earlyLeaveGraceMinutes: 0,
    overtimeThresholdMinutes: 0,
    officeName: "",
    officeLatitude: null,
    officeLongitude: null,
    clockInRadiusMeters: 150,
    country: "TW",
    ...(state.settings || {}),
  };

  const countryOptionsHtml = renderCountryOptions(settings.country);

  return `
    <div class="section-block">
      <div class="card">
        <div class="card__body">
          <div class="section__header">
            <div>
              <p class="section__eyebrow">Settings</p>
              <h3 class="section__title">考勤規則設定</h3>
            </div>
            <div class="inline-badge">Cloud Settings</div>
          </div>

          <form id="settings-form" class="form-grid">
            <div class="form-grid form-grid--2">
              <div class="field">
                <label for="expected-clock-in">標準上班時間</label>
                <input
                  id="expected-clock-in"
                  name="expectedClockIn"
                  class="input"
                  type="time"
                  step="1"
                  value="${settings.expectedClockIn}"
                  required
                />
              </div>

              <div class="field">
                <label for="expected-clock-out">標準下班時間</label>
                <input
                  id="expected-clock-out"
                  name="expectedClockOut"
                  class="input"
                  type="time"
                  step="1"
                  value="${settings.expectedClockOut}"
                  required
                />
              </div>
            </div>

            <div class="form-grid form-grid--2">
              <div class="field">
                <label for="late-grace-minutes">遲到寬限分鐘</label>
                <input
                  id="late-grace-minutes"
                  name="lateGraceMinutes"
                  class="input"
                  type="number"
                  min="0"
                  step="1"
                  value="${settings.lateGraceMinutes}"
                  required
                />
              </div>

              <div class="field">
                <label for="early-leave-grace-minutes">早退寬限分鐘</label>
                <input
                  id="early-leave-grace-minutes"
                  name="earlyLeaveGraceMinutes"
                  class="input"
                  type="number"
                  min="0"
                  step="1"
                  value="${settings.earlyLeaveGraceMinutes}"
                  required
                />
              </div>
            </div>

            <div class="field">
              <label for="overtime-threshold-minutes">加班判定分鐘</label>
              <input
                id="overtime-threshold-minutes"
                name="overtimeThresholdMinutes"
                class="input"
                type="number"
                min="0"
                step="1"
                value="${settings.overtimeThresholdMinutes}"
                required
              />
              <div class="helper-text">
                例如填 30，代表超過標準下班時間 30 分鐘後才算加班。
              </div>
            </div>

            <div class="field">
              <label for="country">公共假期國家</label>
              <select id="country" name="country" class="input">
                ${countryOptionsHtml}
              </select>
              <div class="helper-text">
                系統會依這個國家自動判斷國定假日。
              </div>
            </div>

            <div class="card" style="margin-top: 18px;">
              <div class="card__body">
                <div class="section__header">
                  <div>
                    <p class="section__eyebrow">Geofence</p>
                    <h3 class="section__title">打卡地理範圍</h3>
                  </div>
                  <div class="inline-badge">Office Fence</div>
                </div>

                <div class="form-grid">
                  <div class="field">
                    <label for="office-name">公司名稱</label>
                    <input
                      id="office-name"
                      name="officeName"
                      class="input"
                      type="text"
                      value="${settings.officeName || ""}"
                      placeholder="例如：台北辦公室"
                    />
                  </div>

                  <div class="form-grid form-grid--2">
                    <div class="field">
                      <label for="office-latitude">公司緯度</label>
                      <input
                        id="office-latitude"
                        name="officeLatitude"
                        class="input"
                        type="number"
                        step="any"
                        value="${settings.officeLatitude ?? ""}"
                      />
                    </div>

                    <div class="field">
                      <label for="office-longitude">公司經度</label>
                      <input
                        id="office-longitude"
                        name="officeLongitude"
                        class="input"
                        type="number"
                        step="any"
                        value="${settings.officeLongitude ?? ""}"
                      />
                    </div>
                  </div>

                  <div class="field">
                    <label for="clock-in-radius-meters">可打卡半徑（公尺）</label>
                    <input
                      id="clock-in-radius-meters"
                      name="clockInRadiusMeters"
                      class="input"
                      type="number"
                      min="1"
                      step="1"
                      value="${settings.clockInRadiusMeters ?? 150}"
                    />
                  </div>

                  <div class="action-row">
                    <button
                      type="button"
                      class="btn btn--ghost"
                      id="set-office-current-location-btn"
                    >
                      用目前位置設為公司位置
                    </button>
                  </div>

                  <div id="geofence-message" class="message-box"></div>
                </div>
              </div>
            </div>

            <div class="action-row">
              <button type="submit" class="btn btn--primary">儲存設定</button>
              <button type="button" class="btn btn--ghost" id="reset-settings-btn">
                恢復預設
              </button>
            </div>

            <div id="settings-message" class="message-box"></div>
          </form>
        </div>
      </div>
    </div>
  `;
}
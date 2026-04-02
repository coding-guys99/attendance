export function renderAuthView() {
  return `
    <div class="auth-shell">
      <div class="card card--solid">
        <div class="card__body">
          <p class="card__eyebrow">Cloud Login</p>
          <h3 class="card__title">登入雲端打卡系統</h3>

          <form id="auth-signin-form" class="form-grid" style="margin-top: 18px;">
            <div class="field">
              <label for="auth-email">Email</label>
              <input id="auth-email" name="email" class="input" type="email" required />
            </div>

            <div class="field">
              <label for="auth-password">Password</label>
              <input id="auth-password" name="password" class="input" type="password" required />
            </div>

            <div class="action-row">
              <button type="submit" class="btn btn--primary">登入</button>
              <button type="button" class="btn btn--ghost" id="auth-signup-btn">註冊</button>
            </div>

            <div id="auth-message" class="message-box"></div>
          </form>
        </div>
      </div>
    </div>
  `;
}
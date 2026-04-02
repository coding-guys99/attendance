import { state } from "../core/state.js";
import { VIEW_TYPES } from "../core/constants.js";

import { renderDashboardView } from "./views/dashboard.view.js";
import { renderHistoryView } from "./views/history.view.js";
import { renderReportsView } from "./views/reports.view.js";
import { renderLeaveView } from "./views/leave.view.js";
import { renderNotificationsView } from "./views/notifications.view.js";
import { renderAnnouncementsView } from "./views/announcements.view.js";
import { renderAdminView, bindAdminActions } from "./views/admin.view.js";
import { renderSettingsView } from "./views/settings.view.js";

export function renderApp() {
  const container = document.getElementById("app-view");
  if (!container) return;

  if (state.currentView === VIEW_TYPES.HISTORY) {
    container.innerHTML = renderHistoryView();
    return;
  }

  if (state.currentView === VIEW_TYPES.REPORTS) {
    container.innerHTML = renderReportsView();
    return;
  }

  if (state.currentView === VIEW_TYPES.LEAVE) {
    container.innerHTML = renderLeaveView();
    return;
  }

  if (state.currentView === VIEW_TYPES.NOTIFICATIONS) {
    container.innerHTML = renderNotificationsView();
    return;
  }

  if (state.currentView === VIEW_TYPES.ANNOUNCEMENTS) {
    container.innerHTML = renderAnnouncementsView();
    return;
  }

  if (state.currentView === VIEW_TYPES.ADMIN) {
    container.innerHTML = renderAdminView();
    bindAdminActions();

    return;
  }

  if (state.currentView === VIEW_TYPES.SETTINGS) {
    container.innerHTML = renderSettingsView();
    return;
  }

  container.innerHTML = renderDashboardView();
}
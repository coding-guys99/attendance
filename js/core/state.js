import { VIEW_TYPES } from "./constants.js";
import { getMonthKey } from "../utils/date.js";
import { APP_CONFIG } from "./config.js";

export const state = {
  session: null,
  user: null,
  currentView: "dashboard",
  records: [],
  settings: null,
  filters: {
    month: "",
    keyword: "",
  },
  now: new Date(),
  announcements: [],
notifications: [],
notificationUnreadCount: 0,
};
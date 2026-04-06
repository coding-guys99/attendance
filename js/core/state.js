import { VIEW_TYPES } from "./constants.js";
import { getMonthKey } from "../utils/date.js";
import { APP_CONFIG } from "./config.js";

export const state = {
  user: null,
  session: null,
  profile: null,
  records: [],
  announcements: [],
  notifications: [],
  notificationUnreadCount: 0,
  holidayCache: {},
  holidayCountryLoadedYear: null,
  filters: {
    month: "",
    keyword: "",
  },
  currentView: "dashboard",
  settings: {},
  now: new Date(),
};
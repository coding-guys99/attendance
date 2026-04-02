export const VIEW_TYPES = {
  DASHBOARD: "dashboard",
  HISTORY: "history",
  REPORTS: "reports",
  LEAVE: "leave",
  NOTIFICATIONS: "notifications",
  ANNOUNCEMENTS: "announcements",
  ADMIN: "admin",
  SETTINGS: "settings",
};

export const ATTENDANCE_STATUS = {
  NOT_STARTED: "not_started",
  WORKING: "working",
  COMPLETED: "completed",
};

export const USER_ROLES = {
  ADMIN: "admin",
  EMPLOYEE: "employee",
};

export const RECORD_TYPES = {
  WORK: "work",
  LEAVE: "leave",
  SICK: "sick",
  BUSINESS_TRIP: "business_trip",
  OUT_OF_OFFICE: "out_of_office",
};

export const RECORD_TYPE_LABELS = {
  [RECORD_TYPES.WORK]: "上班",
  [RECORD_TYPES.LEAVE]: "休假",
  [RECORD_TYPES.SICK]: "病假",
  [RECORD_TYPES.BUSINESS_TRIP]: "出差",
  [RECORD_TYPES.OUT_OF_OFFICE]: "外出",
};

export const LEAVE_TYPES = {
  ANNUAL: "annual_leave",
  SICK: "sick_leave",
  PERSONAL: "personal_leave",
  COMP: "comp_leave",
  OFFICIAL: "official_leave",
  MARRIAGE: "marriage_leave",
  BEREAVEMENT: "bereavement_leave",
};

export const LEAVE_TYPE_LABELS = {
  [LEAVE_TYPES.ANNUAL]: "年假",
  [LEAVE_TYPES.SICK]: "病假",
  [LEAVE_TYPES.PERSONAL]: "事假",
  [LEAVE_TYPES.COMP]: "補休",
  [LEAVE_TYPES.OFFICIAL]: "公假",
  [LEAVE_TYPES.MARRIAGE]: "婚假",
  [LEAVE_TYPES.BEREAVEMENT]: "喪假",
};

export const LEAVE_REQUEST_STATUS = {
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
  CANCELLED: "cancelled",
};

export const STORAGE_KEYS = {
  USERS: "attendance_users",
  CURRENT_USER: "attendance_current_user",
  RECORDS: "attendance_records",
};

export const DEFAULT_USERS = [
  {
    id: "u001",
    username: "andy",
    password: "1234",
    name: "Andy",
    role: USER_ROLES.ADMIN,
    department: "管理部",
    isActive: true,
    canCheckIn: true,
  },
  {
    id: "u002",
    username: "cindy",
    password: "1234",
    name: "Cindy",
    role: USER_ROLES.EMPLOYEE,
    department: "業務部",
    isActive: true,
    canCheckIn: true,
  },
  {
    id: "u003",
    username: "test",
    password: "1234",
    name: "Test User",
    role: USER_ROLES.EMPLOYEE,
    department: "測試帳號",
    isActive: false,
    canCheckIn: false,
  },
];
export const DAY_TYPES = {
  WORKDAY: "workday",
  REST_DAY: "rest_day", // 休息日，通常週六
  REGULAR_DAY_OFF: "regular_day_off", // 例假日，通常週日
  NATIONAL_HOLIDAY: "national_holiday",
  MAKEUP_WORKDAY: "makeup_workday",
};

export const DAY_TYPE_LABELS = {
  [DAY_TYPES.WORKDAY]: "工作日",
  [DAY_TYPES.REST_DAY]: "休息日",
  [DAY_TYPES.REGULAR_DAY_OFF]: "例假日",
  [DAY_TYPES.NATIONAL_HOLIDAY]: "國定假日",
  [DAY_TYPES.MAKEUP_WORKDAY]: "補班日",
};
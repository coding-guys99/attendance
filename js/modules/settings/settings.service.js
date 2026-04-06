import { APP_CONFIG } from "../../core/config.js";
import { state } from "../../core/state.js";
import { supabase } from "../../lib/supabase.js";

function normalizeNumber(value, fallback = 0) {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

function normalizeNullableNumber(value, fallback = null) {
  if (value === "" || value === null || value === undefined) return fallback;
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

function normalizeTimeString(value, fallback) {
  if (typeof value !== "string") return fallback;

  const trimmed = value.trim();

  if (/^\d{2}:\d{2}$/.test(trimmed)) {
    return `${trimmed}:00`;
  }

  return /^\d{2}:\d{2}:\d{2}$/.test(trimmed) ? trimmed : fallback;
}

function normalizeCountry(value, fallback = "TW") {
  if (typeof value !== "string") return fallback;

  const trimmed = value.trim().toUpperCase();
  return trimmed || fallback;
}

function buildDefaultSettings() {
  return {
    ...APP_CONFIG.defaultRules,
    officeName: "",
    officeLatitude: null,
    officeLongitude: null,
    clockInRadiusMeters: 150,
    country: "TW",
  };
}

function mapSettingsFromDb(row) {
  return {
    expectedClockIn: normalizeTimeString(
      row.expected_clock_in,
      APP_CONFIG.defaultRules.expectedClockIn
    ),
    expectedClockOut: normalizeTimeString(
      row.expected_clock_out,
      APP_CONFIG.defaultRules.expectedClockOut
    ),
    lateGraceMinutes: normalizeNumber(
      row.late_grace_minutes,
      APP_CONFIG.defaultRules.lateGraceMinutes
    ),
    earlyLeaveGraceMinutes: normalizeNumber(
      row.early_leave_grace_minutes,
      APP_CONFIG.defaultRules.earlyLeaveGraceMinutes
    ),
    overtimeThresholdMinutes: normalizeNumber(
      row.overtime_threshold_minutes,
      APP_CONFIG.defaultRules.overtimeThresholdMinutes
    ),
    officeName: row.office_name || "",
    officeLatitude: normalizeNullableNumber(row.office_latitude, null),
    officeLongitude: normalizeNullableNumber(row.office_longitude, null),
    clockInRadiusMeters: normalizeNumber(row.clock_in_radius_meters, 150),
    country: normalizeCountry(row.country, "TW"),
  };
}

function mapSettingsToDb(settings) {
  return {
    expected_clock_in: normalizeTimeString(
      settings.expectedClockIn,
      APP_CONFIG.defaultRules.expectedClockIn
    ),
    expected_clock_out: normalizeTimeString(
      settings.expectedClockOut,
      APP_CONFIG.defaultRules.expectedClockOut
    ),
    late_grace_minutes: normalizeNumber(
      settings.lateGraceMinutes,
      APP_CONFIG.defaultRules.lateGraceMinutes
    ),
    early_leave_grace_minutes: normalizeNumber(
      settings.earlyLeaveGraceMinutes,
      APP_CONFIG.defaultRules.earlyLeaveGraceMinutes
    ),
    overtime_threshold_minutes: normalizeNumber(
      settings.overtimeThresholdMinutes,
      APP_CONFIG.defaultRules.overtimeThresholdMinutes
    ),
    office_name: settings.officeName || "",
    office_latitude: normalizeNullableNumber(settings.officeLatitude, null),
    office_longitude: normalizeNullableNumber(settings.officeLongitude, null),
    clock_in_radius_meters: normalizeNumber(settings.clockInRadiusMeters, 150),
    country: normalizeCountry(settings.country, "TW"),
  };
}

export async function loadSettings() {
  const defaults = buildDefaultSettings();

  if (!state.user) {
    state.settings = defaults;
    return state.settings;
  }

  const { data, error } = await supabase
    .from("attendance_settings")
    .select("*")
    .eq("user_id", state.user.id)
    .maybeSingle();

  if (error) {
    console.error("loadSettings error:", error);
    state.settings = defaults;
    return state.settings;
  }

  if (!data) {
    const defaultsPayload = {
      user_id: state.user.id,
      ...mapSettingsToDb(defaults),
    };

    const { data: inserted, error: insertError } = await supabase
      .from("attendance_settings")
      .insert(defaultsPayload)
      .select("*")
      .single();

    if (insertError) {
      console.error("create default settings error:", insertError);
      state.settings = defaults;
      return state.settings;
    }

    state.settings = mapSettingsFromDb(inserted);
    return state.settings;
  }

  state.settings = mapSettingsFromDb(data);
  return state.settings;
}

export async function saveSettings(nextSettings) {
  if (!state.user) {
    return {
      ok: false,
      message: "尚未登入，無法儲存設定。",
      settings: state.settings,
    };
  }

  const mergedSettings = {
    ...buildDefaultSettings(),
    ...state.settings,
    ...nextSettings,
  };

  const payload = mapSettingsToDb(mergedSettings);

  const { data, error } = await supabase
    .from("attendance_settings")
    .update(payload)
    .eq("user_id", state.user.id)
    .select("*")
    .single();

  if (error) {
    console.error("saveSettings error:", error);
    return {
      ok: false,
      message: "設定儲存失敗。",
      settings: state.settings,
    };
  }

  state.settings = mapSettingsFromDb(data);

  return {
    ok: true,
    message: "設定已儲存。",
    settings: state.settings,
  };
}

export async function resetSettings() {
  return await saveSettings(buildDefaultSettings());
}

export function getSettings() {
  return state.settings;
}
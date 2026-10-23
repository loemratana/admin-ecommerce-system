import api from "@/lib/api/client";
import { ENDPOINTS } from "@/lib/api/endpoints";
import type { ApiResponse } from "@/lib/api/types";
import type { PublicSettings, Settings, SettingsPayload, SettingsSection } from "@/features/settings/types/settings.types";

// No login needed; the dashboard reads the store currency from here.
export function getPublicSettings() {
  return api.get<ApiResponse<PublicSettings>>(ENDPOINTS.settings.public);
}

// Admin only.
export function getSettings() {
  return api.get<ApiResponse<Settings>>(ENDPOINTS.settings.base);
}

// Each section is saved on its own and replaced as a whole; the response is all settings after the save.
export function updateSettingsSection<S extends SettingsSection>(section: S, payload: SettingsPayload[S]) {
  return api.put<ApiResponse<Settings>>(ENDPOINTS.settings.section(section), payload);
}

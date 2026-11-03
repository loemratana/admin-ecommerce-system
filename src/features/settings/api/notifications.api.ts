import api from "@/lib/api/client";
import { ENDPOINTS } from "@/lib/api/endpoints";
import type { ApiResponse } from "@/lib/api/types";
import type {
  NotificationChannelStatus,
  NotificationDestination,
  NotificationDestinationPayload,
} from "@/features/settings/types/notification.types";

// Admin only. Where store notifications (new order, low stock, new product) are sent.

export function getNotificationDestinations() {
  return api.get<ApiResponse<NotificationDestination[]>>(ENDPOINTS.settings.notificationDestinations);
}

export function getNotificationChannels() {
  return api.get<ApiResponse<NotificationChannelStatus>>(ENDPOINTS.settings.notificationChannels);
}

export function createNotificationDestination(payload: NotificationDestinationPayload) {
  return api.post<ApiResponse<NotificationDestination>>(ENDPOINTS.settings.notificationDestinations, payload);
}

// Replaces the destination as a whole, including its events.
export function updateNotificationDestination(id: number, payload: NotificationDestinationPayload) {
  return api.put<ApiResponse<NotificationDestination>>(ENDPOINTS.settings.notificationDestination(id), payload);
}

export function deleteNotificationDestination(id: number) {
  return api.delete<ApiResponse<null>>(ENDPOINTS.settings.notificationDestination(id));
}

// Sent right away; a 400's message is the provider's reason, e.g. "Bad Request: chat not found".
export function sendTestNotification(id: number) {
  return api.post<ApiResponse<null>>(ENDPOINTS.settings.notificationDestinationTest(id));
}

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createNotificationDestination,
  deleteNotificationDestination,
  getNotificationChannels,
  getNotificationDestinations,
  sendTestNotification,
  updateNotificationDestination,
} from "@/features/settings/api/notifications.api";
import type { NotificationDestinationPayload } from "@/features/settings/types/notification.types";

export const notificationKeys = {
  all: ["notification-destinations"] as const,
  list: () => [...notificationKeys.all, "list"] as const,
  channels: () => [...notificationKeys.all, "channels"] as const,
};

export function useNotificationDestinations() {
  return useQuery({
    queryKey: notificationKeys.list(),
    queryFn: async () => (await getNotificationDestinations()).data.data,
  });
}

export function useNotificationChannels() {
  return useQuery({
    queryKey: notificationKeys.channels(),
    queryFn: async () => (await getNotificationChannels()).data.data,
  });
}

/** Creates when id is null, otherwise replaces destination {id}. */
export function useSaveNotificationDestination() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number | null; payload: NotificationDestinationPayload }) =>
      id === null ? createNotificationDestination(payload) : updateNotificationDestination(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: notificationKeys.list() }),
  });
}

export function useDeleteNotificationDestination() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteNotificationDestination(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: notificationKeys.list() }),
  });
}

export function useSendTestNotification() {
  return useMutation({
    mutationFn: (id: number) => sendTestNotification(id),
  });
}

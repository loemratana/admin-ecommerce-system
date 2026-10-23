import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getDevices, revokeDevice } from "@/features/auth/api/auth.api";

export const deviceKeys = {
  all: ["auth-devices"] as const,
};

export function useDevices() {
  return useQuery({ queryKey: deviceKeys.all, queryFn: async () => (await getDevices()).data.data });
}

export function useRevokeDevice(options: { onSuccess?: () => void; onError?: (error: unknown) => void } = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (deviceId: string) => revokeDevice(deviceId),
    onSuccess: async () => {
      options.onSuccess?.();
      await queryClient.invalidateQueries({ queryKey: deviceKeys.all });
    },
    onError: options.onError,
  });
}

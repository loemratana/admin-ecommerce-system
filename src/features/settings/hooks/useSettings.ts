import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getPublicSettings, getSettings, updateSettingsSection } from "@/features/settings/api/settings.api";
import type { SettingsPayload, SettingsSection } from "@/features/settings/types/settings.types";
import { orderKeys } from "@/features/orders/hooks/useOrders";
import { useCurrencyStore } from "@/lib/currency";

export const settingsKeys = {
  all: ["settings"] as const,
  public: ["settings", "public"] as const,
};

export function usePublicSettings() {
  return useQuery({
    queryKey: settingsKeys.public,
    queryFn: async () => (await getPublicSettings()).data.data,
    staleTime: 5 * 60 * 1000,
  });
}

export function useSettings() {
  return useQuery({
    queryKey: settingsKeys.all,
    queryFn: async () => (await getSettings()).data.data,
  });
}

export function useUpdateSettings<S extends SettingsSection>(section: S) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: SettingsPayload[S]) => updateSettingsSection(section, payload),
    onSuccess: (response) => {
      const settings = response.data.data;
      queryClient.setQueryData(settingsKeys.all, settings);
      queryClient.invalidateQueries({ queryKey: settingsKeys.public });
      // Money everywhere in the dashboard switches to the new currency.
      if (section === "localization") useCurrencyStore.getState().setCurrency(settings.localization.currency);
      // Return deadlines shown on orders depend on the return window.
      if (section === "orders") queryClient.invalidateQueries({ queryKey: orderKeys.all });
    },
  });
}

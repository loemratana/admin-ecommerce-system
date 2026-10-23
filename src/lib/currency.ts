import { create } from "zustand";

// The store's currency comes from Settings / Localization (GET /api/v1/settings/public). It's only
// a label: amounts are never converted. The last known value is kept in localStorage so the first
// render already uses it; CurrencySync in AppLayout refreshes it from the API.

const STORAGE_KEY = "ecommerce.currency";
const FALLBACK = "USD";

function readStored(): string {
  try {
    return window.localStorage.getItem(STORAGE_KEY) || FALLBACK;
  } catch {
    return FALLBACK;
  }
}

type CurrencyState = {
  currency: string;
  setCurrency: (currency: string) => void;
};

export const useCurrencyStore = create<CurrencyState>((set) => ({
  currency: readStored(),
  setCurrency: (currency) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, currency);
    } catch {
      // Private mode etc.: the value still applies for this session.
    }
    set({ currency });
  },
}));

/** For components that show the currency itself, e.g. a "Shipping fee (KHR)" label. */
export const useCurrency = () => useCurrencyStore((state) => state.currency);

const formatters = new Map<string, Intl.NumberFormat>();

function formatter(compact: boolean): Intl.NumberFormat {
  const currency = useCurrencyStore.getState().currency;
  const key = `${currency}|${compact}`;
  let format = formatters.get(key);
  if (!format) {
    const options: Intl.NumberFormatOptions = {
      style: "currency",
      // "$", "€", "៛" rather than "US$" / "KHR"
      currencyDisplay: "narrowSymbol",
      ...(compact ? { notation: "compact", maximumFractionDigits: 1 } : {}),
    };
    try {
      format = new Intl.NumberFormat("en-US", { ...options, currency });
    } catch {
      // Unknown code (shouldn't happen: the API validates it).
      format = new Intl.NumberFormat("en-US", { ...options, currency: FALLBACK });
    }
    formatters.set(key, format);
  }
  return format;
}

export const formatMoney = (value: number) => formatter(false).format(value);

export const formatCompactMoney = (value: number) => formatter(true).format(value);

/** Money or a placeholder for missing values; accepts the numbers-as-strings some APIs send. */
export const formatPrice = (value: number | string | null | undefined, empty = "—") =>
  value == null || value === "" ? empty : formatMoney(Number(value));

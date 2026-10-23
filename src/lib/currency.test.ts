import { afterEach, describe, expect, it } from "vitest";
import { formatCompactMoney, formatMoney, formatPrice, useCurrencyStore } from "./currency";

describe("currency formatting", () => {
  afterEach(() => useCurrencyStore.getState().setCurrency("USD"));

  it("uses the store currency", () => {
    expect(formatMoney(1234.5)).toBe("$1,234.50");
    useCurrencyStore.getState().setCurrency("EUR");
    expect(formatMoney(1234.5)).toBe("€1,234.50");
    useCurrencyStore.getState().setCurrency("KHR");
    expect(formatMoney(4000)).toBe("៛4,000.00");
  });

  it("follows the currency's own decimal places", () => {
    useCurrencyStore.getState().setCurrency("JPY");
    expect(formatMoney(1500)).toBe("¥1,500");
  });

  it("formats compact amounts", () => {
    expect(formatCompactMoney(12500)).toBe("$12.5K");
    useCurrencyStore.getState().setCurrency("THB");
    expect(formatCompactMoney(12500)).toBe("฿12.5K");
  });

  it("falls back to USD for an unknown code", () => {
    useCurrencyStore.getState().setCurrency("NOPE");
    expect(formatMoney(1)).toBe("$1.00");
  });

  it("formatPrice handles missing values and numeric strings", () => {
    expect(formatPrice(null)).toBe("—");
    expect(formatPrice(undefined, "n/a")).toBe("n/a");
    expect(formatPrice("19.9")).toBe("$19.90");
  });
});

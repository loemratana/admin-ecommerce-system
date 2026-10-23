const DEVICE_ID_KEY = "ecommerce.web.device-id";

export function getDeviceId(): string {
  const existing = window.localStorage.getItem(DEVICE_ID_KEY);
  if (existing) return existing;

  const deviceId = crypto.randomUUID();
  window.localStorage.setItem(DEVICE_ID_KEY, deviceId);
  return deviceId;
}

export function getDeviceName(): string {
  const userAgent = navigator.userAgent;
  const browser = userAgent.includes("Firefox")
    ? "Firefox"
    : userAgent.includes("Edg")
      ? "Edge"
      : userAgent.includes("Chrome")
        ? "Chrome"
        : userAgent.includes("Safari")
          ? "Safari"
          : "Browser";
  const platform = /Mac/.test(navigator.platform)
    ? "macOS"
    : /Win/.test(navigator.platform)
      ? "Windows"
      : /Linux/.test(navigator.platform)
        ? "Linux"
        : "Web";

  return `${browser} on ${platform}`;
}

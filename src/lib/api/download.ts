import { isAxiosError } from "axios";
import api from "./client";

// Reads the file name from `Content-Disposition: attachment; filename="..."` (or filename*=UTF-8''...).
function fileNameFrom(header: unknown): string | undefined {
  if (typeof header !== "string") return undefined;
  const encoded = /filename\*=UTF-8''([^;]+)/i.exec(header);
  if (encoded) return decodeURIComponent(encoded[1]);
  return /filename="?([^";]+)"?/i.exec(header)?.[1];
}

function saveBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = Object.assign(document.createElement("a"), { href: url, download: fileName });
  link.click();
  // Revoke on the next tick so the browser has started the download.
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

/**
 * GETs a file and saves it with the server's file name (falls back to `fallbackName`).
 * With responseType "blob", error bodies arrive as a Blob too, so the JSON error is parsed
 * back into `response.data` and getApiErrorMessage shows the backend's message.
 */
export async function downloadFile(url: string, fallbackName: string, params?: Record<string, unknown>) {
  try {
    const response = await api.get<Blob>(url, { params, responseType: "blob" });
    saveBlob(response.data, fileNameFrom(response.headers["content-disposition"]) ?? fallbackName);
  } catch (error) {
    if (isAxiosError(error) && error.response?.data instanceof Blob) {
      try {
        error.response.data = JSON.parse(await error.response.data.text());
      } catch {
        // Not JSON; leave it and let the generic message show.
      }
    }
    throw error;
  }
}

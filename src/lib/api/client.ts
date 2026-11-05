import axios from "axios";

// Interceptors are attached separately (see ./interceptors.ts) to keep this
// module free of auth imports and avoid a client <-> auth store import cycle.
const baseURL = import.meta.env.API_BASE_URL;

if (!baseURL) {
  throw new Error("API_BASE_URL is not configured. Set it in the Vite environment.");
}

const api = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
});

export default api;

import axios from "axios";

// Interceptors are attached separately (see ./interceptors.ts) to keep this
// module free of auth imports and avoid a client <-> auth store import cycle.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { "Content-Type": "application/json" },
});

export default api;

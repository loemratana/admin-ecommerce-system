import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "swiper/swiper-bundle.css";
import "flatpickr/dist/flatpickr.css";
import App from "./App.tsx";
import { AppWrapper } from "./components/common/PageMeta.tsx";
import { ThemeProvider } from "./context/ThemeContext.tsx";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import api from "./lib/api/client.ts";
import { setupInterceptors } from "./lib/api/interceptors.ts";

setupInterceptors(api);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Serve cached data for 30s when moving between pages instead of refetching on every mount.
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AppWrapper>
          <App />
        </AppWrapper>
      </ThemeProvider>
    </QueryClientProvider>
  </StrictMode>,
);

// Hand off from the static loader in index.html once React has painted its first frame.
requestAnimationFrame(() => {
  const bootLoader = document.getElementById("boot-loader");
  if (!bootLoader) return;
  bootLoader.style.opacity = "0";
  bootLoader.addEventListener("transitionend", () => bootLoader.remove(), { once: true });
  window.setTimeout(() => bootLoader.remove(), 500);
});

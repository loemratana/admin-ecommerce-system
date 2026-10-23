import { cn } from "@/lib/utils";

export const BRAND_NAME = "OnlineShop";
export const BRAND_LOGO = "/images/logo/system-logo.png";

type AppLoaderProps = {
  message?: string;
  /** Cover the whole viewport (app start, auth check) or just fill the content area (page change). */
  fullScreen?: boolean;
};

export default function AppLoader({ message = "Loading…", fullScreen = true }: AppLoaderProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className={cn(
        "flex flex-col items-center justify-center px-4",
        fullScreen ? "fixed inset-0 z-[100] bg-gray-50 dark:bg-gray-900" : "min-h-[60vh]",
      )}
    >
      {/* Fades in after a short delay so fast loads don't flash the loader. */}
      <div className="flex animate-loader-in flex-col items-center motion-reduce:animate-none">
        <div className="relative flex h-28 w-28 items-center justify-center">
          <div className="absolute inset-3 animate-pulse rounded-full bg-brand-500/20 blur-xl motion-reduce:animate-none" aria-hidden="true" />
          <svg className="absolute inset-0 h-full w-full animate-spin [animation-duration:1.4s] motion-reduce:animate-none" viewBox="0 0 112 112" aria-hidden="true">
            <circle cx="56" cy="56" r="52" fill="none" strokeWidth="3" className="stroke-gray-200 dark:stroke-gray-800" />
            <circle cx="56" cy="56" r="52" fill="none" strokeWidth="3" strokeLinecap="round" strokeDasharray="80 247" className="stroke-brand-500" />
          </svg>
          <div className="relative flex h-16 w-16 animate-loader-breathe items-center justify-center rounded-2xl bg-white shadow-theme-md ring-1 ring-gray-200 motion-reduce:animate-none dark:bg-gray-800 dark:ring-gray-700">
            <img src={BRAND_LOGO} alt="" className="h-11 w-11 object-contain" />
          </div>
        </div>

        <p className="mt-6 text-lg font-bold tracking-tight text-gray-800 dark:text-white/90">{BRAND_NAME}</p>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{message}</p>

        <div className="mt-5 h-1 w-40 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-800" aria-hidden="true">
          <div className="h-full w-1/3 animate-loader-bar rounded-full bg-brand-500 motion-reduce:animate-none" />
        </div>
      </div>
    </div>
  );
}

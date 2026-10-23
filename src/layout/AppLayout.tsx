import { SidebarProvider, useSidebar } from "../context/SidebarContext";
import { Suspense, useEffect, useState } from "react";
import { Outlet } from "react-router";
import AppHeader from "./AppHeader";
import Backdrop from "./Backdrop";
import AppSidebar from "./AppSidebar";
import AppLoader from "../components/common/AppLoader";
import { usePublicSettings } from "@/features/settings/hooks/useSettings";
import { useCurrencyStore } from "@/lib/currency";

/**
 * Loads the store currency. Returns a number that changes when the currency the page was first
 * rendered with turns out to be out of date, so the page re-renders its prices.
 */
function useCurrencySync(): number {
  const { data } = usePublicSettings();
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    const { currency, setCurrency } = useCurrencyStore.getState();
    if (data?.currency && data.currency !== currency) {
      setCurrency(data.currency);
      setRevision((value) => value + 1);
    }
  }, [data?.currency]);
  return revision;
}

const LayoutContent: React.FC = () => {
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();
  const currencyRevision = useCurrencySync();

  return (
    <div className="min-h-screen xl:flex">
      <div>
        <AppSidebar />
        <Backdrop />
      </div>
      <div
        className={`flex-1 transition-all duration-300 ease-in-out ${
          isExpanded || isHovered ? "lg:ml-[290px]" : "lg:ml-[90px]"
        } ${isMobileOpen ? "ml-0" : ""}`}
      >
        <AppHeader />
        <div className="p-4 mx-auto max-w-(--breakpoint-2xl) md:p-6">
          <Suspense fallback={<AppLoader message="Loading page…" fullScreen={false} />}>
            <Outlet key={currencyRevision} />
          </Suspense>
        </div>
      </div>
    </div>
  );
};

const AppLayout: React.FC = () => {
  return (
    <SidebarProvider>
      <LayoutContent />
    </SidebarProvider>
  );
};

export default AppLayout;

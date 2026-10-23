import { useEffect } from "react";
import { Navigate, Outlet, useLocation } from "react-router";
import { useAuthStore } from "@/features/auth/store/auth.store";
import AppLoader from "@/components/common/AppLoader";

export default function ProtectedRoute() {
  const location = useLocation();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isSessionChecked = useAuthStore((state) => state.isSessionChecked);
  const loadCurrentSession = useAuthStore((state) => state.loadCurrentSession);

  useEffect(() => {
    if (isAuthenticated && !isSessionChecked) void loadCurrentSession();
  }, [isAuthenticated, isSessionChecked, loadCurrentSession]);

  if (isAuthenticated && !isSessionChecked) {
    return <AppLoader message="Checking your session…" />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}

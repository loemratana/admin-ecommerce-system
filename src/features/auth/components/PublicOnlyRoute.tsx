import { Navigate, Outlet } from "react-router";
import { useAuthStore } from "@/features/auth/store/auth.store";

export default function PublicOnlyRoute() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  return isAuthenticated ? <Navigate to="/" replace /> : <Outlet />;
}

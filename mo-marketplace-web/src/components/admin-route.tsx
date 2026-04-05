import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "../store/auth.store";

const ADMIN_ROLE = "admin";

export function AdminRoute() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);

  if (!accessToken) {
    return <Navigate to="/login" replace />;
  }

  if (!user) {
    return null;
  }

  if (user.role !== ADMIN_ROLE) {
    return <Navigate to="/products" replace />;
  }

  return <Outlet />;
}
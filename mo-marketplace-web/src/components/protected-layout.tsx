import { Outlet, useNavigate } from "react-router-dom";
import { logout as logoutApi } from "../api/auth.api";
import { useAuthStore } from "../store/auth.store";
import { ProtectedLayoutFooter } from "./protected-layout-footer";
import { ProtectedLayoutHeader } from "./protected-layout-header";

const ADMIN_ROLE = "admin";

export function ProtectedLayout() {
  const user = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.logout);
  const navigate = useNavigate();

  const navItems = [{ to: "/products", label: "Products" }];

  const handleLogout = async () => {
    try {
      await logoutApi();
    } finally {
      clearAuth();
      navigate("/login", { replace: true });
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-muted/20">
      <ProtectedLayoutHeader
        navItems={navItems}
        userEmail={user?.email}
        onLogout={handleLogout}
      />

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6">
        <Outlet />
      </main>

      <ProtectedLayoutFooter
        year={new Date().getFullYear()}
        brandName="MO Marketplace"
      />
    </div>
  );
}

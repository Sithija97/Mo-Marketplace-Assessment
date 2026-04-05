import { Button } from "@/components/ui/button";
import { logout as logoutApi } from "../api/auth.api";
import { useAuthStore } from "../store/auth.store";

export const ProductList = () => {
  const clearAuth = useAuthStore((s) => s.logout);

  const handleLogout = async () => {
    try {
      await logoutApi();
    } finally {
      clearAuth();
    }
  };

  return (
    <div className="flex h-full flex-col items-center justify-center">
      <div>product list</div>
      <Button onClick={handleLogout}>Logout</Button>
    </div>
  );
};

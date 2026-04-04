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
    <div>
      <button onClick={handleLogout} type="button">
        Logout
      </button>
      <div>product list</div>
    </div>
  );
};

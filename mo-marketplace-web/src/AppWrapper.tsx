import { useEffect, useState } from "react";
import { getMe } from "./api/auth.api";
import { useAuthStore } from "./store/auth.store";
import App from "./App";

export default function AppWrapper() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const setUser = useAuthStore((s) => s.setUser);
  const logout = useAuthStore((s) => s.logout);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!accessToken) {
      setLoading(false);
      return;
    }

    getMe()
      .then((res) => setUser(res.data))
      .catch(() => logout())
      .finally(() => setLoading(false));
  }, [accessToken, logout, setUser]);

  if (loading) return <div>Loading...</div>;

  return <App />;
}

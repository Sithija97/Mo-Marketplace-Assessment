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

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/20">
        <div className="flex items-center gap-3 rounded-lg border bg-background px-4 py-3 shadow-sm">
          <span className="size-4 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-foreground" />
          <span className="text-sm text-muted-foreground">Loading...</span>
        </div>
      </div>
    );
  }

  return <App />;
}

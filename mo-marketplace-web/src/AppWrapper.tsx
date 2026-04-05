import { useEffect } from "react";
import { getMe } from "./api/auth.api";
import { useAuthStore } from "./store/auth.store";
import App from "./App";

export default function AppWrapper() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const logout = useAuthStore((s) => s.logout);

  useEffect(() => {
    if (!accessToken || user) {
      return;
    }

    getMe()
      .then((res) => setUser(res.data))
      .catch(() => logout());
  }, [accessToken, logout, setUser, user]);

  const loading = Boolean(accessToken) && !user;

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

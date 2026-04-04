import { useEffect } from "react";
import { getMe } from "../api/auth.api";
import { useAuthStore } from "../store/auth.store";

export const Profile = () => {
  const setUser = useAuthStore((s) => s.setUser);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    getMe().then((res) => setUser(res.data));
  }, []);

  return <div>{user?.email}</div>;
};

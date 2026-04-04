import type { IUser } from "@/models";
import { create } from "zustand";
import { devtools } from "zustand/middleware";

type AuthState = {
  accessToken: string | null;
  user: IUser | null;

  setAccessToken: (token: string) => void;
  setUser: (user: IUser) => void;
  logout: () => void;
};

export const useAuthStore = create<AuthState>()(
  devtools(
    (set) => ({
      accessToken: localStorage.getItem("accessToken"),
      user: null,

      setAccessToken: (token) => {
        localStorage.setItem("accessToken", token);
        set({ accessToken: token }, false, "setAccessToken");
      },

      setUser: (user) => set({ user }, false, "setUser"),

      logout: () => {
        localStorage.removeItem("accessToken");
        set({ accessToken: null, user: null }, false, "logout");
      },
    }),
    {
      name: "authentication",
      store: "authentication",
      enabled: true,
    },
  ),
);

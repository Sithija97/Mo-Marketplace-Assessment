import { create } from "zustand";

type AuthState = {
  accessToken: string | null;
  user: any | null;

  setAccessToken: (token: string) => void;
  setUser: (user: any) => void;
  logout: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: localStorage.getItem("accessToken"),
  user: null,

  setAccessToken: (token) => {
    localStorage.setItem("accessToken", token);
    set({ accessToken: token });
  },

  setUser: (user) => set({ user }),

  logout: () => {
    localStorage.removeItem("accessToken");
    set({ accessToken: null, user: null });
  },
}));

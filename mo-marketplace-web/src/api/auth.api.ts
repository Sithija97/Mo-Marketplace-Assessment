import api from "./client";

export const register = (data: { email: string; password: string }) =>
  api.post("/auth/register", data);

export const login = (data: { email: string; password: string }) =>
  api.post("/auth/login", data);

export const getMe = () => api.get("/auth/me");

export const logout = () => api.post("/auth/logout");

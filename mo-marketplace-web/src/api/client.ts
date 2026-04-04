import axios from "axios";
import { useAuthStore } from "../store/auth.store";

const API_BASE_URL =
  import.meta.env.VITE_API_URL ?? "http://localhost:3000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // VERY IMPORTANT (for cookies)
});

// Attach access token
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// Handle refresh automatically
let isRefreshing = false;
let queue: any[] = [];

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config;
    const requestUrl = originalRequest?.url ?? "";
    const isAuthEndpoint =
      typeof requestUrl === "string" &&
      ["/auth/login", "/auth/register", "/auth/refresh", "/auth/logout"].some(
        (endpoint) => requestUrl.includes(endpoint),
      );
    const hasToken = Boolean(useAuthStore.getState().accessToken);

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !isAuthEndpoint &&
      hasToken
    ) {
      originalRequest._retry = true;

      if (isRefreshing) {
        return new Promise((resolve) => {
          queue.push((token: string) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(api(originalRequest));
          });
        });
      }

      isRefreshing = true;

      try {
        const refreshUrl = `${API_BASE_URL}/auth/refresh`;
        const res = await axios.post(refreshUrl, {}, { withCredentials: true });

        const newToken = res.data.accessToken;

        useAuthStore.getState().setAccessToken(newToken);

        queue.forEach((cb) => cb(newToken));
        queue = [];

        return api(originalRequest);
      } catch (err) {
        useAuthStore.getState().logout();
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

export default api;

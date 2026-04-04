import { isAxiosError } from "axios";

type ApiErrorResponse = {
  message?: string | string[];
};

export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (!isAxiosError<ApiErrorResponse>(error)) {
    return fallback;
  }

  const apiMessage = error.response?.data?.message;

  if (typeof apiMessage === "string") {
    return apiMessage;
  }

  if (Array.isArray(apiMessage) && apiMessage.length > 0) {
    return apiMessage[0] ?? fallback;
  }

  return fallback;
}

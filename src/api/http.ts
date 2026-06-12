import { buildApiUrl } from "./config";
import { useAuthStore } from "../store/authStore";

type ApiRequestOptions = {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined>;
};

type ErrorBody = {
  title?: string;
  detail?: string;
  message?: string;
};

export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

const isErrorBody = (value: unknown): value is ErrorBody => {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.title === "string" ||
    typeof candidate.detail === "string" ||
    typeof candidate.message === "string"
  );
};

const readErrorMessage = async (response: Response) => {
  try {
    const body: unknown = await response.json();
    if (isErrorBody(body)) {
      return body.title ?? body.detail ?? body.message ?? "Request failed";
    }
  } catch {
    // Keep the fallback when the backend response is not JSON.
  }

  return "Request failed";
};

const redirectToLogin = () => {
  const currentPath = `${window.location.pathname}${window.location.search}`;
  if (window.location.pathname === "/login" || window.location.pathname === "/register") {
    return;
  }

  window.location.assign(`/login?redirect=${encodeURIComponent(currentPath)}`);
};

export const apiRequest = async <T>(path: string, options: ApiRequestOptions = {}) => {
  const token = useAuthStore.getState().token;
  const headers = new Headers();

  if (options.body !== undefined) {
    headers.set("Content-Type", "application/json");
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(buildApiUrl(path, options.query), {
    method: options.method ?? "GET",
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });

  if (response.status === 401) {
    useAuthStore.getState().clearSession();
    redirectToLogin();
    throw new ApiError(401, "Your session has expired. Please log in again.");
  }

  if (!response.ok) {
    throw new ApiError(response.status, await readErrorMessage(response));
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();
  return (text ? JSON.parse(text) : undefined) as T;
};

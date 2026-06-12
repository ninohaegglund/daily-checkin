import { buildApiUrl } from "./config";

export type AuthUser = {
  id: string;
  email: string;
  displayName?: string | null;
};

export type AuthResponse = {
  token: string;
  expiresAtUtc: string;
  user: AuthUser;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type RegisterRequest = LoginRequest & {
  displayName?: string;
};

type ErrorBody = {
  title?: string;
  detail?: string;
  message?: string;
};

const isErrorBody = (value: unknown): value is ErrorBody => {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.title === "string" ||
    typeof candidate.detail === "string" ||
    typeof candidate.message === "string"
  );
};

const readErrorMessage = async (response: Response, fallback: string) => {
  try {
    const body: unknown = await response.json();
    if (isErrorBody(body)) {
      return body.title ?? body.detail ?? body.message ?? fallback;
    }
  } catch {
    // Keep the fallback when the backend response is not JSON.
  }

  return fallback;
};

const postAuth = async (path: "/api/auth/login" | "/api/auth/register", body: LoginRequest | RegisterRequest) => {
  const response = await fetch(buildApiUrl(path), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response, "Authentication failed"));
  }

  return (await response.json()) as AuthResponse;
};

export const loginRequest = (body: LoginRequest) => postAuth("/api/auth/login", body);

export const registerRequest = (body: RegisterRequest) =>
  postAuth("/api/auth/register", body);

export const getCurrentUserRequest = async (token: string) => {
  const response = await fetch(buildApiUrl("/api/auth/me"), {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response, "Could not restore session"));
  }

  return (await response.json()) as AuthUser;
};

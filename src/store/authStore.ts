import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
  getCurrentUserRequest,
  loginRequest,
  registerRequest,
  type AuthUser,
  type LoginRequest,
  type RegisterRequest,
} from "../api/auth";

type AuthStatus = "checking" | "authenticated" | "unauthenticated";

type AuthState = {
  token: string | null;
  expiresAtUtc: string | null;
  user: AuthUser | null;
  status: AuthStatus;
  error: string | null;
  login: (request: LoginRequest) => Promise<void>;
  register: (request: RegisterRequest) => Promise<void>;
  restoreSession: () => Promise<void>;
  logout: () => void;
  clearSession: () => void;
};

const isExpired = (expiresAtUtc: string | null) => {
  if (!expiresAtUtc) return false;
  return new Date(expiresAtUtc).getTime() <= Date.now();
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      expiresAtUtc: null,
      user: null,
      status: "checking",
      error: null,

      login: async (request) => {
        set({ status: "checking", error: null });
        try {
          const session = await loginRequest(request);
          set({
            token: session.token,
            expiresAtUtc: session.expiresAtUtc,
            user: session.user,
            status: "authenticated",
            error: null,
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : "Could not log in";
          set({ status: "unauthenticated", error: message });
          throw error;
        }
      },

      register: async (request) => {
        set({ status: "checking", error: null });
        try {
          const session = await registerRequest(request);
          set({
            token: session.token,
            expiresAtUtc: session.expiresAtUtc,
            user: session.user,
            status: "authenticated",
            error: null,
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : "Could not register";
          set({ status: "unauthenticated", error: message });
          throw error;
        }
      },

      restoreSession: async () => {
        const { token, expiresAtUtc } = get();

        if (!token || isExpired(expiresAtUtc)) {
          get().clearSession();
          return;
        }

        set({ status: "checking", error: null });
        try {
          const user = await getCurrentUserRequest(token);
          set({ user, status: "authenticated", error: null });
        } catch {
          get().clearSession();
        }
      },

      logout: () => {
        get().clearSession();
      },

      clearSession: () => {
        set({
          token: null,
          expiresAtUtc: null,
          user: null,
          status: "unauthenticated",
          error: null,
        });
      },
    }),
    {
      name: "daily-checkin-auth",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        token: state.token,
        expiresAtUtc: state.expiresAtUtc,
        user: state.user,
      }),
    }
  )
);

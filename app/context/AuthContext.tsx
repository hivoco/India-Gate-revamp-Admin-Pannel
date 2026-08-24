"use client";

import {
  createContext,
  useContext,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import {
  subscribeAuthStore,
  getAuthToken,
  getStoredUser,
  getServerSnapshot,
  setAuthToken,
  setStoredUser,
  clearAuth,
  type StoredUser,
} from "@/app/lib/utils/auth-store";

interface AuthContextType {
  token: string | null;
  user: StoredUser | null;
  isAuthenticated: boolean;
  setToken: (token: string | null) => void;
  setUser: (user: StoredUser | null) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const token = useSyncExternalStore(
    subscribeAuthStore,
    getAuthToken,
    getServerSnapshot,
  );

  const user = useSyncExternalStore(
    subscribeAuthStore,
    getStoredUser,
    getServerSnapshot,
  );

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        isAuthenticated: !!token,
        setToken: setAuthToken,
        setUser: setStoredUser,
        logout: clearAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
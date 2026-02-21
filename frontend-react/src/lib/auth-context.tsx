import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { User } from "./types";

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  refresh: () => Promise<void>;
  clearAuth: () => void;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  refresh: async () => {},
  clearAuth: () => {},
});

// DEV ONLY: set to true to bypass backend auth — revert before production
const DEV_BYPASS_AUTH = true;
const DEV_MOCK_USER: User = { id: 0, username: "dev_user", email: "dev@localhost", first_name: "Dev", last_name: "User", full_name: "Dev User" };

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(DEV_BYPASS_AUTH ? DEV_MOCK_USER : null);
  const [isLoading, setIsLoading] = useState(!DEV_BYPASS_AUTH);

  const fetchCurrentUser = useCallback(async () => {
    // DEV ONLY: skip API call when bypass is active
    if (DEV_BYPASS_AUTH) return;
    try {
      const res = await fetch("/api/auth/me/", {
        credentials: "include",
        redirect: "manual", // prevent following Django's 302→login redirect loops
      });
      // opaqueredirect means Django returned a redirect (user not authenticated)
      if (res.type === "opaqueredirect" || res.status === 302 || res.status === 301) {
        setUser(null);
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setUser(data);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: user !== null,
        refresh: fetchCurrentUser,
        clearAuth: () => setUser(null),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

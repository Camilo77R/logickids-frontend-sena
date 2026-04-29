import { useEffect, useMemo, useState } from "react";
import authService from "../services/authService";
import { clearStoredSession, getStoredSession, saveStoredSession } from "../utils/sessionStorage";
import { getHomePathByRole } from "../utils/paths";
import { AuthContext } from "./auth-context";

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => getStoredSession());
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  useEffect(() => {
    const verifySession = async () => {
      const storedSession = getStoredSession();

      if (!storedSession?.token) {
        setIsBootstrapping(false);
        return;
      }

      try {
        const profile = await authService.getProfile();
        const nextSession = {
          token: storedSession.token,
          user: profile,
        };

        saveStoredSession(nextSession);
        setSession(nextSession);
      } catch {
        clearStoredSession();
        setSession(null);
      } finally {
        setIsBootstrapping(false);
      }
    };

    const syncExpiredSession = () => {
      setSession(null);
    };

    verifySession();
    window.addEventListener("lk:session-expired", syncExpiredSession);

    return () => {
      window.removeEventListener("lk:session-expired", syncExpiredSession);
    };
  }, []);

  const signIn = async (credentials) => {
    const nextSession = await authService.login(credentials);
    saveStoredSession(nextSession);
    setSession(nextSession);
    return nextSession.user;
  };

  const signOut = () => {
    clearStoredSession();
    setSession(null);
  };

  const value = useMemo(
    () => ({
      user: session?.user ?? null,
      token: session?.token ?? null,
      isAuthenticated: Boolean(session?.token && session?.user),
      isBootstrapping,
      homePath: getHomePathByRole(session?.user?.rol),
      signIn,
      signOut,
    }),
    [isBootstrapping, session]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

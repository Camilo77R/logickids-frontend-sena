import { useEffect, useMemo, useState } from "react";
import authService from "../services/authService";
import { isSessionExpirationError } from "../services/httpClient";
import { clearStoredSession, getStoredSession, saveStoredSession } from "../utils/sessionStorage";
import { getHomePathByRole } from "../utils/paths";
import { AuthContext } from "./auth-context";

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => getStoredSession());
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  const syncSession = (user, token = session?.token ?? getStoredSession()?.token ?? null) => {
    if (!token || !user) {
      clearStoredSession();
      setSession(null);
      return null;
    }

    const nextSession = { token, user };
    saveStoredSession(nextSession);
    setSession(nextSession);
    return nextSession;
  };

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
      } catch (error) {
        if (isSessionExpirationError(error)) {
          clearStoredSession();
          setSession(null);
        } else {
          setSession(storedSession);
        }
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

  // ========== TUS FUNCIONES (HEAD) ==========
  const refreshProfile = async () => {
    const profile = await authService.getProfile();
    syncSession(profile);
    return profile;
  };

  const updateProfile = async (profileData) => {
    const profile = await authService.updateProfile(profileData);
    syncSession(profile);
    return profile;
  };

  const changePassword = async (passwordData) => authService.changePassword(passwordData);

  // ========== FUNCIÓN DE DEVELOP ==========
  const updateUser = (updatedUserData) => {
    setSession(prev => {
      if (!prev) return prev;
      const updatedSession = {
        ...prev,
        user: { ...prev.user, ...updatedUserData }
      };
      saveStoredSession(updatedSession);
      return updatedSession;
    });
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
      refreshProfile,
      updateProfile,
      changePassword,
      updateUser,
    }),
    [isBootstrapping, session]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

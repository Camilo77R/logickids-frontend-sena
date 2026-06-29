const SESSION_STORAGE_KEY = "lk_web_session";

const parseSession = (value) => {
  if (!value) return null;

  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

const getSessionStore = () =>
  typeof window === "undefined" ? null : window.sessionStorage;

export const getStoredSession = () =>
  parseSession(getSessionStore()?.getItem(SESSION_STORAGE_KEY));

export const saveStoredSession = (session) => {
  getSessionStore()?.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
};

export const clearStoredSession = () => {
  getSessionStore()?.removeItem(SESSION_STORAGE_KEY);
};

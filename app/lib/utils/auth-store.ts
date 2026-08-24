export const TOKEN_KEY = "access_token";
export const USER_KEY = "user";
export const AUTH_EVENT = "uplife-auth-change";

export interface StoredUser {
  id: number;
  email: string;
  role: "superadmin" | "admin";
  // null means every section, which is a superadmin or an admin created
  // before per section access existed
  permissions?: string[] | null;
}

export const subscribeAuthStore = (callback: () => void) => {
  window.addEventListener("storage", callback);
  window.addEventListener(AUTH_EVENT, callback);

  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(AUTH_EVENT, callback);
  };
};

export const getAuthToken = () => localStorage.getItem(TOKEN_KEY);

let cachedUserRaw: string | null = null;
let cachedUser: StoredUser | null = null;

export const getStoredUser = () => {
  const raw = localStorage.getItem(USER_KEY);

  if (raw === cachedUserRaw) return cachedUser;

  cachedUserRaw = raw;

  try {
    cachedUser = raw ? (JSON.parse(raw) as StoredUser) : null;
  } catch {
    cachedUser = null;
  }

  return cachedUser;
};

export const getServerSnapshot = () => null;

const notifyAuthChange = () => {
  window.dispatchEvent(new Event(AUTH_EVENT));
};

export const setAuthToken = (token: string | null) => {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }

  notifyAuthChange();
};

export const setStoredUser = (user: StoredUser | null) => {
  if (user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(USER_KEY);
  }

  notifyAuthChange();
};

export const clearAuth = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  notifyAuthChange();
};
import { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import { api, clearAuthStorage } from '../api/client';

const TOKEN_KEY = 'medicare_auth_token';
const USER_KEY = 'medicare_auth_user';

const AuthContext = createContext(null);

function loadStored() {
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    const user = JSON.parse(localStorage.getItem(USER_KEY) || 'null');
    return token && user ? { token, user } : { token: null, user: null };
  } catch {
    return { token: null, user: null };
  }
}

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(loadStored);
  const [sessionChecked, setSessionChecked] = useState(() => !loadStored().token);

  useEffect(() => {
    if (!auth.token) {
      setSessionChecked(true);
      return;
    }
    api
      .getMe()
      .then(({ user }) => {
        localStorage.setItem(USER_KEY, JSON.stringify(user));
        setAuth((prev) => ({ ...prev, user }));
      })
      .catch(() => {
        clearAuthStorage();
        setAuth({ token: null, user: null });
      })
      .finally(() => setSessionChecked(true));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps — run once on mount

  const login = useCallback((token, user) => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    setAuth({ token, user });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setAuth({ token: null, user: null });
  }, []);

  const value = useMemo(
    () => ({
      token: auth.token,
      user: auth.user,
      sessionChecked,
      isAuthenticated: Boolean(auth.token && auth.user),
      isAdmin: auth.user?.role === 'admin',
      isGuest: auth.user?.role === 'guest',
      canEdit: auth.user?.role === 'admin',
      login,
      logout,
    }),
    [auth, login, logout, sessionChecked]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export function getAuthToken() {
  return localStorage.getItem(TOKEN_KEY);
}

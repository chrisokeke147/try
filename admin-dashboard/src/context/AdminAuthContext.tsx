import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { API_BASE_URL } from '../config/api';

const TOKEN_KEY = 'try_admin_token';

interface AdminAuthValue {
  token: string | null;
  email: string | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AdminAuthContext = createContext<AdminAuthValue | undefined>(undefined);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [email, setEmail] = useState<string | null>(() => localStorage.getItem(`${TOKEN_KEY}_email`));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = useCallback(async (loginEmail: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/admin-auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? 'Login failed');
      localStorage.setItem(TOKEN_KEY, data.accessToken);
      localStorage.setItem(`${TOKEN_KEY}_email`, data.email);
      setToken(data.accessToken);
      setEmail(data.email);
      return true;
    } catch (e: any) {
      setError(e.message ?? 'Login failed');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(`${TOKEN_KEY}_email`);
    setToken(null);
    setEmail(null);
  }, []);

  // Any 401 from the API (expired/invalid session) should bounce back to login.
  useEffect(() => {
    const handler = () => logout();
    window.addEventListener('admin-unauthorized', handler);
    return () => window.removeEventListener('admin-unauthorized', handler);
  }, [logout]);

  const value = useMemo(() => ({ token, email, loading, error, login, logout }), [token, email, loading, error, login, logout]);

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error('useAdminAuth must be used within AdminAuthProvider');
  return ctx;
}

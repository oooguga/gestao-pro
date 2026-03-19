import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiFetch, setAccessToken, setLogoutCallback } from '../services/api';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

// Decodifica payload do JWT sem biblioteca
function decodeJwtPayload(token) {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch {
    return {};
  }
}

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isInitializing,  setIsInitializing]  = useState(true);
  const [user,            setUser]            = useState(null);

  // ─── Logout ───────────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    try {
      await apiFetch('/api/auth/logout', { method: 'POST' });
    } catch { /* ignora erro no logout */ }
    setAccessToken(null);
    setIsAuthenticated(false);
    setUser(null);
  }, []);

  // Registra callback para que api.js possa deslogar em 401 irrecuperável
  useEffect(() => {
    setLogoutCallback(logout);
  }, [logout]);

  // ─── Refresh silencioso na inicialização ──────────────────────────────────
  // Verifica se há um cookie refreshToken válido para restaurar a sessão
  // sem pedir login novamente ao usuário.
  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL ?? ''}/api/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    })
      .then((r) => r.ok ? r.json() : Promise.reject())
      .then(({ accessToken }) => {
        setAccessToken(accessToken);
        const payload = decodeJwtPayload(accessToken);
        setUser({ id: payload.sub, role: payload.role });
        setIsAuthenticated(true);
      })
      .catch(() => { /* sem sessão prévia — mostra login */ })
      .finally(() => setIsInitializing(false));
  }, []);

  // ─── Login ────────────────────────────────────────────────────────────────
  const login = useCallback(async (email, senha) => {
    const { accessToken } = await apiFetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, senha }),
    });
    setAccessToken(accessToken);
    const payload = decodeJwtPayload(accessToken);
    setUser({ id: payload.sub, role: payload.role });
    setIsAuthenticated(true);
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, isInitializing, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// ─── Cliente HTTP base — GestãoPro ───────────────────────────────────────────
// O accessToken fica em variável de módulo (memória), nunca no localStorage.
// Isso evita XSS que leia o token. Ao recarregar a página, AuthContext
// faz um refresh silencioso via cookie httpOnly para restaurar a sessão.

const BASE = import.meta.env.VITE_API_URL ?? '';

// ─── Token em memória ─────────────────────────────────────────────────────────
let _accessToken = null;
export const setAccessToken  = (t)  => { _accessToken = t; };
export const getAccessToken  = ()   => _accessToken;

// ─── Callback de logout injetado pelo AuthContext ─────────────────────────────
// Evita dependência circular: api.js não importa AuthContext.
let _onLogout = null;
export const setLogoutCallback = (fn) => { _onLogout = fn; };

// ─── Flag anti-cascata de refresh ─────────────────────────────────────────────
// Se 5 requisições paralelas receberem 401, só dispara 1 refresh.
let _refreshPromise = null;

async function doRefresh() {
  if (_refreshPromise) return _refreshPromise;
  _refreshPromise = fetch(`${BASE}/api/auth/refresh`, {
    method: 'POST',
    credentials: 'include', // envia o cookie httpOnly refreshToken automaticamente
  })
    .then((r) => {
      if (!r.ok) throw new Error('refresh_failed');
      return r.json();
    })
    .then(({ accessToken }) => {
      setAccessToken(accessToken);
      return accessToken;
    })
    .finally(() => { _refreshPromise = null; });
  return _refreshPromise;
}

// ─── Função principal de fetch ────────────────────────────────────────────────
export async function apiFetch(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  if (_accessToken) headers['Authorization'] = `Bearer ${_accessToken}`;

  const res = await fetch(`${BASE}${path}`, {
    ...options,
    credentials: 'include',
    headers,
  });

  // ─── Sucesso ──────────────────────────────────────────────────────────────
  if (res.ok) {
    if (res.status === 204) return null;
    return res.json();
  }

  // ─── Token expirado: tenta refresh uma vez ────────────────────────────────
  if (res.status === 401) {
    try {
      await doRefresh();
      // Retenta com novo token
      const headers2 = { ...headers, Authorization: `Bearer ${_accessToken}` };
      const res2 = await fetch(`${BASE}${path}`, {
        ...options,
        credentials: 'include',
        headers: headers2,
      });
      if (res2.ok) {
        if (res2.status === 204) return null;
        return res2.json();
      }
      throw new Error('unauthorized');
    } catch {
      _onLogout?.();
      throw new Error('Sessão expirada. Faça login novamente.');
    }
  }

  // ─── Outros erros ─────────────────────────────────────────────────────────
  const err = await res.json().catch(() => ({ message: 'Erro desconhecido.' }));
  throw new Error(err.message || `Erro ${res.status}`);
}

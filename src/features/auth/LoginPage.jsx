// ─── LoginPage.jsx ─────────────────────────────────────────────────────────────
// Tela de login — mesmo visual dark/light do restante do app.
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import theme from '../../theme';

export default function LoginPage({ isDark = true }) {
  const { login } = useAuth();
  const [email,   setEmail]   = useState('');
  const [senha,   setSenha]   = useState('');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !senha) { setError('Preencha e-mail e senha.'); return; }
    setLoading(true);
    setError('');
    try {
      await login(email, senha);
    } catch (err) {
      setError(err.message || 'Credenciais inválidas.');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%', boxSizing: 'border-box',
    background: theme.bgInput(isDark),
    border: `1px solid ${theme.border(isDark)}`,
    borderRadius: 8, padding: '10px 14px',
    fontSize: 14, color: theme.txtPrimary(isDark),
    outline: 'none', transition: 'border-color .15s',
    fontFamily: "inherit",
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: theme.bgPage(isDark),
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        padding: '16px',
      }}
    >
      <div style={{ width: '100%', maxWidth: 380 }}>

        {/* ── Brand logos ─────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 32 }}>
          <img src="/carraro.png" alt="Companhia Carraro" style={{ height: 22, width: 'auto', borderRadius: 3 }} />
          <span style={{ fontSize: 10, color: '#888', opacity: 0.4, lineHeight: 1 }}>×</span>
          <div style={{ background: '#000', borderRadius: 3, height: 22, padding: '0 9px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: '#fff', fontWeight: 900, fontSize: 10, letterSpacing: '0.06em', lineHeight: 1, userSelect: 'none' }}>DUCOR</span>
          </div>
        </div>

        {/* ── Card ────────────────────────────────────────────────────────── */}
        <div
          style={{
            background: theme.bgCard(isDark),
            border: `1px solid ${theme.border(isDark)}`,
            borderRadius: 16, padding: '32px 28px',
            boxShadow: isDark ? '0 8px 40px rgba(0,0,0,0.4)' : '0 8px 40px rgba(0,0,0,0.08)',
          }}
        >
          <h1 style={{ fontSize: 22, fontWeight: 800, color: theme.txtPrimary(isDark), margin: '0 0 4px', letterSpacing: '-0.02em' }}>
            Entrar
          </h1>
          <p style={{ fontSize: 13, color: theme.txtMuted(isDark), margin: '0 0 28px' }}>
            GestãoPro — Sistema de Produção
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: theme.txtSecondary(isDark), marginBottom: 6, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                E-mail
              </label>
              <input
                type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com" autoComplete="email" autoFocus
                style={inputStyle}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: theme.txtSecondary(isDark), marginBottom: 6, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                Senha
              </label>
              <input
                type="password" value={senha} onChange={(e) => setSenha(e.target.value)}
                placeholder="••••••••" autoComplete="current-password"
                style={inputStyle}
              />
            </div>

            {/* Mensagem de erro */}
            {error && (
              <div style={{ fontSize: 13, color: theme.red, background: `${theme.red}18`, border: `1px solid ${theme.red}44`, borderRadius: 8, padding: '10px 14px' }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', padding: '12px',
                background: loading ? theme.accentDim : theme.accent,
                color: theme.accentText,
                border: 'none', borderRadius: 8,
                fontSize: 14, fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'background .15s', marginTop: 4,
                fontFamily: 'inherit',
              }}
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>

          </form>
        </div>

        <p style={{ textAlign: 'center', fontSize: 11, color: theme.txtMuted(isDark), marginTop: 20 }}>
          GestãoPro v2.0 — Ducor × Companhia Carraro
        </p>
      </div>
    </div>
  );
}

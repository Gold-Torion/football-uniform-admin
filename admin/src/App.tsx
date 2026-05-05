import React, { useState } from 'react';
import { api } from './api.ts';
import { Layout } from './components/Layout.tsx';
import { Dashboard } from './pages/Dashboard.tsx';
import { Users } from './pages/Users.tsx';
import { Listings } from './pages/Listings.tsx';
import { Reports } from './pages/Reports.tsx';
import { Orders } from './pages/Orders.tsx';

type Page = 'dashboard' | 'users' | 'listings' | 'reports' | 'orders';

export default function App() {
  const [secret,   setSecret]   = useState('');
  const [authed,   setAuthed]   = useState(false);
  const [page,     setPage]     = useState<Page>('dashboard');
  const [loading,  setLoading]  = useState(false);
  const [loginErr, setLoginErr] = useState('');

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!secret.trim()) return;
    setLoading(true);
    setLoginErr('');
    try {
      const res = await fetch(
        `${(import.meta as { env: Record<string,string> }).env.VITE_API_URL ?? 'http://localhost:3000'}/admin/stats`,
        { headers: { 'x-admin-secret': secret } },
      );
      if (res.status === 403 || res.status === 401) {
        setLoginErr('Chave de acesso inválida.');
        return;
      }
      if (!res.ok) {
        setLoginErr('Erro ao conectar ao servidor. Verifique a URL da API.');
        return;
      }
      setAuthed(true);
    } catch {
      setLoginErr('Não foi possível conectar ao servidor.');
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    setAuthed(false);
    setSecret('');
    setPage('dashboard');
    setLoginErr('');
  }

  // ── Login screen ──────────────────────────────────────────────────────────

  if (!authed) {
    return (
      <div
        style={{
          minHeight:      '100vh',
          background:     'linear-gradient(135deg, #1C2B1D 0%, #0F1A10 60%, #1C2B1D 100%)',
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
          padding:        '20px',
        }}
      >
        {/* Decorative blobs */}
        <div
          style={{
            position:     'fixed',
            top:          '-120px',
            right:        '-120px',
            width:        '400px',
            height:       '400px',
            borderRadius: '50%',
            background:   'radial-gradient(circle, rgba(212,175,55,0.08) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position:     'fixed',
            bottom:       '-80px',
            left:         '-80px',
            width:        '300px',
            height:       '300px',
            borderRadius: '50%',
            background:   'radial-gradient(circle, rgba(51,83,54,0.4) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        {/* Login card */}
        <div
          style={{
            background:   'rgba(255,255,255,0.03)',
            border:       '1px solid rgba(212,175,55,0.25)',
            borderRadius: '20px',
            padding:      '48px 44px',
            width:        '100%',
            maxWidth:     '420px',
            backdropFilter: 'blur(12px)',
            boxShadow:    '0 24px 80px rgba(0,0,0,0.4)',
            position:     'relative',
          }}
        >
          {/* Logo */}
          <div style={{ textAlign: 'center', marginBottom: '36px' }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>⚽</div>
            <h1
              style={{
                fontSize:      '26px',
                fontWeight:    700,
                color:         '#D4AF37',
                letterSpacing: '-0.02em',
                marginBottom:  '6px',
              }}
            >
              Arena dos Mantos
            </h1>
            <p style={{ fontSize: '13px', color: '#5A7A5C', fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              Painel Administrativo
            </p>
          </div>

          {/* Divider */}
          <div style={{ height: '1px', background: 'linear-gradient(90deg, transparent, rgba(212,175,55,0.3), transparent)', marginBottom: '32px' }} />

          <form onSubmit={e => void handleLogin(e)}>
            <div style={{ marginBottom: '20px' }}>
              <label
                style={{
                  display:     'block',
                  fontSize:    '12px',
                  fontWeight:  600,
                  color:       '#5A7A5C',
                  marginBottom: '8px',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                }}
              >
                Chave de Acesso
              </label>
              <input
                type="password"
                value={secret}
                onChange={e => setSecret(e.target.value)}
                placeholder="••••••••••••"
                autoFocus
                style={{
                  width:        '100%',
                  padding:      '13px 16px',
                  borderRadius: '10px',
                  border:       loginErr ? '1.5px solid #B91C1C' : '1.5px solid rgba(212,175,55,0.2)',
                  background:   'rgba(255,255,255,0.05)',
                  color:        '#FFFFFF',
                  fontSize:     '16px',
                  letterSpacing: '0.15em',
                  outline:      'none',
                  transition:   'border 0.2s',
                }}
                onFocus={e => { (e.target as HTMLInputElement).style.border = '1.5px solid rgba(212,175,55,0.6)'; }}
                onBlur={e => { (e.target as HTMLInputElement).style.border = loginErr ? '1.5px solid #B91C1C' : '1.5px solid rgba(212,175,55,0.2)'; }}
              />
            </div>

            {loginErr && (
              <div
                style={{
                  background:   'rgba(185,28,28,0.15)',
                  border:       '1px solid rgba(185,28,28,0.4)',
                  color:        '#FCA5A5',
                  borderRadius: '8px',
                  padding:      '10px 14px',
                  fontSize:     '13px',
                  marginBottom: '16px',
                }}
              >
                {loginErr}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !secret.trim()}
              style={{
                width:        '100%',
                padding:      '13px',
                borderRadius: '10px',
                border:       'none',
                background:   loading || !secret.trim()
                  ? 'rgba(212,175,55,0.3)'
                  : 'linear-gradient(135deg, #D4AF37 0%, #B8962B 100%)',
                color:        loading || !secret.trim() ? 'rgba(255,255,255,0.4)' : '#1C2B1D',
                fontSize:     '15px',
                fontWeight:   700,
                cursor:       loading || !secret.trim() ? 'not-allowed' : 'pointer',
                letterSpacing: '0.04em',
                transition:   'all 0.2s',
                boxShadow:    loading || !secret.trim() ? 'none' : '0 4px 16px rgba(212,175,55,0.35)',
              }}
            >
              {loading ? 'Verificando…' : 'Entrar'}
            </button>
          </form>

          {/* Footer */}
          <div style={{ textAlign: 'center', marginTop: '28px', fontSize: '11px', color: '#3A5A3C' }}>
            Arena dos Mantos © 2026
          </div>
        </div>
      </div>
    );
  }

  // ── Authenticated layout ───────────────────────────────────────────────────

  function renderPage() {
    switch (page) {
      case 'dashboard': return <Dashboard secret={secret} />;
      case 'users':     return <Users     secret={secret} />;
      case 'listings':  return <Listings  secret={secret} />;
      case 'reports':   return <Reports   secret={secret} />;
      case 'orders':    return <Orders    secret={secret} />;
      default:          return <Dashboard secret={secret} />;
    }
  }

  return (
    <Layout
      page={page}
      onNavigate={p => setPage(p as Page)}
      onLogout={handleLogout}
      secret={secret}
    >
      {renderPage()}
    </Layout>
  );
}

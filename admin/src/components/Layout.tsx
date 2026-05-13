import React, { useState, useEffect } from 'react';

interface NavItem {
  id:    string;
  icon:  string;
  label: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', icon: '📊', label: 'Dashboard'   },
  { id: 'users',     icon: '👥', label: 'Usuários'    },
  { id: 'listings',  icon: '👕', label: 'Anúncios'    },
  { id: 'mpc',       icon: '⭐', label: 'MPC'         },
  { id: 'reports',   icon: '🚩', label: 'Denúncias'   },
  { id: 'orders',    icon: '📦', label: 'Pedidos'     },
  { id: 'coupons',   icon: '🎟', label: 'Cupons'      },
  { id: 'quiz',               icon: '❓', label: 'Quiz'        },
  { id: 'developer-earnings', icon: '💰', label: 'Dev Earnings' },
];

const PAGE_TITLES: Record<string, string> = {
  dashboard: 'Dashboard',
  users:     'Usuários',
  listings:  'Anúncios',
  mpc:       'Minha Primeira Camisa',
  reports:   'Denúncias',
  orders:    'Pedidos',
  coupons:   'Cupons',
  quiz:               'Quiz',
  'developer-earnings': 'Developer Earnings',
};

interface LayoutProps {
  page:       string;
  onNavigate: (page: string) => void;
  onLogout:   () => void;
  secret:     string;
  children:   React.ReactNode;
}

export function Layout({ page, onNavigate, onLogout, secret, children }: LayoutProps) {
  const [mobile, setMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handler = () => setMobile(window.innerWidth < 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  const secretHint = '••••' + secret.slice(-2);

  if (mobile) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#F4EFE3' }}>
        {/* Top nav */}
        <div
          style={{
            background:  '#1C2B1D',
            padding:     '0 4px',
            display:     'flex',
            alignItems:  'center',
            gap:         '2px',
            overflowX:   'auto',
            flexShrink:  0,
          }}
        >
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              style={{
                background:   page === item.id ? '#D4AF37' : 'transparent',
                border:       'none',
                color:        page === item.id ? '#1C2B1D' : '#A5B4A6',
                padding:      '12px 10px',
                cursor:       'pointer',
                borderRadius: '8px',
                fontSize:     '11px',
                fontWeight:   600,
                display:      'flex',
                flexDirection: 'column',
                alignItems:   'center',
                gap:          '2px',
                whiteSpace:   'nowrap',
                flexShrink:   0,
              }}
            >
              <span style={{ fontSize: '18px' }}>{item.icon}</span>
              {item.label}
            </button>
          ))}
          <button
            onClick={onLogout}
            style={{
              marginLeft:  'auto',
              background:  'transparent',
              border:      'none',
              color:       '#9C9486',
              padding:     '12px 10px',
              cursor:      'pointer',
              fontSize:    '11px',
              flexShrink:  0,
            }}
          >
            Sair
          </button>
        </div>
        {/* Page header */}
        <div
          style={{
            background: '#335336',
            padding:    '14px 20px',
            color:      '#FFFFFF',
            fontWeight: 700,
            fontSize:   '18px',
          }}
        >
          {PAGE_TITLES[page] ?? page}
        </div>
        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 16px' }}>
          {children}
        </div>
      </div>
    );
  }

  // Desktop sidebar layout
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F4EFE3' }}>
      {/* Sidebar */}
      <div
        style={{
          width:          '220px',
          minWidth:       '220px',
          background:     '#1C2B1D',
          display:        'flex',
          flexDirection:  'column',
          position:       'fixed',
          top:            0,
          left:           0,
          bottom:         0,
          overflowY:      'auto',
          zIndex:         100,
        }}
      >
        {/* Sidebar header */}
        <div
          style={{
            padding:     '28px 20px 20px',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <div style={{ fontSize: '18px', fontWeight: 700, color: '#D4AF37', letterSpacing: '-0.02em' }}>
            ⚽ Arena Admin
          </div>
          <div style={{ fontSize: '11px', color: '#5A7A5C', marginTop: '4px' }}>
            Painel de Controle
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '12px 10px' }}>
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              style={{
                display:       'flex',
                alignItems:    'center',
                gap:           '10px',
                width:         '100%',
                padding:       '10px 12px',
                borderRadius:  '8px',
                border:        'none',
                background:    page === item.id ? '#D4AF37' : 'transparent',
                color:         page === item.id ? '#1C2B1D' : '#A5B4A6',
                fontSize:      '14px',
                fontWeight:    page === item.id ? 700 : 500,
                cursor:        'pointer',
                marginBottom:  '2px',
                textAlign:     'left',
                transition:    'background 0.15s, color 0.15s',
              }}
              onMouseEnter={e => {
                if (page !== item.id) {
                  (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.07)';
                  (e.currentTarget as HTMLButtonElement).style.color = '#FFFFFF';
                }
              }}
              onMouseLeave={e => {
                if (page !== item.id) {
                  (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                  (e.currentTarget as HTMLButtonElement).style.color = '#A5B4A6';
                }
              }}
            >
              <span style={{ fontSize: '18px', lineHeight: 1 }}>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        {/* Bottom hint */}
        <div
          style={{
            padding:     '16px 20px',
            borderTop:   '1px solid rgba(255,255,255,0.08)',
            fontSize:    '11px',
            color:       '#5A7A5C',
            letterSpacing: '0.05em',
          }}
        >
          Chave: {secretHint}
        </div>
      </div>

      {/* Main content */}
      <div style={{ marginLeft: '220px', flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        {/* Top bar */}
        <div
          style={{
            background:      '#335336',
            padding:         '16px 28px',
            display:         'flex',
            alignItems:      'center',
            justifyContent:  'space-between',
            position:        'sticky',
            top:             0,
            zIndex:          50,
            boxShadow:       '0 2px 8px rgba(0,0,0,0.12)',
          }}
        >
          <span style={{ fontSize: '22px', fontWeight: 700, color: '#FFFFFF', letterSpacing: '-0.02em' }}>
            {PAGE_TITLES[page] ?? page}
          </span>
          <button
            onClick={onLogout}
            style={{
              background:   'rgba(255,255,255,0.1)',
              border:       '1px solid rgba(255,255,255,0.2)',
              color:        '#D4EFD6',
              padding:      '6px 16px',
              borderRadius: '8px',
              cursor:       'pointer',
              fontSize:     '13px',
              fontWeight:   500,
              transition:   'background 0.15s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.18)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.1)'; }}
          >
            Sair
          </button>
        </div>

        {/* Page content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '28px 28px' }}>
          {children}
        </div>
      </div>
    </div>
  );
}

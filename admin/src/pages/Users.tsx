import React, { useEffect, useState } from 'react';
import { api, type UserPublic } from '../api.ts';
import { Table, type Column } from '../components/Table.tsx';
import { Badge } from '../components/Badge.tsx';

interface Props { secret: string; }

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR');
}

function maskCpf(cpf?: string) {
  if (!cpf) return '—';
  return cpf.slice(0, 3) + '.***.***-' + cpf.slice(-2);
}

export function Users({ secret }: Props) {
  const [users,      setUsers]      = useState<UserPublic[]>([]);
  const [query,      setQuery]      = useState('');
  const [loading,    setLoading]    = useState(true);
  const [expanded,   setExpanded]   = useState<string | null>(null);
  const [error,      setError]      = useState('');
  const [recipientInput, setRecipientInput] = useState<Record<string, string>>({});
  const [savingRecipient, setSavingRecipient] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    api.getUsers(secret)
      .then(setUsers)
      .catch(() => setError('Erro ao carregar usuários.'))
      .finally(() => setLoading(false));
  }, [secret]);

  const filtered = users.filter(u => {
    const q = query.toLowerCase();
    return !q
      || u.displayName.toLowerCase().includes(q)
      || (u.email ?? '').toLowerCase().includes(q)
      || (u.phoneE164 ?? '').includes(q);
  });

  async function handleSuspend(u: UserPublic) {
    if (!window.confirm(`Suspender ${u.displayName}?`)) return;
    await api.suspendUser(secret, u.userId);
    setUsers(prev => prev.map(x => x.userId === u.userId ? { ...x, status: 'SUSPENDED' } : x));
  }

  async function handleRestore(u: UserPublic) {
    if (!window.confirm(`Restaurar ${u.displayName}?`)) return;
    await api.restoreUser(secret, u.userId);
    setUsers(prev => prev.map(x => x.userId === u.userId ? { ...x, status: 'ACTIVE' } : x));
  }

  const columns: Column<UserPublic>[] = [
    {
      key: 'name', header: 'Nome',
      render: u => (
        <span style={{ fontWeight: 600, color: '#1C1A14' }}>{u.displayName}</span>
      ),
    },
    {
      key: 'email', header: 'Email',
      render: u => <span style={{ color: '#9C9486', fontSize: '12px' }}>{u.email ?? '—'}</span>,
    },
    {
      key: 'phone', header: 'Telefone',
      render: u => <span style={{ color: '#9C9486', fontSize: '12px' }}>{u.phoneE164 ?? '—'}</span>,
    },
    {
      key: 'listings', header: 'Anúncios',
      render: u => (
        <span style={{ fontWeight: 600, color: '#335336' }}>{u.listingsActiveCount}</span>
      ),
    },
    {
      key: 'rating', header: 'Avaliação',
      render: u => u.ratingAvgAsSeller != null
        ? <span>⭐ {u.ratingAvgAsSeller.toFixed(1)} <span style={{ color: '#9C9486', fontSize: '11px' }}>({u.ratingCountAsSeller})</span></span>
        : <span style={{ color: '#9C9486' }}>—</span>,
    },
    {
      key: 'status', header: 'Status',
      render: u => <Badge label={u.status} />,
    },
    {
      key: 'actions', header: 'Ações',
      render: u => (
        <div style={{ display: 'flex', gap: '6px' }}>
          {u.status !== 'SUSPENDED' && u.status !== 'DELETED' && (
            <ActionButton label="Suspender" color="#B91C1C" onClick={() => handleSuspend(u)} />
          )}
          {u.status === 'SUSPENDED' && (
            <ActionButton label="Restaurar" color="#065F46" onClick={() => handleRestore(u)} />
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      {/* Search */}
      <div style={{ marginBottom: '18px' }}>
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Buscar por nome, email ou telefone…"
          style={{
            width:        '100%',
            maxWidth:     '400px',
            padding:      '10px 14px',
            borderRadius: '8px',
            border:       '1px solid #E5DCC4',
            fontSize:     '14px',
            background:   '#FFFFFF',
            color:        '#1C1A14',
            outline:      'none',
          }}
        />
      </div>

      {error && <ErrorBanner msg={error} />}

      {loading ? (
        <LoadingTable />
      ) : (
        <>
          <div style={{ marginBottom: '10px', fontSize: '13px', color: '#9C9486' }}>
            {filtered.length} usuário{filtered.length !== 1 ? 's' : ''}
          </div>
          <Table
            columns={columns}
            rows={filtered}
            rowKey={u => u.userId}
            onRowClick={u => setExpanded(prev => prev === u.userId ? null : u.userId)}
            emptyText="Nenhum usuário encontrado."
          />
          {/* Expanded detail */}
          {expanded && (() => {
            const u = users.find(x => x.userId === expanded);
            if (!u) return null;
            return (
              <div
                style={{
                  marginTop:    '12px',
                  background:   '#FFFFFF',
                  borderRadius: '12px',
                  border:       '1px solid #E5DCC4',
                  padding:      '20px 24px',
                }}
              >
                <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '12px', color: '#335336' }}>
                  Detalhes — {u.displayName}
                </h3>
                <DetailRow label="User ID"   value={u.userId} mono />
                <DetailRow label="CPF"       value={maskCpf(u.cpf)} />
                <DetailRow label="Criado em" value={fmtDate(u.createdAt)} />
                <DetailRow label="TOTP"      value={u.totpEnabled ? 'Ativo' : 'Inativo'} />
                <DetailRow label="MPC"       value={String(u.mpcPurchasesCount)} />

                {/* Pagar.me Recipient ID */}
                <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: '1px solid #E5DCC4' }}>
                  <p style={{ fontSize: '12px', fontWeight: 700, color: '#9C9486', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    Pagar.me Recipient ID (Split de Pagamento)
                  </p>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      value={recipientInput[u.userId] ?? u.pagarmeRecipientId ?? ''}
                      onChange={e => setRecipientInput(prev => ({ ...prev, [u.userId]: e.target.value }))}
                      placeholder="re_xxxxxxxxxxxxxxxxxx"
                      style={{ flex: 1, padding: '8px 12px', borderRadius: '8px', border: '1px solid #E5DCC4', fontSize: '13px', fontFamily: 'monospace' }}
                    />
                    <button
                      disabled={savingRecipient === u.userId}
                      onClick={async () => {
                        const val = recipientInput[u.userId] ?? '';
                        if (!val.trim()) return;
                        setSavingRecipient(u.userId);
                        await api.setRecipient(secret, u.userId, val.trim());
                        setUsers(prev => prev.map(x => x.userId === u.userId ? { ...x, pagarmeRecipientId: val.trim() } : x));
                        setSavingRecipient(null);
                      }}
                      style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: '#335336', color: '#D4AF37', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}
                    >
                      {savingRecipient === u.userId ? '…' : 'Salvar'}
                    </button>
                  </div>
                  {u.pagarmeRecipientId && (
                    <p style={{ fontSize: '11px', color: '#22c55e', marginTop: '4px' }}>
                      ✅ Configurado: {u.pagarmeRecipientId}
                    </p>
                  )}
                </div>
              </div>
            );
          })()}
        </>
      )}
    </div>
  );
}

// ── Small helpers ──────────────────────────────────────────────────────────

function ActionButton({ label, color, onClick }: { label: string; color: string; onClick: () => void }) {
  return (
    <button
      onClick={e => { e.stopPropagation(); onClick(); }}
      style={{
        background:   'transparent',
        border:       `1px solid ${color}`,
        color,
        padding:      '4px 10px',
        borderRadius: '6px',
        fontSize:     '12px',
        fontWeight:   600,
        cursor:       'pointer',
      }}
    >
      {label}
    </button>
  );
}

function DetailRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div style={{ display: 'flex', gap: '12px', padding: '5px 0', borderBottom: '1px solid #F4EFE3' }}>
      <span style={{ width: '110px', fontSize: '12px', color: '#9C9486', fontWeight: 600, flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: '13px', color: '#1C1A14', fontFamily: mono ? 'monospace' : 'inherit' }}>{value}</span>
    </div>
  );
}

function LoadingTable() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {[1,2,3,4,5].map(i => (
        <div key={i} className="skeleton" style={{ height: '48px', borderRadius: '8px' }} />
      ))}
    </div>
  );
}

function ErrorBanner({ msg }: { msg: string }) {
  return (
    <div style={{ color: '#B91C1C', padding: '14px 18px', background: '#FEE2E2', borderRadius: '10px', marginBottom: '16px', fontSize: '14px' }}>
      {msg}
    </div>
  );
}

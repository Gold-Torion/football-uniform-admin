import React, { useEffect, useState } from 'react';
import { api, type ListingPublic } from '../api.ts';
import { Table, type Column } from '../components/Table.tsx';
import { Badge } from '../components/Badge.tsx';

interface Props { secret: string; }

type FilterTab = 'TODOS' | 'ACTIVE' | 'REMOVED' | 'SOLD';

function fmtBrl(cents: number) {
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR');
}

const TABS: { id: FilterTab; label: string }[] = [
  { id: 'TODOS',   label: 'Todos'    },
  { id: 'ACTIVE',  label: 'Ativos'   },
  { id: 'REMOVED', label: 'Removidos'},
  { id: 'SOLD',    label: 'Vendidos' },
];

export function Listings({ secret }: Props) {
  const [listings, setListings] = useState<ListingPublic[]>([]);
  const [tab,      setTab]      = useState<FilterTab>('TODOS');
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');

  useEffect(() => {
    setLoading(true);
    api.getListings(secret)
      .then(setListings)
      .catch(() => setError('Erro ao carregar anúncios.'))
      .finally(() => setLoading(false));
  }, [secret]);

  const filtered = tab === 'TODOS' ? listings : listings.filter(l => l.status === tab);

  async function handleRemove(l: ListingPublic) {
    if (!window.confirm(`Remover anúncio "${l.teamName} ${l.season}"?`)) return;
    await api.removeListing(secret, l.listingId);
    setListings(prev => prev.map(x => x.listingId === l.listingId ? { ...x, status: 'REMOVED' } : x));
  }

  const columns: Column<ListingPublic>[] = [
    {
      key: 'shirt', header: 'Camisa',
      render: l => (
        <div>
          <div style={{ fontWeight: 600 }}>{l.teamName}</div>
          <div style={{ fontSize: '11px', color: '#9C9486' }}>{l.supplier} · {l.season}</div>
        </div>
      ),
    },
    {
      key: 'seller', header: 'Vendedor',
      render: l => l.sellerName,
    },
    {
      key: 'price', header: 'Preço',
      render: l => <strong style={{ color: '#065F46' }}>{fmtBrl(l.priceCents)}</strong>,
    },
    {
      key: 'size', header: 'Tam.',
      render: l => <span style={{ fontSize: '12px' }}>{l.size}</span>,
    },
    {
      key: 'condition', header: 'Condição',
      render: l => <span style={{ fontSize: '12px', color: '#9C9486' }}>{l.condition.replace(/_/g, ' ')}</span>,
    },
    {
      key: 'mpc', header: 'MPC',
      render: l => l.isMpc ? <span title="Minha Primeira Camisa">⭐</span> : <span style={{ color: '#E5DCC4' }}>—</span>,
    },
    {
      key: 'status', header: 'Status',
      render: l => <Badge label={l.status} />,
    },
    {
      key: 'createdAt', header: 'Criado em',
      render: l => <span style={{ fontSize: '12px', color: '#9C9486' }}>{fmtDate(l.createdAt)}</span>,
    },
    {
      key: 'actions', header: 'Ações',
      render: l => l.status === 'ACTIVE' ? (
        <button
          onClick={e => { e.stopPropagation(); void handleRemove(l); }}
          style={{
            background:   'transparent',
            border:       '1px solid #B91C1C',
            color:        '#B91C1C',
            padding:      '4px 10px',
            borderRadius: '6px',
            fontSize:     '12px',
            fontWeight:   600,
            cursor:       'pointer',
          }}
        >
          Remover
        </button>
      ) : null,
    },
  ];

  return (
    <div>
      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '18px', flexWrap: 'wrap' }}>
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              background:   tab === t.id ? '#335336' : '#FFFFFF',
              color:        tab === t.id ? '#FFFFFF' : '#9C9486',
              border:       '1px solid',
              borderColor:  tab === t.id ? '#335336' : '#E5DCC4',
              padding:      '6px 16px',
              borderRadius: '999px',
              fontSize:     '13px',
              fontWeight:   600,
              cursor:       'pointer',
              transition:   'all 0.15s',
            }}
          >
            {t.label}
            {t.id !== 'TODOS' && (
              <span
                style={{
                  marginLeft:   '6px',
                  background:   tab === t.id ? 'rgba(255,255,255,0.25)' : '#F4EFE3',
                  color:        tab === t.id ? '#fff' : '#9C9486',
                  borderRadius: '999px',
                  padding:      '1px 7px',
                  fontSize:     '11px',
                }}
              >
                {listings.filter(l => l.status === t.id).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {error && (
        <div style={{ color: '#B91C1C', padding: '14px 18px', background: '#FEE2E2', borderRadius: '10px', marginBottom: '16px', fontSize: '14px' }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {[1,2,3,4,5].map(i => <div key={i} className="skeleton" style={{ height: '48px', borderRadius: '8px' }} />)}
        </div>
      ) : (
        <>
          <div style={{ marginBottom: '10px', fontSize: '13px', color: '#9C9486' }}>
            {filtered.length} anúncio{filtered.length !== 1 ? 's' : ''}
          </div>
          <Table
            columns={columns}
            rows={filtered}
            rowKey={l => l.listingId}
            emptyText="Nenhum anúncio encontrado."
          />
        </>
      )}
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import { api, type Stats, type OrderPublic } from '../api.ts';
import { StatCard } from '../components/StatCard.tsx';
import { Table, type Column } from '../components/Table.tsx';
import { Badge } from '../components/Badge.tsx';

interface Props {
  secret: string;
}

function fmtBrl(cents: number) {
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });
}

const ORDER_COLS: Column<OrderPublic>[] = [
  { key: 'orderId',   header: 'Pedido',    render: r => <code style={{ fontSize: '12px', color: '#9C9486' }}>…{r.orderId.slice(-8)}</code> },
  { key: 'buyerName', header: 'Comprador', render: r => r.buyerName },
  { key: 'sellerName',header: 'Vendedor',  render: r => r.sellerName },
  { key: 'total',     header: 'Total',     render: r => <strong style={{ color: '#065F46' }}>{fmtBrl(r.totalCents)}</strong> },
  { key: 'status',    header: 'Status',    render: r => <Badge label={r.status} /> },
  { key: 'date',      header: 'Data',      render: r => fmtDate(r.createdAt) },
];

export function Dashboard({ secret }: Props) {
  const [stats,   setStats]   = useState<Stats | null>(null);
  const [orders,  setOrders]  = useState<OrderPublic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  useEffect(() => {
    setLoading(true);
    Promise.all([api.getStats(secret), api.getOrders(secret)])
      .then(([s, o]) => {
        setStats(s);
        setOrders(o.slice(0, 5));
      })
      .catch(() => setError('Erro ao carregar dados.'))
      .finally(() => setLoading(false));
  }, [secret]);

  if (loading) {
    return (
      <div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px', marginBottom: '28px' }}>
          {[1,2,3,4].map(i => (
            <div key={i} className="skeleton" style={{ height: '120px', borderRadius: '12px' }} />
          ))}
        </div>
        <div className="skeleton" style={{ height: '240px', borderRadius: '12px' }} />
      </div>
    );
  }

  if (error) {
    return <div style={{ color: '#B91C1C', padding: '24px', background: '#FEE2E2', borderRadius: '12px' }}>{error}</div>;
  }

  return (
    <div>
      {/* Stat cards */}
      <div
        style={{
          display:             'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap:                 '16px',
          marginBottom:        '32px',
        }}
      >
        <StatCard icon="👥" value={stats?.totalUsers ?? 0}     label="Total Usuários"      />
        <StatCard icon="👕" value={stats?.activeListings ?? 0} label="Anúncios Ativos"     />
        <StatCard icon="📦" value={stats?.totalOrders ?? 0}    label="Total Pedidos"       />
        <StatCard
          icon="🚩"
          value={stats?.pendingReports ?? 0}
          label="Denúncias Pendentes"
          alert={(stats?.pendingReports ?? 0) > 0}
        />
      </div>

      {/* Recent orders */}
      <div>
        <h2
          style={{
            fontSize:     '15px',
            fontWeight:   700,
            color:        '#1C1A14',
            marginBottom: '12px',
            letterSpacing: '-0.01em',
          }}
        >
          Pedidos Recentes
        </h2>
        <Table
          columns={ORDER_COLS}
          rows={orders}
          rowKey={r => r.orderId}
          emptyText="Nenhum pedido encontrado."
        />
      </div>
    </div>
  );
}

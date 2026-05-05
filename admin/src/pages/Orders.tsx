import React, { useEffect, useState } from 'react';
import { api, type OrderPublic } from '../api.ts';
import { Table, type Column } from '../components/Table.tsx';
import { Badge } from '../components/Badge.tsx';

interface Props { secret: string; }

function fmtBrl(cents: number) {
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR');
}

function deliveryIcon(method: string) {
  if (method === 'CORREIOS') return '📦 Correios';
  if (method === 'ENTREGA_EM_MAOS') return '🤝 Em Mãos';
  return method;
}

export function Orders({ secret }: Props) {
  const [orders,  setOrders]  = useState<OrderPublic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  useEffect(() => {
    setLoading(true);
    api.getOrders(secret)
      .then(setOrders)
      .catch(() => setError('Erro ao carregar pedidos.'))
      .finally(() => setLoading(false));
  }, [secret]);

  const columns: Column<OrderPublic>[] = [
    {
      key: 'orderId', header: 'Pedido',
      render: o => (
        <code style={{ fontSize: '12px', color: '#9C9486', background: '#F4EFE3', padding: '2px 6px', borderRadius: '4px' }}>
          {o.orderId.slice(-8)}
        </code>
      ),
    },
    {
      key: 'buyer', header: 'Comprador',
      render: o => <span style={{ fontWeight: 500 }}>{o.buyerName}</span>,
    },
    {
      key: 'seller', header: 'Vendedor',
      render: o => <span style={{ fontWeight: 500 }}>{o.sellerName}</span>,
    },
    {
      key: 'shirt', header: 'Camisa',
      render: o => (
        <span style={{ fontSize: '13px' }}>{o.teamName}</span>
      ),
    },
    {
      key: 'total', header: 'Total',
      render: o => <strong style={{ color: '#065F46' }}>{fmtBrl(o.totalCents)}</strong>,
    },
    {
      key: 'delivery', header: 'Entrega',
      render: o => (
        <span style={{ fontSize: '12px', color: '#9C9486', whiteSpace: 'nowrap' }}>
          {deliveryIcon(o.deliveryMethod)}
        </span>
      ),
    },
    {
      key: 'status', header: 'Status',
      render: o => <Badge label={o.status} />,
    },
    {
      key: 'date', header: 'Data',
      render: o => <span style={{ fontSize: '12px', color: '#9C9486' }}>{fmtDate(o.createdAt)}</span>,
    },
  ];

  return (
    <div>
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
            {orders.length} pedido{orders.length !== 1 ? 's' : ''}
          </div>
          <Table
            columns={columns}
            rows={orders}
            rowKey={o => o.orderId}
            emptyText="Nenhum pedido encontrado."
          />
        </>
      )}
    </div>
  );
}

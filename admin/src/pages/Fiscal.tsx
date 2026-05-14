import React, { useEffect, useState } from 'react';
import { api, type InvoicePublic } from '../api.ts';

interface Props { secret: string; }

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });
}
function fmtBrl(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

const STATUS_COLOR: Record<string, string> = {
  AUTHORIZED: '#22c55e',
  PROCESSING: '#f59e0b',
  PENDING:    '#9C9486',
  ERROR:      '#ef4444',
  CANCELLED:  '#9C9486',
};

const card: React.CSSProperties = {
  background: '#fff', borderRadius: '12px', border: '1px solid #E5DCC4', padding: '16px', marginBottom: '10px',
};

export function Fiscal({ secret }: Props) {
  const [invoices, setInvoices] = useState<InvoicePublic[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [filter,   setFilter]   = useState<'ALL' | 'NFS-E' | 'NF-E' | 'ERROR'>('ALL');
  const [retrying, setRetrying] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    api.listInvoices(secret)
      .then(setInvoices)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(load, [secret]);

  const onRetry = async (inv: InvoicePublic) => {
    setRetrying(inv.invoiceId);
    await api.retryInvoice(secret, inv.orderId, inv.type);
    setTimeout(() => { load(); setRetrying(null); }, 2000);
  };

  const filtered = invoices.filter(inv =>
    filter === 'ALL'   ? true :
    filter === 'ERROR' ? inv.status === 'ERROR' :
    inv.type === filter
  );

  const stats = {
    total:      invoices.length,
    authorized: invoices.filter(i => i.status === 'AUTHORIZED').length,
    error:      invoices.filter(i => i.status === 'ERROR').length,
    nfse:       invoices.filter(i => i.type === 'NFS-E').length,
    nfe:        invoices.filter(i => i.type === 'NF-E').length,
    totalValue: invoices.filter(i => i.status === 'AUTHORIZED').reduce((s, i) => s + i.totalValue, 0),
  };

  return (
    <div>
      <h2 style={{ color: '#1C1A14', fontSize: '22px', fontWeight: 800, marginBottom: '4px' }}>
        Notas Fiscais
      </h2>
      <p style={{ color: '#9C9486', fontSize: '13px', marginBottom: '20px' }}>
        NFS-e (comissão 7%) e NF-e (camisas MPC) — Focus NFe
      </p>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }}>
        {[
          { label: 'Total emitidas',  value: stats.total,                       color: '#1C1A14' },
          { label: 'Autorizadas',     value: stats.authorized,                   color: '#22c55e' },
          { label: 'Com erro',        value: stats.error,                        color: '#ef4444' },
          { label: 'Valor autorizado', value: fmtBrl(stats.totalValue),          color: '#335336' },
        ].map(s => (
          <div key={s.label} style={{ ...card, textAlign: 'center' }}>
            <p style={{ color: '#9C9486', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', margin: '0 0 6px' }}>{s.label}</p>
            <p style={{ color: s.color, fontWeight: 900, fontSize: '20px', margin: 0 }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
        {(['ALL', 'NFS-E', 'NF-E', 'ERROR'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: '6px 16px', borderRadius: '999px', border: 'none', cursor: 'pointer',
            fontWeight: 700, fontSize: '12px',
            background: filter === f ? '#335336' : '#F4EFE3',
            color: filter === f ? '#fff' : '#6B6357',
          }}>
            {f === 'ALL' ? 'Todas' : f === 'ERROR' ? 'Com erro' : f}
            {f === 'NFS-E' && ` (${stats.nfse})`}
            {f === 'NF-E'  && ` (${stats.nfe})`}
            {f === 'ERROR' && ` (${stats.error})`}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? <p style={{ color: '#9C9486' }}>Carregando…</p>
       : filtered.length === 0 ? (
        <p style={{ color: '#9C9486', textAlign: 'center', padding: '40px 0' }}>
          {filter === 'ALL' ? 'Nenhuma nota fiscal emitida ainda.' : `Nenhuma nota ${filter}.`}
        </p>
       ) : filtered.map(inv => (
        <div key={inv.invoiceId} style={card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                <span style={{
                  background: inv.type === 'NFS-E' ? '#EFF6FF' : '#F0FDF4',
                  color: inv.type === 'NFS-E' ? '#1D4ED8' : '#166534',
                  fontSize: '11px', fontWeight: 800, padding: '2px 8px', borderRadius: '4px',
                }}>
                  {inv.type}
                </span>
                <span style={{
                  background: `${STATUS_COLOR[inv.status]}22`,
                  color: STATUS_COLOR[inv.status],
                  fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px',
                }}>
                  {inv.status}
                </span>
                <span style={{ color: '#9C9486', fontSize: '12px' }}>{fmtDate(inv.createdAt)}</span>
              </div>

              <p style={{ color: '#9C9486', fontSize: '12px', margin: '0 0 4px' }}>
                Pedido: <code style={{ fontSize: '12px' }}>…{inv.orderId.slice(-8)}</code>
                &nbsp;·&nbsp;Ref: <code style={{ fontSize: '11px' }}>{inv.ref}</code>
              </p>

              <p style={{ color: '#1C1A14', fontWeight: 700, fontSize: '14px', margin: '0 0 4px' }}>
                {fmtBrl(inv.totalValue)}
              </p>

              {inv.errorMessage && (
                <p style={{ color: '#ef4444', fontSize: '12px', margin: '4px 0 0' }}>
                  ⚠️ {inv.errorMessage}
                </p>
              )}
            </div>

            <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
              {inv.pdfUrl && (
                <a href={inv.pdfUrl} target="_blank" rel="noreferrer" style={{
                  padding: '6px 12px', borderRadius: '8px', background: '#EFF6FF',
                  color: '#1D4ED8', fontWeight: 700, fontSize: '12px', textDecoration: 'none',
                }}>
                  PDF
                </a>
              )}
              {inv.xmlUrl && (
                <a href={inv.xmlUrl} target="_blank" rel="noreferrer" style={{
                  padding: '6px 12px', borderRadius: '8px', background: '#F0FDF4',
                  color: '#166534', fontWeight: 700, fontSize: '12px', textDecoration: 'none',
                }}>
                  XML
                </a>
              )}
              {(inv.status === 'ERROR' || inv.status === 'PENDING') && (
                <button
                  onClick={() => void onRetry(inv)}
                  disabled={retrying === inv.invoiceId}
                  style={{
                    padding: '6px 12px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                    background: '#FEF2F2', color: '#991B1B', fontWeight: 700, fontSize: '12px',
                  }}
                >
                  {retrying === inv.invoiceId ? '…' : 'Retentar'}
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

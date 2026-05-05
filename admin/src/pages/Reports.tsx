import React, { useEffect, useState } from 'react';
import { api, type ReportWithComment } from '../api.ts';

interface Props { secret: string; }

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });
}

export function Reports({ secret }: Props) {
  const [reports, setReports] = useState<ReportWithComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  useEffect(() => {
    setLoading(true);
    api.getReports(secret)
      .then(setReports)
      .catch(() => setError('Erro ao carregar denúncias.'))
      .finally(() => setLoading(false));
  }, [secret]);

  async function handleResolve(r: ReportWithComment) {
    if (!window.confirm('Remover o comentário e resolver esta denúncia?')) return;
    await api.resolveReport(secret, r.reportId);
    setReports(prev => prev.filter(x => x.reportId !== r.reportId));
  }

  async function handleDismiss(r: ReportWithComment) {
    if (!window.confirm('Dispensar esta denúncia sem ação?')) return;
    await api.dismissReport(secret, r.reportId);
    setReports(prev => prev.filter(x => x.reportId !== r.reportId));
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: '160px', borderRadius: '12px' }} />)}
      </div>
    );
  }

  if (error) {
    return <div style={{ color: '#B91C1C', padding: '14px 18px', background: '#FEE2E2', borderRadius: '10px', fontSize: '14px' }}>{error}</div>;
  }

  if (reports.length === 0) {
    return (
      <div
        style={{
          background:   '#FFFFFF',
          borderRadius: '16px',
          border:       '1px solid #E5DCC4',
          padding:      '64px 32px',
          textAlign:    'center',
        }}
      >
        <div style={{ fontSize: '48px', marginBottom: '12px' }}>✓</div>
        <div style={{ fontSize: '18px', fontWeight: 700, color: '#065F46', marginBottom: '6px' }}>
          Tudo limpo!
        </div>
        <div style={{ fontSize: '14px', color: '#9C9486' }}>
          Nenhuma denúncia pendente.
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: '16px', fontSize: '13px', color: '#9C9486' }}>
        {reports.length} denúncia{reports.length !== 1 ? 's' : ''} pendente{reports.length !== 1 ? 's' : ''}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {reports.map(r => (
          <div
            key={r.reportId}
            style={{
              background:   '#FFFFFF',
              borderRadius: '12px',
              border:       '1px solid #E5DCC4',
              overflow:     'hidden',
              boxShadow:    '0 2px 8px rgba(0,0,0,0.04)',
            }}
          >
            {/* Comment quote block */}
            {r.comment ? (
              <div
                style={{
                  borderLeft:  '4px solid #D4AF37',
                  margin:      '20px 20px 0',
                  paddingLeft: '14px',
                }}
              >
                <div style={{ fontSize: '13px', color: '#1C1A14', lineHeight: 1.5, fontStyle: 'italic' }}>
                  "{r.comment.body}"
                </div>
                <div style={{ marginTop: '6px', fontSize: '12px', color: '#9C9486' }}>
                  — {r.comment.authorName}
                  {r.comment.reportCount > 1 && (
                    <span
                      style={{
                        marginLeft:   '8px',
                        background:   '#FEE2E2',
                        color:        '#B91C1C',
                        borderRadius: '999px',
                        padding:      '1px 8px',
                        fontSize:     '11px',
                        fontWeight:   600,
                      }}
                    >
                      {r.comment.reportCount}× denunciado
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div
                style={{
                  borderLeft:  '4px solid #E5DCC4',
                  margin:      '20px 20px 0',
                  paddingLeft: '14px',
                  color:       '#9C9486',
                  fontSize:    '13px',
                  fontStyle:   'italic',
                }}
              >
                Comentário não encontrado ou já removido.
              </div>
            )}

            {/* Meta row */}
            <div
              style={{
                padding:    '12px 20px',
                display:    'flex',
                flexWrap:   'wrap',
                gap:        '16px',
                alignItems: 'center',
              }}
            >
              <MetaChip label="Motivo" value={r.reason.replace(/_/g, ' ')} />
              <MetaChip label="Listagem" value={`…${r.listingId.slice(-8)}`} mono />
              <MetaChip label="Denunciado em" value={fmtDate(r.createdAt)} />
            </div>

            {/* Actions */}
            <div
              style={{
                padding:         '12px 20px',
                borderTop:       '1px solid #F4EFE3',
                display:         'flex',
                gap:             '10px',
                justifyContent:  'flex-end',
              }}
            >
              <button
                onClick={() => void handleDismiss(r)}
                style={{
                  background:   'transparent',
                  border:       '1px solid #E5DCC4',
                  color:        '#9C9486',
                  padding:      '7px 18px',
                  borderRadius: '8px',
                  fontSize:     '13px',
                  fontWeight:   600,
                  cursor:       'pointer',
                }}
              >
                Dispensar
              </button>
              <button
                onClick={() => void handleResolve(r)}
                style={{
                  background:   '#B91C1C',
                  border:       'none',
                  color:        '#FFFFFF',
                  padding:      '7px 18px',
                  borderRadius: '8px',
                  fontSize:     '13px',
                  fontWeight:   600,
                  cursor:       'pointer',
                  boxShadow:    '0 2px 6px rgba(185,28,28,0.3)',
                }}
              >
                Remover comentário
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MetaChip({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
      <span style={{ fontSize: '10px', color: '#9C9486', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        {label}
      </span>
      <span style={{ fontSize: '13px', color: '#1C1A14', fontFamily: mono ? 'monospace' : 'inherit' }}>
        {value}
      </span>
    </div>
  );
}

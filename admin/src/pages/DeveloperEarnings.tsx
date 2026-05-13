import React, { useEffect, useState } from 'react';
import { api, type DeveloperEarningsPublic } from '../api.ts';

interface Props { secret: string; }

function fmtBrl(cents: number) {
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });
}

const card: React.CSSProperties = {
  background: '#fff', borderRadius: '12px', border: '1px solid #E5DCC4', padding: '20px', marginBottom: '12px',
};
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 12px', borderRadius: '8px',
  border: '1px solid #E5DCC4', fontSize: '14px', color: '#1C1A14',
  background: '#FAFAF8', boxSizing: 'border-box',
};
const btn = (color: string, text = '#fff'): React.CSSProperties => ({
  padding: '10px 20px', borderRadius: '8px', border: 'none',
  background: color, color: text, fontWeight: 700, fontSize: '13px', cursor: 'pointer',
});

export function DeveloperEarnings({ secret }: Props) {
  const [data,         setData]         = useState<DeveloperEarningsPublic | null>(null);
  const [loading,      setLoading]      = useState(true);
  const [withdrawAmt,  setWithdrawAmt]  = useState('');
  const [withdrawNote, setWithdrawNote] = useState('');
  const [saving,       setSaving]       = useState(false);
  const [error,        setError]        = useState('');

  const load = () => {
    setLoading(true);
    api.getDeveloperEarnings(secret)
      .then(setData)
      .catch(() => setError('Erro ao carregar dados.'))
      .finally(() => setLoading(false));
  };

  useEffect(load, [secret]);

  const onWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const cents = Math.round(parseFloat(withdrawAmt.replace(',', '.')) * 100);
    if (isNaN(cents) || cents < 1) return setError('Valor inválido.');
    if (!data || cents > data.developerAvailableCents) return setError('Saldo insuficiente.');
    setSaving(true);
    try {
      await api.recordWithdrawal(secret, cents, withdrawNote || undefined);
      setWithdrawAmt('');
      setWithdrawNote('');
      load();
    } catch {
      setError('Erro ao registrar saque.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p style={{ color: '#9C9486' }}>Carregando…</p>;
  if (!data)   return <p style={{ color: '#DC2626' }}>{error || 'Erro ao carregar.'}</p>;

  const USD_RATE = 5.60;
  const thresholdUsd = (data.thresholdCents / 100 / USD_RATE).toFixed(0);
  const allocatedUsd = (data.developerAllocatedCents / 100 / USD_RATE).toFixed(2);
  const availableUsd = (data.developerAvailableCents / 100 / USD_RATE).toFixed(2);

  return (
    <div>
      <h2 style={{ color: '#1C1A14', fontSize: '22px', fontWeight: 800, marginBottom: '4px' }}>
        Developer Earnings
      </h2>
      <p style={{ color: '#9C9486', fontSize: '13px', marginBottom: '20px' }}>
        Melhor Envio shipping spread — Agreement: USD $220 (~R${(data.thresholdCents / 100).toFixed(2)})
      </p>

      {/* Status banner */}
      <div style={{
        ...card,
        background: data.status === 'COMPLETED' ? '#dcfce7' : '#FFFDF5',
        borderColor: data.status === 'COMPLETED' ? '#22c55e' : '#D4AF37',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <span style={{ fontWeight: 800, fontSize: '16px', color: data.status === 'COMPLETED' ? '#166534' : '#1C1A14' }}>
            {data.status === 'COMPLETED' ? '✅ Agreement Completed' : '🔄 Agreement Active'}
          </span>
          <span style={{
            background: data.status === 'COMPLETED' ? '#22c55e' : '#D4AF37',
            color: '#fff', fontSize: '12px', fontWeight: 700,
            padding: '4px 12px', borderRadius: '999px',
          }}>
            {data.thresholdReachedPct}% reached
          </span>
        </div>

        {/* Progress bar */}
        <div style={{ height: '10px', background: '#E5DCC4', borderRadius: '999px', overflow: 'hidden', marginBottom: '8px' }}>
          <div style={{
            height: '100%',
            width: `${data.thresholdReachedPct}%`,
            background: data.status === 'COMPLETED' ? '#22c55e' : '#D4AF37',
            borderRadius: '999px',
            transition: 'width 0.5s',
          }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#9C9486' }}>
          <span>{fmtBrl(data.developerAllocatedCents)} allocated to developer</span>
          <span>Target: {fmtBrl(data.thresholdCents)} (USD ${thresholdUsd})</span>
        </div>
      </div>

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '16px' }}>
        {[
          { label: 'Total Spread Generated', brl: data.totalSpreadCents, sub: 'from all shipments' },
          { label: 'Developer Allocated', brl: data.developerAllocatedCents, sub: `≈ USD $${allocatedUsd}` },
          { label: 'Arena Allocated', brl: data.arenaAllocatedCents, sub: 'after threshold' },
        ].map(s => (
          <div key={s.label} style={card}>
            <p style={{ color: '#9C9486', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 8px' }}>
              {s.label}
            </p>
            <p style={{ color: '#1C1A14', fontWeight: 800, fontSize: '20px', margin: '0 0 4px' }}>
              {fmtBrl(s.brl)}
            </p>
            <p style={{ color: '#9C9486', fontSize: '12px', margin: 0 }}>{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Withdrawal section */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
        <div style={card}>
          <p style={{ color: '#9C9486', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 8px' }}>
            Developer Available to Withdraw
          </p>
          <p style={{ color: '#335336', fontWeight: 900, fontSize: '24px', margin: '0 0 4px' }}>
            {fmtBrl(data.developerAvailableCents)}
          </p>
          <p style={{ color: '#9C9486', fontSize: '12px', margin: 0 }}>≈ USD ${availableUsd}</p>
        </div>
        <div style={card}>
          <p style={{ color: '#9C9486', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 8px' }}>
            Remaining Until Threshold
          </p>
          <p style={{ color: data.status === 'COMPLETED' ? '#22c55e' : '#D4AF37', fontWeight: 900, fontSize: '24px', margin: '0 0 4px' }}>
            {data.status === 'COMPLETED' ? '✅ Done' : fmtBrl(data.developerRemainingCents)}
          </p>
          <p style={{ color: '#9C9486', fontSize: '12px', margin: 0 }}>
            {data.developerWithdrawnCents > 0 ? `Withdrawn: ${fmtBrl(data.developerWithdrawnCents)}` : 'No withdrawals yet'}
          </p>
        </div>
      </div>

      {/* Record withdrawal */}
      {data.developerAvailableCents > 0 && (
        <div style={{ ...card, borderColor: '#335336', background: '#F9FFF9', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#1C1A14', marginBottom: '16px' }}>
            Record Withdrawal
          </h3>
          <form onSubmit={e => void onWithdraw(e)}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '10px', marginBottom: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#9C9486', marginBottom: '6px', textTransform: 'uppercase' }}>
                  Amount (R$)
                </label>
                <input
                  style={inputStyle}
                  value={withdrawAmt}
                  onChange={e => setWithdrawAmt(e.target.value)}
                  placeholder="0,00"
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={(data.developerAvailableCents / 100).toFixed(2)}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#9C9486', marginBottom: '6px', textTransform: 'uppercase' }}>
                  Notes (optional)
                </label>
                <input
                  style={inputStyle}
                  value={withdrawNote}
                  onChange={e => setWithdrawNote(e.target.value)}
                  placeholder="PIX transfer, bank transfer..."
                />
              </div>
            </div>
            {error && <p style={{ color: '#DC2626', fontSize: '13px', marginBottom: '10px' }}>{error}</p>}
            <button type="submit" disabled={saving} style={btn('#335336')}>
              {saving ? 'Recording…' : '+ Record Withdrawal'}
            </button>
          </form>
        </div>
      )}

      {/* Withdrawal history */}
      {data.withdrawals.length > 0 && (
        <div>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#1C1A14', marginBottom: '12px' }}>
            Withdrawal History
          </h3>
          {data.withdrawals.map(w => (
            <div key={w.withdrawalId} style={{ ...card, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ fontWeight: 700, fontSize: '15px', color: '#1C1A14', margin: '0 0 4px' }}>
                  {fmtBrl(w.amountCents)}
                </p>
                <p style={{ fontSize: '12px', color: '#9C9486', margin: 0 }}>
                  {fmtDate(w.createdAt)}{w.notes ? ` — ${w.notes}` : ''}
                </p>
              </div>
              <span style={{ color: '#22c55e', fontSize: '20px' }}>✓</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

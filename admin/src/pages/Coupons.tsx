import React, { useEffect, useState } from 'react';
import { api, type CouponRecord } from '../api.ts';

interface Props { secret: string; }

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR');
}

const card: React.CSSProperties = {
  background: '#fff', borderRadius: '12px', border: '1px solid #E5DCC4',
  padding: '20px', marginBottom: '12px',
};
const label: React.CSSProperties = {
  display: 'block', fontSize: '11px', fontWeight: 600,
  color: '#9C9486', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.08em',
};
const input: React.CSSProperties = {
  width: '100%', padding: '10px 12px', borderRadius: '8px',
  border: '1px solid #E5DCC4', fontSize: '14px', color: '#1C1A14',
  background: '#FAFAF8', boxSizing: 'border-box',
};
const btn = (color: string, text = '#fff'): React.CSSProperties => ({
  padding: '10px 20px', borderRadius: '8px', border: 'none',
  background: color, color: text, fontWeight: 700, fontSize: '13px',
  cursor: 'pointer',
});

export function Coupons({ secret }: Props) {
  const [coupons, setCoupons] = useState<CouponRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');
  const [form, setForm] = useState({ code: '', discountPct: '10', description: '', maxRedemptions: '100' });
  const [creating, setCreating] = useState(false);
  const [formErr,  setFormErr]  = useState('');

  const load = () => {
    setLoading(true);
    api.listCoupons(secret)
      .then(setCoupons)
      .catch(() => setError('Erro ao carregar cupons.'))
      .finally(() => setLoading(false));
  };

  useEffect(load, [secret]);

  const onCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErr('');
    const pct = parseInt(form.discountPct);
    const max = parseInt(form.maxRedemptions);
    if (!form.code.trim()) return setFormErr('Código obrigatório.');
    if (isNaN(pct) || pct < 1 || pct > 100) return setFormErr('Desconto deve ser entre 1 e 100.');
    if (isNaN(max) || max < 1) return setFormErr('Limite de usos deve ser maior que 0.');
    setCreating(true);
    try {
      await api.createCoupon(secret, { code: form.code, discountPct: pct, description: form.description, maxRedemptions: max });
      setForm({ code: '', discountPct: '10', description: '', maxRedemptions: '100' });
      load();
    } catch {
      setFormErr('Erro ao criar cupom. O código pode já existir.');
    } finally {
      setCreating(false);
    }
  };

  const onToggle = async (code: string) => {
    await api.toggleCoupon(secret, code);
    load();
  };

  return (
    <div>
      <h2 style={{ color: '#1C1A14', fontSize: '22px', fontWeight: 800, marginBottom: '20px' }}>
        Gerador de Cupons
      </h2>

      {/* Create form */}
      <div style={{ ...card, borderColor: '#D4AF37', background: '#FFFDF5' }}>
        <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#1C1A14', marginBottom: '16px' }}>Novo cupom</h3>
        <form onSubmit={e => void onCreate(e)}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <div>
              <label style={label}>Código</label>
              <input style={input} value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} placeholder="PROMO10" />
            </div>
            <div>
              <label style={label}>Desconto (%)</label>
              <input style={input} type="number" min={1} max={100} value={form.discountPct} onChange={e => setForm(f => ({ ...f, discountPct: e.target.value }))} />
            </div>
            <div>
              <label style={label}>Descrição</label>
              <input style={input} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Promoção de lançamento" />
            </div>
            <div>
              <label style={label}>Limite de usos</label>
              <input style={input} type="number" min={1} value={form.maxRedemptions} onChange={e => setForm(f => ({ ...f, maxRedemptions: e.target.value }))} />
            </div>
          </div>
          {formErr && <p style={{ color: '#DC2626', fontSize: '13px', marginBottom: '10px' }}>{formErr}</p>}
          <button type="submit" disabled={creating} style={btn('#D4AF37', '#1C1A14')}>
            {creating ? 'Criando…' : '+ Criar cupom'}
          </button>
        </form>
      </div>

      {/* List */}
      {error && <p style={{ color: '#DC2626' }}>{error}</p>}
      {loading ? <p style={{ color: '#9C9486' }}>Carregando…</p> : coupons.length === 0 ? (
        <p style={{ color: '#9C9486', textAlign: 'center', padding: '40px 0' }}>Nenhum cupom criado ainda.</p>
      ) : (
        <div>
          {coupons.sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map(c => (
            <div key={c.code} style={{ ...card, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                  <code style={{ fontSize: '15px', fontWeight: 800, color: '#1C1A14' }}>{c.code}</code>
                  <span style={{
                    background: c.active ? '#dcfce7' : '#fee2e2',
                    color: c.active ? '#166534' : '#991b1b',
                    fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '999px',
                  }}>{c.active ? 'ATIVO' : 'INATIVO'}</span>
                </div>
                <div style={{ fontSize: '13px', color: '#9C9486' }}>
                  {c.discountPct}% de desconto · {c.redemptionCount}/{c.maxRedemptions} usos · {c.description || '—'} · criado {fmtDate(c.createdAt)}
                </div>
              </div>
              <button onClick={() => void onToggle(c.code)} style={btn(c.active ? '#fee2e2' : '#dcfce7', c.active ? '#991b1b' : '#166534')}>
                {c.active ? 'Desativar' : 'Ativar'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

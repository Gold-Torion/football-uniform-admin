import React, { useEffect, useState } from 'react';
import { api, type ListingPublic } from '../api.ts';

interface Props { secret: string; }

function fmtBrl(cents: number) {
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR');
}

const card: React.CSSProperties = {
  background: '#fff', borderRadius: '12px', border: '1px solid #E5DCC4', padding: '20px', marginBottom: '12px',
};
const label: React.CSSProperties = {
  display: 'block', fontSize: '11px', fontWeight: 600,
  color: '#9C9486', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.08em',
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

const SELECT_FIELDS: Record<string, string[]> = {
  kind:        ['TIME', 'SELECAO'],
  continent:   ['AMERICA', 'EUROPA', 'ASIA', 'AFRICA', 'OCEANIA'],
  supplier:    ['ADIDAS', 'NIKE', 'PUMA', 'UMBRO', 'KAPPA', 'LE_COQ_SPORTIF', 'NEW_BALANCE', 'UNDER_ARMOUR', 'PENALTY', 'TOPPER', 'OUTRO'],
  model:       ['TITULAR', 'RESERVA', 'TERCEIRA', 'GOLEIRO', 'TREINO', 'COMEMORATIVA'],
  garmentType: ['LOJA', 'JOGO'],
  size:        ['PP', 'P', 'M', 'G', 'GG', 'XGG', '2XGG', '3XGG'],
  condition:   ['COM_ETIQUETA', 'PERFEITA', 'EXCELENTE', 'BOA', 'REGULAR', 'DESGASTADA'],
  gender:      ['MASCULINO', 'FEMININO'],
};

const EMPTY_FORM = {
  kind: 'TIME', teamName: '', continent: 'AMERICA', country: '',
  season: '', supplier: 'ADIDAS', model: 'TITULAR', garmentType: 'LOJA',
  size: 'M', condition: 'PERFEITA', gender: 'MASCULINO', description: '',
  nonVerifiedSupplierAck: true,
};

export function Mpc({ secret }: Props) {
  const [listings, setListings] = useState<ListingPublic[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [creating, setCreating] = useState(false);
  const [formErr,  setFormErr]  = useState('');
  const [form,     setForm]     = useState(EMPTY_FORM);

  const load = () => {
    setLoading(true);
    api.listMpc(secret)
      .then(setListings)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(load, [secret]);

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const onCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErr('');
    if (!form.teamName.trim()) return setFormErr('Nome do time obrigatório.');
    if (!form.country.trim())  return setFormErr('País obrigatório.');
    if (!form.season.trim())   return setFormErr('Temporada obrigatória.');
    setCreating(true);
    try {
      await api.createMpc(secret, { ...form, priceCents: 14900 } as Parameters<typeof api.createMpc>[1]);
      setForm(EMPTY_FORM);
      load();
    } catch {
      setFormErr('Erro ao criar anúncio MPC.');
    } finally {
      setCreating(false);
    }
  };

  const onRemove = async (id: string) => {
    if (!confirm('Remover este anúncio MPC?')) return;
    await api.removeListing(secret, id);
    load();
  };

  return (
    <div>
      <h2 style={{ color: '#1C1A14', fontSize: '22px', fontWeight: 800, marginBottom: '4px' }}>
        Minha Primeira Camisa
      </h2>
      <p style={{ color: '#9C9486', fontSize: '13px', marginBottom: '20px' }}>
        Camisas curadas por R$ 149,00 · máx. 5 compras por usuário
      </p>

      {/* Create form */}
      <div style={{ ...card, borderColor: '#D4AF37', background: '#FFFDF5' }}>
        <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#1C1A14', marginBottom: '16px' }}>Novo anúncio MPC</h3>
        <form onSubmit={e => void onCreate(e)}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '12px' }}>
            {(['kind','continent','supplier','model','garmentType','size','condition','gender'] as const).map(field => (
              <div key={field}>
                <label style={label}>{field}</label>
                <select style={inputStyle} value={(form as Record<string,string>)[field]} onChange={e => set(field, e.target.value)}>
                  {SELECT_FIELDS[field].map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
            ))}
            <div>
              <label style={label}>Time / Seleção</label>
              <input style={inputStyle} value={form.teamName} onChange={e => set('teamName', e.target.value)} placeholder="Brasil" />
            </div>
            <div>
              <label style={label}>País</label>
              <input style={inputStyle} value={form.country} onChange={e => set('country', e.target.value)} placeholder="Brasil" />
            </div>
            <div>
              <label style={label}>Temporada</label>
              <input style={inputStyle} value={form.season} onChange={e => set('season', e.target.value)} placeholder="2002" />
            </div>
          </div>
          <div style={{ marginBottom: '16px' }}>
            <label style={label}>Descrição (opcional)</label>
            <input style={inputStyle} value={form.description} onChange={e => set('description', e.target.value)} placeholder="Camisa histórica da Copa 2002…" />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontWeight: 700, color: '#1C1A14' }}>Preço fixo: R$ 149,00</span>
            <div>
              {formErr && <span style={{ color: '#DC2626', fontSize: '13px', marginRight: '12px' }}>{formErr}</span>}
              <button type="submit" disabled={creating} style={btn('#D4AF37', '#1C1A14')}>
                {creating ? 'Criando…' : '+ Adicionar ao MPC'}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* List */}
      {loading ? <p style={{ color: '#9C9486' }}>Carregando…</p> : listings.length === 0 ? (
        <p style={{ color: '#9C9486', textAlign: 'center', padding: '40px 0' }}>Nenhum item MPC cadastrado.</p>
      ) : (
        listings.map(l => (
          <div key={l.listingId} style={{ ...card, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontWeight: 700, fontSize: '15px', color: '#1C1A14', margin: '0 0 4px' }}>
                {l.teamName} · {l.season}
              </p>
              <p style={{ fontSize: '13px', color: '#9C9486', margin: 0 }}>
                {l.supplier} · {l.size} · {l.condition} · {fmtBrl(l.priceCents)} · {fmtDate(l.createdAt)}
              </p>
            </div>
            <button onClick={() => void onRemove(l.listingId)} style={btn('#fee2e2', '#991b1b')}>
              Remover
            </button>
          </div>
        ))
      )}
    </div>
  );
}

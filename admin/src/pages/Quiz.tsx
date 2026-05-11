import React, { useEffect, useState } from 'react';
import { api, type QuizRecord } from '../api.ts';

interface Props { secret: string; }

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });
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

const EMPTY_FORM = { question: '', options: ['', '', '', ''], correctIndex: 0 };

export function Quiz({ secret }: Props) {
  const [quizzes,  setQuizzes]  = useState<QuizRecord[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [creating, setCreating] = useState(false);
  const [formErr,  setFormErr]  = useState('');
  const [form,     setForm]     = useState(EMPTY_FORM);

  const load = () => {
    setLoading(true);
    api.listQuizzes(secret)
      .then(setQuizzes)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(load, [secret]);

  const setOption = (i: number, val: string) => {
    setForm(f => { const opts = [...f.options]; opts[i] = val; return { ...f, options: opts }; });
  };

  const onCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErr('');
    const options = form.options.filter(o => o.trim());
    // remap correctIndex from original slots to filtered array index
    const correctOption = form.options[form.correctIndex];
    const remappedIndex = options.indexOf(correctOption ?? '');
    if (!form.question.trim()) return setFormErr('Pergunta obrigatória.');
    if (options.length < 2) return setFormErr('Mínimo 2 opções.');
    if (!correctOption?.trim() || remappedIndex === -1) return setFormErr('A opção correta não pode estar vazia.');
    setCreating(true);
    try {
      await api.createQuiz(secret, { question: form.question, options, correctIndex: remappedIndex });
      setForm(EMPTY_FORM);
      load();
    } catch {
      setFormErr('Erro ao criar quiz.');
    } finally {
      setCreating(false);
    }
  };

  const onClose = async (quizId: string) => {
    if (!confirm('Encerrar este quiz?')) return;
    await api.closeQuiz(secret, quizId);
    load();
  };

  return (
    <div>
      <h2 style={{ color: '#1C1A14', fontSize: '22px', fontWeight: 800, marginBottom: '20px' }}>
        Gerenciar Quiz
      </h2>

      {/* Create form */}
      <div style={{ ...card, borderColor: '#D4AF37', background: '#FFFDF5' }}>
        <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#1C1A14', marginBottom: '16px' }}>Novo quiz</h3>
        <form onSubmit={e => void onCreate(e)}>
          <div style={{ marginBottom: '12px' }}>
            <label style={label}>Pergunta</label>
            <input style={inputStyle} value={form.question} onChange={e => setForm(f => ({ ...f, question: e.target.value }))} placeholder="Qual time ganhou a Copa de 2002?" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
            {form.options.map((opt, i) => (
              <div key={i}>
                <label style={label}>Opção {String.fromCharCode(65 + i)}</label>
                <input style={inputStyle} value={opt} onChange={e => setOption(i, e.target.value)} placeholder={`Opção ${String.fromCharCode(65 + i)}`} />
              </div>
            ))}
          </div>
          <div style={{ marginBottom: '16px' }}>
            <label style={label}>Resposta correta</label>
            <select
              style={{ ...inputStyle, width: 'auto' }}
              value={form.correctIndex}
              onChange={e => setForm(f => ({ ...f, correctIndex: parseInt(e.target.value) }))}
            >
              {form.options.map((opt, i) => (
                <option key={i} value={i}>{String.fromCharCode(65 + i)} — {opt || '(vazio)'}</option>
              ))}
            </select>
          </div>
          {formErr && <p style={{ color: '#DC2626', fontSize: '13px', marginBottom: '10px' }}>{formErr}</p>}
          <button type="submit" disabled={creating} style={btn('#D4AF37', '#1C1A14')}>
            {creating ? 'Criando…' : '+ Criar quiz'}
          </button>
        </form>
      </div>

      {/* List */}
      {loading ? <p style={{ color: '#9C9486' }}>Carregando…</p> : quizzes.length === 0 ? (
        <p style={{ color: '#9C9486', textAlign: 'center', padding: '40px 0' }}>Nenhum quiz criado ainda.</p>
      ) : (
        quizzes.sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map(q => (
          <div key={q.quizId} style={card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <span style={{
                    background: q.status === 'ACTIVE' ? '#dcfce7' : '#f1f5f9',
                    color: q.status === 'ACTIVE' ? '#166534' : '#64748b',
                    fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '999px',
                  }}>{q.status}</span>
                  <span style={{ fontSize: '12px', color: '#9C9486' }}>{fmtDate(q.createdAt)}</span>
                </div>
                <p style={{ fontWeight: 700, fontSize: '15px', color: '#1C1A14', margin: '0 0 8px' }}>{q.question}</p>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {q.options.map((opt, i) => (
                    <span key={i} style={{
                      padding: '3px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 600,
                      background: i === q.correctIndex ? '#dcfce7' : '#f8f7f4',
                      color: i === q.correctIndex ? '#166534' : '#9C9486',
                      border: i === q.correctIndex ? '1px solid #bbf7d0' : '1px solid #E5DCC4',
                    }}>
                      {String.fromCharCode(65 + i)}. {opt}
                      {i === q.correctIndex && ' ✓'}
                    </span>
                  ))}
                </div>
                <p style={{ fontSize: '12px', color: '#9C9486', marginTop: '8px' }}>
                  {q.totalAnswers} {q.totalAnswers === 1 ? 'resposta' : 'respostas'}
                  {q.answerCounts && q.totalAnswers > 0 && ` · ${Math.round(((q.answerCounts[q.correctIndex] ?? 0) / q.totalAnswers) * 100)}% acertaram`}
                </p>
              </div>
              {q.status === 'ACTIVE' && (
                <button onClick={() => void onClose(q.quizId)} style={btn('#fee2e2', '#991b1b')}>
                  Encerrar
                </button>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

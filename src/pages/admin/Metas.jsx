import { useEffect, useState } from 'react';
import { IcMais, IcLixeira, IcAlerta, IcCheck } from '../../components/Icones.jsx';
import { msgErro } from './erros.js';

const PRODUTOS = [
  { id: 'grad', label: 'Graduação' },
  { id: 'pos',  label: 'Pós-Graduação' },
  { id: 'tec',  label: 'Técnico' },
  { id: 'prof', label: 'Profissionalizante' },
];

function SpaceItem({ space, onChange, onRemover, index }) {
  const [aberto, setAberto] = useState(false);
  return (
    <div className="space-item">
      <button type="button" className="space-header" onClick={() => setAberto(!aberto)}>
        <span className="space-label">
          Checkpoint {index + 1}
          {space.data ? ` — ${space.data}` : ''}
          {space.meta ? ` (meta: ${space.meta})` : ''}
        </span>
        <span className="space-chevron">{aberto ? '▲' : '▼'}</span>
      </button>

      {aberto && (
        <div className="space-corpo">
          <div className="duas-colunas">
            <div className="campo">
              <label>Data do checkpoint</label>
              <input
                type="date"
                className="campo-input"
                value={space.data || ''}
                onChange={(e) => onChange({ ...space, data: e.target.value })}
              />
            </div>
            <div className="campo">
              <label>Meta total até aqui</label>
              <input
                type="number"
                className="campo-input"
                min="0"
                value={space.meta || ''}
                placeholder="Ex: 30"
                onChange={(e) => onChange({ ...space, meta: Number(e.target.value) })}
              />
            </div>
          </div>

          <p className="campo-label-sec">Meta por produto neste checkpoint</p>
          <div className="dash-produtos" style={{ gap: 8, marginBottom: 10 }}>
            {PRODUTOS.map((p) => (
              <div key={p.id} className="campo" style={{ margin: 0 }}>
                <label style={{ fontSize: 13 }}>{p.label}</label>
                <input
                  type="number"
                  className="campo-input"
                  min="0"
                  value={space.porProduto?.[p.id] || ''}
                  placeholder="0"
                  onChange={(e) =>
                    onChange({ ...space, porProduto: { ...space.porProduto, [p.id]: Number(e.target.value) } })
                  }
                />
              </div>
            ))}
          </div>

          <button
            type="button"
            className="btn btn-texto perigo"
            onClick={onRemover}
          >
            <IcLixeira width={16} height={16} /> Remover checkpoint
          </button>
        </div>
      )}
    </div>
  );
}

export default function Metas({ repo, processo }) {
  const [meta, setMeta]         = useState(null);
  const [form, setForm]         = useState({
    metaGeral: '',
    porProduto: { grad: '', pos: '', tec: '', prof: '' },
    spaces: [],
    tutores: [],
    porTutor: {},
  });
  const [novoTutor,  setNovoTutor]  = useState('');
  const [salvando,   setSalvando]   = useState(false);
  const [aviso,      setAviso]      = useState('');
  const [erro,       setErro]       = useState('');

  useEffect(() => {
    if (!repo || !processo) return;
    return repo.observarMeta(processo.id, (m) => {
      setMeta(m);
      if (m) {
        setForm({
          metaGeral:  m.metaGeral  || '',
          porProduto: m.porProduto || { grad: '', pos: '', tec: '', prof: '' },
          spaces:     m.spaces     || [],
          tutores:    m.tutores    || [],
          porTutor:   m.porTutor   || {},
        });
      }
    }, (e) => setErro(msgErro(e)));
  }, [repo, processo]);

  async function salvar(e) {
    e.preventDefault();
    setSalvando(true);
    setAviso('');
    setErro('');
    try {
      await repo.salvarMeta(processo.id, {
        metaGeral:  Number(form.metaGeral) || 0,
        porProduto: Object.fromEntries(
          Object.entries(form.porProduto).map(([k, v]) => [k, Number(v) || 0]),
        ),
        spaces: form.spaces.map((s) => ({
          ...s,
          meta: Number(s.meta) || 0,
          porProduto: Object.fromEntries(
            Object.entries(s.porProduto || {}).map(([k, v]) => [k, Number(v) || 0]),
          ),
        })),
        tutores:  form.tutores,
        porTutor: Object.fromEntries(
          Object.entries(form.porTutor).map(([k, v]) => [k, Number(v) || 0]),
        ),
      });
      setAviso('Metas salvas com sucesso!');
    } catch (err) {
      setErro(msgErro(err));
    } finally {
      setSalvando(false);
    }
  }

  function addSpace() {
    setForm((f) => ({
      ...f,
      spaces: [...f.spaces, { data: '', meta: '', porProduto: {} }],
    }));
  }

  function addTutor() {
    const nome = novoTutor.trim();
    if (!nome || form.tutores.includes(nome)) return;
    setForm((f) => ({ ...f, tutores: [...f.tutores, nome] }));
    setNovoTutor('');
  }

  function removerTutor(nome) {
    setForm((f) => {
      const { [nome]: _, ...restoPorTutor } = f.porTutor;
      return { ...f, tutores: f.tutores.filter((t) => t !== nome), porTutor: restoPorTutor };
    });
  }

  if (!processo) {
    return <div className="dash-vazio"><p>Selecione um processo para configurar as metas.</p></div>;
  }

  return (
    <form className="metas-wrap" onSubmit={salvar} noValidate>
      <div className="metas-header">
        <h2>Metas — {processo.nome || processo.id}</h2>
        {aviso && <p className="aviso-ok"><IcCheck width={16} height={16} /> {aviso}</p>}
        {erro  && <div className="alerta" role="alert"><IcAlerta width={18} height={18} /> {erro}</div>}
      </div>

      {/* ── Meta geral ── */}
      <div className="cartao-adm">
        <h3 className="dash-secao-titulo">Meta geral</h3>
        <div className="campo" style={{ maxWidth: 220 }}>
          <label>Total de matrículas</label>
          <input
            type="number"
            className="campo-input"
            min="0"
            value={form.metaGeral}
            placeholder="Ex: 100"
            onChange={(e) => setForm((f) => ({ ...f, metaGeral: e.target.value }))}
          />
        </div>
      </div>

      {/* ── Por produto ── */}
      <div className="cartao-adm">
        <h3 className="dash-secao-titulo">Meta por produto</h3>
        <div className="dash-produtos">
          {PRODUTOS.map((p) => (
            <div key={p.id} className="campo" style={{ margin: 0 }}>
              <label>{p.label}</label>
              <input
                type="number"
                className="campo-input"
                min="0"
                value={form.porProduto[p.id] || ''}
                placeholder="0"
                onChange={(e) =>
                  setForm((f) => ({ ...f, porProduto: { ...f.porProduto, [p.id]: e.target.value } }))
                }
              />
            </div>
          ))}
        </div>
      </div>

      {/* ── Spaces / Checkpoints ── */}
      <div className="cartao-adm">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <h3 className="dash-secao-titulo" style={{ margin: 0 }}>Checkpoints (Spaces)</h3>
          <button type="button" className="btn btn-secundario pequeno" onClick={addSpace}>
            <IcMais width={16} height={16} /> Adicionar
          </button>
        </div>
        {form.spaces.length === 0 && (
          <p className="vazio-txt">Nenhum checkpoint ainda. Adicione marcos intermediários de meta.</p>
        )}
        {form.spaces.map((s, i) => (
          <SpaceItem
            key={i}
            index={i}
            space={s}
            onChange={(novo) => setForm((f) => {
              const spaces = [...f.spaces];
              spaces[i] = novo;
              return { ...f, spaces };
            })}
            onRemover={() => setForm((f) => ({ ...f, spaces: f.spaces.filter((_, j) => j !== i) }))}
          />
        ))}
      </div>

      {/* ── Tutores ── */}
      <div className="cartao-adm">
        <h3 className="dash-secao-titulo">Tutores e metas individuais</h3>
        <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
          <input
            type="text"
            className="campo-input"
            style={{ flex: 1, minWidth: 180 }}
            placeholder="Nome do tutor (ex: nainanda.soares)"
            value={novoTutor}
            onChange={(e) => setNovoTutor(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTutor())}
          />
          <button type="button" className="btn btn-secundario" onClick={addTutor}>
            <IcMais width={16} height={16} /> Adicionar
          </button>
        </div>

        {form.tutores.length === 0 && (
          <p className="vazio-txt">Nenhum tutor cadastrado.</p>
        )}

        {form.tutores.map((t) => (
          <div key={t} className="tutor-meta-row">
            <span className="tutor-nome">{t}</span>
            {PRODUTOS.map((p) => (
              <div key={p.id} className="tutor-meta-campo">
                <label style={{ fontSize: 12 }}>{p.label}</label>
                <input
                  type="number"
                  className="campo-input"
                  min="0"
                  style={{ padding: '8px 10px', fontSize: 14 }}
                  value={form.porTutor?.[`${t}__${p.id}`] || ''}
                  placeholder="0"
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      porTutor: { ...f.porTutor, [`${t}__${p.id}`]: e.target.value },
                    }))
                  }
                />
              </div>
            ))}
            <button
              type="button"
              className="btn-icone"
              onClick={() => removerTutor(t)}
              aria-label={`Remover ${t}`}
            >
              <IcLixeira width={18} height={18} />
            </button>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '0 0 24px' }}>
        <button type="submit" className="btn btn-primario" disabled={salvando} style={{ minWidth: 160 }}>
          {salvando ? 'Salvando…' : 'Salvar metas'}
        </button>
      </div>
    </form>
  );
}

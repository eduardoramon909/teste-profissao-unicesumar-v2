import { useEffect, useMemo, useState } from 'react';
import { IcEditar, IcFechar, IcAlerta, IcCheck } from '../../components/Icones.jsx';
import { msgErro } from './erros.js';
import { createPortal } from 'react-dom';

const PRODUTOS = [
  { id: 'grad', label: 'Graduação' },
  { id: 'pos',  label: 'Pós-Graduação' },
  { id: 'tec',  label: 'Técnico' },
  { id: 'prof', label: 'Profissionalizante' },
];

const PROD_LABEL = Object.fromEntries(PRODUTOS.map((p) => [p.id, p.label]));

function nomeDoEmail(email) {
  return (email || '').split('@')[0] || email || '';
}

function moeda(v) {
  if (!v && v !== 0) return '';
  return Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

/** Modal de edição de bonificação de uma matrícula */
function EditarBonificacao({ mat, campanhas, repo, onFechar }) {
  const [f, setF] = useState({
    souMais:  mat.souMais  || '',
    campanha: mat.campanha || '',
    gestor:   mat.gestor   || '',
    pago_soumais:  mat.pago_soumais  || false,
    pago_campanha: mat.pago_campanha || false,
    pago_gestor:   mat.pago_gestor   || false,
  });
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro]         = useState('');

  async function salvar(e) {
    e.preventDefault();
    setSalvando(true);
    setErro('');
    try {
      await repo.atualizarMatricula(mat.id, {
        souMais:  f.souMais,
        campanha: f.campanha,
        gestor:   f.gestor,
        pago_soumais:  f.pago_soumais,
        pago_campanha: f.pago_campanha,
        pago_gestor:   f.pago_gestor,
      });
      onFechar();
    } catch (err) {
      setErro(msgErro(err));
      setSalvando(false);
    }
  }

  // Campanhas válidas para este produto
  const hoje = new Date().toISOString().slice(0, 10);
  const campanhasValidas = (campanhas || []).filter(
    (c) => (!c.inicio || c.inicio <= mat.data) && (!c.fim || c.fim >= mat.data) &&
           (!c.produtos?.length || c.produtos.includes(mat.produto)),
  );

  return createPortal(
    <div className="modal-fundo" onMouseDown={(e) => e.target === e.currentTarget && onFechar()}>
      <form className="modal-folha editor" role="dialog" aria-modal="true" aria-label="Editar bonificação" onSubmit={salvar} noValidate>
        <header className="seletor-topo">
          <h2>Bonificação — {PROD_LABEL[mat.produto] || mat.produto}</h2>
          <button type="button" className="btn-icone" onClick={onFechar} aria-label="Fechar"><IcFechar /></button>
        </header>

        <div className="editor-corpo">
          <p className="editor-info">
            {mat.data} · {mat.quantidade}x · Tutor: {mat.tutor}
          </p>

          {/* Sou+ */}
          <div className="campo">
            <label htmlFor="eb-soumais">Sou + (valor da sede)</label>
            <input
              id="eb-soumais"
              type="number"
              step="0.01"
              min="0"
              className="campo-input"
              placeholder="R$ 0,00"
              value={f.souMais}
              onChange={(e) => setF({ ...f, souMais: e.target.value })}
            />
          </div>

          {/* Campanha */}
          <div className="campo">
            <label htmlFor="eb-campanha">Campanha (valor)</label>
            {campanhasValidas.length > 0 ? (
              <select
                id="eb-campanha"
                className="campo-select"
                value={f.campanha}
                onChange={(e) => setF({ ...f, campanha: e.target.value })}
              >
                <option value="">Sem campanha</option>
                {campanhasValidas.map((c) => (
                  <option key={c.id} value={c.valorUnitario || 0}>
                    {c.nome} (R$ {c.valorUnitario || 0})
                  </option>
                ))}
              </select>
            ) : (
              <input
                id="eb-campanha"
                type="number"
                step="0.01"
                min="0"
                className="campo-input"
                placeholder="R$ 0,00"
                value={f.campanha}
                onChange={(e) => setF({ ...f, campanha: e.target.value })}
              />
            )}
          </div>

          {/* Gestor */}
          <div className="campo">
            <label htmlFor="eb-gestor">Gestor (campanha interna)</label>
            <input
              id="eb-gestor"
              type="number"
              step="0.01"
              min="0"
              className="campo-input"
              placeholder="R$ 0,00"
              value={f.gestor}
              onChange={(e) => setF({ ...f, gestor: e.target.value })}
            />
          </div>

          {/* Flags de pagamento */}
          <div className="flags-grupo">
            {[
              { key: 'pago_soumais',  label: 'Sou+ pago',     ativo: Boolean(f.souMais)  },
              { key: 'pago_campanha', label: 'Campanha paga',  ativo: Boolean(f.campanha) },
              { key: 'pago_gestor',   label: 'Gestor pago',    ativo: Boolean(f.gestor)   },
            ].map(({ key, label, ativo }) =>
              ativo ? (
                <label key={key} className="flag-check">
                  <input
                    type="checkbox"
                    checked={f[key]}
                    onChange={(e) => setF({ ...f, [key]: e.target.checked })}
                  />
                  <span className="check-caixa" aria-hidden="true"><IcCheck width={14} height={14} /></span>
                  {label}
                </label>
              ) : null,
            )}
          </div>

          {erro && <p className="msg-erro" role="alert">{erro}</p>}
        </div>

        <footer className="editor-rodape">
          <span className="espaco" />
          <button type="button" className="btn btn-secundario" onClick={onFechar}>Cancelar</button>
          <button type="submit" className="btn btn-primario" disabled={salvando}>
            {salvando ? 'Salvando…' : 'Salvar'}
          </button>
        </footer>
      </form>
    </div>,
    document.body,
  );
}

export default function SouMais({ repo, user, processo }) {
  const [matriculas,  setMatriculas]  = useState(null);
  const [campanhas,   setCampanhas]   = useState([]);
  const [filtProduto, setFiltProduto] = useState('');
  const [filtInicio,  setFiltInicio]  = useState('');
  const [filtFim,     setFiltFim]     = useState('');
  const [editando,    setEditando]    = useState(null);
  const [erro,        setErro]        = useState('');

  const tutorAtual = nomeDoEmail(user?.email || '');

  useEffect(() => {
    if (!repo || !processo) return;
    const u1 = repo.observarMatriculas(processo.id, setMatriculas, (e) => setErro(msgErro(e)));
    const u2 = repo.observarCampanhas(setCampanhas, () => {});
    return () => { u1(); u2(); };
  }, [repo, processo]);

  const minhas = useMemo(() => {
    return (matriculas || []).filter((m) => m.tutor === tutorAtual);
  }, [matriculas, tutorAtual]);

  const filtradas = useMemo(() => {
    return [...minhas]
      .filter((m) => {
        if (filtProduto && m.produto !== filtProduto) return false;
        if (filtInicio  && m.data < filtInicio) return false;
        if (filtFim     && m.data > filtFim)    return false;
        return true;
      })
      .sort((a, b) => (b.data || '').localeCompare(a.data || ''));
  }, [minhas, filtProduto, filtInicio, filtFim]);

  // Totais
  const totais = useMemo(() => ({
    souMais:  filtradas.reduce((s, m) => s + (Number(m.souMais)  || 0), 0),
    campanha: filtradas.reduce((s, m) => s + (Number(m.campanha) || 0), 0),
    gestor:   filtradas.reduce((s, m) => s + (Number(m.gestor)   || 0), 0),
    qtd:      filtradas.reduce((s, m) => s + (Number(m.quantidade) || 1), 0),
  }), [filtradas]);

  // Todos os 3 pagos = riscado
  function todoPago(m) {
    const temCamp  = Boolean(m.campanha);
    const temGest  = Boolean(m.gestor);
    return m.pago_soumais && (!temCamp || m.pago_campanha) && (!temGest || m.pago_gestor);
  }

  if (!processo) return <div className="dash-vazio"><p>Selecione um processo.</p></div>;

  return (
    <div className="soumais-wrap">
      {erro && <div className="alerta" role="alert"><IcAlerta width={20} height={20} /> {erro}</div>}

      <div className="metas-header">
        <h2>Sou + — {tutorAtual}</h2>
      </div>

      {/* Filtros */}
      <div className="cartao-adm">
        <div className="soumais-filtros">
          <div className="campo" style={{ margin: 0 }}>
            <label>Produto</label>
            <select className="campo-select" value={filtProduto} onChange={(e) => setFiltProduto(e.target.value)}>
              <option value="">Todos</option>
              {PRODUTOS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
            </select>
          </div>
          <div className="campo" style={{ margin: 0 }}>
            <label>De</label>
            <input type="date" className="campo-input" value={filtInicio} onChange={(e) => setFiltInicio(e.target.value)} />
          </div>
          <div className="campo" style={{ margin: 0 }}>
            <label>Até</label>
            <input type="date" className="campo-input" value={filtFim} onChange={(e) => setFiltFim(e.target.value)} />
          </div>
          <button type="button" className="btn btn-secundario pequeno" onClick={() => { setFiltProduto(''); setFiltInicio(''); setFiltFim(''); }}>
            Limpar
          </button>
        </div>
      </div>

      {/* Resumo totais */}
      <div className="dash-grid">
        <div className="cartao-adm dash-card-geral">
          <p className="dash-card-label">Matrículas</p>
          <p className="dash-card-num">{totais.qtd}</p>
        </div>
        <div className="cartao-adm dash-card-geral">
          <p className="dash-card-label">Total Sou+</p>
          <p className="dash-card-num" style={{ fontSize: 22 }}>{moeda(totais.souMais)}</p>
        </div>
        {totais.campanha > 0 && (
          <div className="cartao-adm dash-card-geral">
            <p className="dash-card-label">Total Campanhas</p>
            <p className="dash-card-num" style={{ fontSize: 22 }}>{moeda(totais.campanha)}</p>
          </div>
        )}
        {totais.gestor > 0 && (
          <div className="cartao-adm dash-card-geral">
            <p className="dash-card-label">Total Gestor</p>
            <p className="dash-card-num" style={{ fontSize: 22 }}>{moeda(totais.gestor)}</p>
          </div>
        )}
      </div>

      {/* Tabela */}
      <div className="cartao-adm">
        {matriculas === null && <p className="vazio-txt pad">Carregando…</p>}
        {matriculas !== null && filtradas.length === 0 && (
          <p className="vazio-txt pad">Nenhuma matrícula encontrada.</p>
        )}
        {filtradas.length > 0 && (
          <table className="tabela">
            <thead>
              <tr>
                <th>Data</th>
                <th>Produto</th>
                <th>Qtd</th>
                <th>Sou+</th>
                <th>Campanha</th>
                <th>Gestor</th>
                <th><span className="sr-only">Editar</span></th>
              </tr>
            </thead>
            <tbody>
              {filtradas.map((m) => {
                const riscado = todoPago(m);
                return (
                  <tr key={m.id} className={riscado ? 'mat-pago' : ''}>
                    <td data-label="Data">{m.data}</td>
                    <td data-label="Produto">{PROD_LABEL[m.produto] || m.produto}</td>
                    <td data-label="Qtd">{m.quantidade || 1}</td>
                    <td data-label="Sou+">
                      {m.souMais ? (
                        <span className={`bonus-val${m.pago_soumais ? ' pago' : ''}`}>
                          {moeda(m.souMais)}
                        </span>
                      ) : <span className="vazio-txt">—</span>}
                    </td>
                    <td data-label="Campanha">
                      {m.campanha ? (
                        <span className={`bonus-val${m.pago_campanha ? ' pago' : ''}`}>
                          {moeda(m.campanha)}
                        </span>
                      ) : <span className="vazio-txt">—</span>}
                    </td>
                    <td data-label="Gestor">
                      {m.gestor ? (
                        <span className={`bonus-val${m.pago_gestor ? ' pago' : ''}`}>
                          {moeda(m.gestor)}
                        </span>
                      ) : <span className="vazio-txt">—</span>}
                    </td>
                    <td className="col-acoes">
                      <button
                        type="button"
                        className="btn-icone"
                        onClick={() => setEditando(m)}
                        aria-label="Editar bonificação"
                      >
                        <IcEditar />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {editando && (
        <EditarBonificacao
          key={editando.id}
          mat={editando}
          campanhas={campanhas}
          repo={repo}
          onFechar={() => setEditando(null)}
        />
      )}
    </div>
  );
}

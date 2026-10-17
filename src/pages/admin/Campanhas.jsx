import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { IcMais, IcEditar, IcLixeira, IcFechar, IcAlerta } from '../../components/Icones.jsx';
import { msgErro } from './erros.js';

const PRODUTOS = [
  { id: 'grad', label: 'Graduação' },
  { id: 'pos',  label: 'Pós-Graduação' },
  { id: 'tec',  label: 'Técnico' },
  { id: 'prof', label: 'Profissionalizante' },
];

const TIPOS_GATILHO = [
  { id: 'none',    label: 'Sem gatilho — vale por matrícula' },
  { id: 'a_cada',  label: 'A cada N matrículas — valor sobe' },
  { id: 'minimo',  label: 'Mínimo N — só ganha se fizer pelo menos N' },
];

const CAMP_VAZIA = {
  nome: '',
  inicio: '',
  fim: '',
  valorUnitario: '',
  produtos: [],
  tipoGatilho: 'none',
  gatilhoN: '',
  gatilhoValorExtra: '',
};

function FormCampanha({ inicial, onSalvar, onFechar, salvando }) {
  const [f, setF] = useState(inicial || CAMP_VAZIA);

  function toggleProduto(id) {
    setF((prev) => ({
      ...prev,
      produtos: prev.produtos.includes(id)
        ? prev.produtos.filter((p) => p !== id)
        : [...prev.produtos, id],
    }));
  }

  function submit(e) {
    e.preventDefault();
    if (!f.nome.trim()) return;
    onSalvar(f);
  }

  return createPortal(
    <div className="modal-fundo" onMouseDown={(e) => e.target === e.currentTarget && onFechar()}>
      <form className="modal-folha editor" role="dialog" aria-modal="true" aria-label="Campanha" onSubmit={submit} noValidate>
        <header className="seletor-topo">
          <h2>{inicial?.id ? 'Editar campanha' : 'Nova campanha'}</h2>
          <button type="button" className="btn-icone" onClick={onFechar} aria-label="Fechar"><IcFechar /></button>
        </header>

        <div className="editor-corpo">
          <div className="campo">
            <label>Nome da campanha</label>
            <input
              type="text"
              className="campo-input"
              required
              placeholder="Ex: Campanha de outubro"
              value={f.nome}
              onChange={(e) => setF({ ...f, nome: e.target.value })}
            />
          </div>

          <div className="duas-colunas">
            <div className="campo">
              <label>Início</label>
              <input type="date" className="campo-input" value={f.inicio} onChange={(e) => setF({ ...f, inicio: e.target.value })} />
            </div>
            <div className="campo">
              <label>Fim</label>
              <input type="date" className="campo-input" value={f.fim} onChange={(e) => setF({ ...f, fim: e.target.value })} />
            </div>
          </div>

          <div className="campo">
            <label>Valor por matrícula (R$)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              className="campo-input"
              placeholder="0,00"
              value={f.valorUnitario}
              onChange={(e) => setF({ ...f, valorUnitario: e.target.value })}
            />
          </div>

          <div className="campo">
            <label>Produtos aceitos</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 6 }}>
              {PRODUTOS.map((p) => (
                <label key={p.id} className="flag-check">
                  <input
                    type="checkbox"
                    checked={f.produtos.includes(p.id)}
                    onChange={() => toggleProduto(p.id)}
                  />
                  <span className="check-caixa" aria-hidden="true">✓</span>
                  {p.label}
                </label>
              ))}
            </div>
            {f.produtos.length === 0 && (
              <p className="dica">Nenhum selecionado = todos os produtos são aceitos.</p>
            )}
          </div>

          <div className="campo">
            <label>Tipo de gatilho</label>
            <select
              className="campo-select"
              value={f.tipoGatilho}
              onChange={(e) => setF({ ...f, tipoGatilho: e.target.value })}
            >
              {TIPOS_GATILHO.map((t) => (
                <option key={t.id} value={t.id}>{t.label}</option>
              ))}
            </select>
          </div>

          {f.tipoGatilho !== 'none' && (
            <div className="duas-colunas">
              <div className="campo">
                <label>{f.tipoGatilho === 'a_cada' ? 'A cada (N)' : 'Mínimo (N)'}</label>
                <input
                  type="number"
                  min="1"
                  className="campo-input"
                  placeholder="Ex: 2"
                  value={f.gatilhoN}
                  onChange={(e) => setF({ ...f, gatilhoN: e.target.value })}
                />
              </div>
              {f.tipoGatilho === 'a_cada' && (
                <div className="campo">
                  <label>Valor extra (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="campo-input"
                    placeholder="0,00"
                    value={f.gatilhoValorExtra}
                    onChange={(e) => setF({ ...f, gatilhoValorExtra: e.target.value })}
                  />
                </div>
              )}
            </div>
          )}
        </div>

        <footer className="editor-rodape">
          <span className="espaco" />
          <button type="button" className="btn btn-secundario" onClick={onFechar}>Cancelar</button>
          <button type="submit" className="btn btn-primario" disabled={salvando}>
            {salvando ? 'Salvando…' : 'Salvar campanha'}
          </button>
        </footer>
      </form>
    </div>,
    document.body,
  );
}

export default function Campanhas({ repo, processo }) {
  const [campanhas, setCampanhas] = useState([]);
  const [editando,  setEditando]  = useState(null); // null | 'nova' | objeto
  const [salvando,  setSalvando]  = useState(false);
  const [erro,      setErro]      = useState('');
  const [confirma,  setConfirma]  = useState(null);

  useEffect(() => {
    if (!repo) return;
    return repo.observarCampanhas((lista) => {
      setCampanhas([...lista].sort((a, b) => (b.inicio || '').localeCompare(a.inicio || '')));
    }, (e) => setErro(msgErro(e)));
  }, [repo]);

  async function salvarCampanha(dados) {
    setSalvando(true);
    setErro('');
    try {
      if (editando?.id) {
        await repo.atualizarCampanha(editando.id, dados);
      } else {
        const id = repo.novoCampanhaId ? repo.novoCampanhaId() : crypto.randomUUID();
        await repo.criarCampanha(id, dados);
      }
      setEditando(null);
    } catch (err) {
      setErro(msgErro(err));
    } finally {
      setSalvando(false);
    }
  }

  async function excluir(id) {
    try {
      await repo.excluirCampanha(id);
      setConfirma(null);
    } catch (err) {
      setErro(msgErro(err));
    }
  }

  const hoje = new Date().toISOString().slice(0, 10);

  function statusCampanha(c) {
    if (!c.inicio && !c.fim) return 'permanente';
    if (c.fim && c.fim < hoje) return 'encerrada';
    if (c.inicio && c.inicio > hoje) return 'futura';
    return 'ativa';
  }

  return (
    <div className="campanhas-wrap">
      {erro && <div className="alerta" role="alert"><IcAlerta width={20} height={20} /> {erro}</div>}

      <div className="metas-header">
        <h2>Campanhas</h2>
        <button type="button" className="btn btn-primario" onClick={() => setEditando('nova')}>
          <IcMais width={18} height={18} /> Nova campanha
        </button>
      </div>

      {campanhas.length === 0 && (
        <div className="cartao-adm">
          <p className="vazio-txt pad">Nenhuma campanha cadastrada ainda.</p>
        </div>
      )}

      {campanhas.map((c) => {
        const status = statusCampanha(c);
        return (
          <div key={c.id} className="cartao-adm camp-card">
            <div className="camp-cab">
              <div>
                <strong className="camp-nome">{c.nome}</strong>
                <span className={`selo camp-status camp-${status}`}>
                  {status === 'ativa' ? 'Ativa' : status === 'futura' ? 'Futura' : status === 'encerrada' ? 'Encerrada' : 'Permanente'}
                </span>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button type="button" className="btn-icone" onClick={() => setEditando(c)} aria-label="Editar">
                  <IcEditar />
                </button>
                {confirma === c.id ? (
                  <span className="confirma">
                    Excluir?
                    <button type="button" className="btn btn-perigo pequeno" onClick={() => excluir(c.id)}>Sim</button>
                    <button type="button" className="btn btn-texto pequeno" onClick={() => setConfirma(null)}>Não</button>
                  </span>
                ) : (
                  <button type="button" className="btn-icone" onClick={() => setConfirma(c.id)} aria-label="Excluir">
                    <IcLixeira />
                  </button>
                )}
              </div>
            </div>

            <div className="camp-detalhes">
              {(c.inicio || c.fim) && (
                <span className="camp-detalhe">{c.inicio || '—'} → {c.fim || '—'}</span>
              )}
              <span className="camp-detalhe">
                R$ {Number(c.valorUnitario || 0).toFixed(2)} / matrícula
              </span>
              {c.produtos?.length > 0 && (
                <span className="camp-detalhe">
                  {c.produtos.map((p) => PRODUTOS.find((x) => x.id === p)?.label || p).join(', ')}
                </span>
              )}
              {c.tipoGatilho && c.tipoGatilho !== 'none' && (
                <span className="camp-detalhe camp-gatilho">
                  {c.tipoGatilho === 'a_cada'
                    ? `A cada ${c.gatilhoN}: +R$ ${c.gatilhoValorExtra}`
                    : `Mínimo ${c.gatilhoN} matrículas`}
                </span>
              )}
            </div>
          </div>
        );
      })}

      {(editando === 'nova' || (editando && editando !== 'nova')) && (
        <FormCampanha
          inicial={editando === 'nova' ? null : editando}
          salvando={salvando}
          onSalvar={salvarCampanha}
          onFechar={() => setEditando(null)}
        />
      )}
    </div>
  );
}

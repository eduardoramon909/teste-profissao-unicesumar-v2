import { useState } from 'react';
import { IcMais, IcLixeira, IcAlerta, IcCheck } from '../../components/Icones.jsx';
import { msgErro } from './erros.js';

const PROC_VAZIO = { nome: '', inicio: '', fim: '' };

export default function Processo({ repo, processos }) {
  const [form,     setForm]     = useState(PROC_VAZIO);
  const [salvando, setSalvando] = useState(false);
  const [confirma, setConfirma] = useState(null);
  const [aviso,    setAviso]    = useState('');
  const [erro,     setErro]     = useState('');

  const hoje = new Date().toISOString().slice(0, 10);

  async function criarProcesso(e) {
    e.preventDefault();
    if (!form.nome.trim() || !form.inicio || !form.fim) {
      setErro('Preencha nome, início e fim.');
      return;
    }
    setSalvando(true);
    setErro('');
    setAviso('');
    try {
      const id = repo.novaProcessoId ? repo.novaProcessoId() : crypto.randomUUID();
      await repo.criarProcesso(id, {
        nome:   form.nome.trim(),
        inicio: form.inicio,
        fim:    form.fim,
      });
      setForm(PROC_VAZIO);
      setAviso('Processo criado com sucesso!');
    } catch (err) {
      setErro(msgErro(err));
    } finally {
      setSalvando(false);
    }
  }

  async function excluir(id) {
    try {
      await repo.excluirProcesso(id);
      setConfirma(null);
    } catch (err) {
      setErro(msgErro(err));
    }
  }

  function statusProcesso(p) {
    if (p.fim < hoje)    return 'encerrado';
    if (p.inicio > hoje) return 'futuro';
    return 'ativo';
  }

  return (
    <div className="processo-wrap">
      {erro  && <div className="alerta" role="alert"><IcAlerta width={20} height={20} /> {erro}</div>}

      <div className="metas-header">
        <h2>Processos</h2>
        {aviso && <p className="aviso-ok"><IcCheck width={16} height={16} /> {aviso}</p>}
      </div>

      {/* Formulário de novo processo */}
      <div className="cartao-adm">
        <h3 className="dash-secao-titulo">Novo processo</h3>
        <form onSubmit={criarProcesso} noValidate>
          <div className="campo">
            <label>Nome do processo</label>
            <input
              type="text"
              className="campo-input"
              placeholder="Ex: Processo 51 — 2º Sem. 2026"
              value={form.nome}
              onChange={(e) => setForm({ ...form, nome: e.target.value })}
              required
            />
          </div>
          <div className="duas-colunas">
            <div className="campo">
              <label>Data de início</label>
              <input
                type="date"
                className="campo-input"
                value={form.inicio}
                onChange={(e) => setForm({ ...form, inicio: e.target.value })}
                required
              />
            </div>
            <div className="campo">
              <label>Data de fim</label>
              <input
                type="date"
                className="campo-input"
                value={form.fim}
                onChange={(e) => setForm({ ...form, fim: e.target.value })}
                required
              />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
            <button type="submit" className="btn btn-primario" disabled={salvando}>
              <IcMais width={18} height={18} /> {salvando ? 'Salvando…' : 'Criar processo'}
            </button>
          </div>
        </form>
      </div>

      {/* Lista de processos */}
      {processos.length === 0 && (
        <div className="cartao-adm">
          <p className="vazio-txt pad">Nenhum processo cadastrado ainda.</p>
        </div>
      )}

      {processos.map((p) => {
        const status = statusProcesso(p);
        return (
          <div key={p.id} className={`cartao-adm proc-card proc-${status}`}>
            <div className="camp-cab">
              <div>
                <strong className="camp-nome">{p.nome}</strong>
                <span className={`selo camp-status camp-${status}`}>
                  {status === 'ativo' ? 'Em andamento' : status === 'futuro' ? 'Futuro' : 'Encerrado'}
                </span>
              </div>
              <div>
                {confirma === p.id ? (
                  <span className="confirma">
                    Excluir processo e todos os dados?
                    <button type="button" className="btn btn-perigo pequeno" onClick={() => excluir(p.id)}>Sim, excluir</button>
                    <button type="button" className="btn btn-texto pequeno" onClick={() => setConfirma(null)}>Não</button>
                  </span>
                ) : (
                  <button
                    type="button"
                    className="btn-icone"
                    onClick={() => setConfirma(p.id)}
                    aria-label={`Excluir ${p.nome}`}
                  >
                    <IcLixeira />
                  </button>
                )}
              </div>
            </div>
            <p className="camp-detalhe" style={{ marginTop: 6 }}>
              {p.inicio} → {p.fim}
            </p>
          </div>
        );
      })}
    </div>
  );
}

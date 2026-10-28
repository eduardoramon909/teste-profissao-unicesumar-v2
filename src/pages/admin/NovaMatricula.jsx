import { useState } from 'react';
import { createPortal } from 'react-dom';
import { IcFechar } from '../../components/Icones.jsx';
import { PRODUTOS } from '../../lib/produtos.js';
import { msgErro } from './erros.js';

function nomeDoEmail(email) {
  return (email || '').split('@')[0] || email || '';
}

export default function NovaMatricula({ repo, user, processo, campanhas, meta, onFechar }) {
  const tutorPadrao = nomeDoEmail(user?.email || '');
  const [produto,    setProduto]    = useState(PRODUTOS[0].id);
  const [quantidade, setQuantidade] = useState(1);
  const [tutor,      setTutor]      = useState(tutorPadrao);
  const [erro,       setErro]       = useState('');
  const [salvando,   setSalvando]   = useState(false);

  const tutoresDisponiveis = meta?.tutores?.length ? meta.tutores : [tutorPadrao];

  async function salvar(e) {
    e.preventDefault();
    if (!produto || quantidade < 1) return;
    setSalvando(true);
    setErro('');
    try {
      const id = repo.novaMatriculaId ? repo.novaMatriculaId() : crypto.randomUUID();
      const hoje = new Date().toISOString().slice(0, 10);
      await repo.criarMatricula(id, {
        produto,
        quantidade:    Number(quantidade),
        tutor,
        processoId:    processo?.id || '',
        data:          hoje,
        souMais:       '',
        campanha:      '',
        gestor:        '',
        pago_soumais:  false,
        pago_campanha: false,
        pago_gestor:   false,
      });
      onFechar();
    } catch (err) {
      setErro(msgErro(err));
    } finally {
      setSalvando(false);
    }
  }

  return createPortal(
    <div className="modal-fundo" onMouseDown={(e) => e.target === e.currentTarget && onFechar()}>
      <form className="modal-folha editor" role="dialog" aria-modal="true" aria-label="Nova matrícula" onSubmit={salvar} noValidate>
        <header className="seletor-topo">
          <h2>Nova matrícula</h2>
          <button type="button" className="btn-icone" onClick={onFechar} aria-label="Fechar"><IcFechar /></button>
        </header>

        <div className="editor-corpo">
          <div className="campo">
            <label htmlFor="nm-produto">Produto</label>
            <select id="nm-produto" className="campo-select" value={produto} onChange={(e) => setProduto(e.target.value)}>
              {PRODUTOS.map((p) => (
                <option key={p.id} value={p.id}>{p.label}</option>
              ))}
            </select>
          </div>

          <div className="campo">
            <label htmlFor="nm-qtd">Quantidade</label>
            <input
              id="nm-qtd" type="number" min="1" max="99"
              value={quantidade}
              onChange={(e) => setQuantidade(Math.max(1, Number(e.target.value)))}
              className="campo-input"
            />
          </div>

          <div className="campo">
            <label htmlFor="nm-tutor">Tutor</label>
            <select id="nm-tutor" className="campo-select" value={tutor} onChange={(e) => setTutor(e.target.value)}>
              {tutoresDisponiveis.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {erro && <p className="msg-erro" role="alert">{erro}</p>}
        </div>

        <footer className="editor-rodape">
          <span className="espaco" />
          <button type="button" className="btn btn-secundario" onClick={onFechar}>Cancelar</button>
          <button type="submit" className="btn btn-primario" disabled={salvando}>
            {salvando ? 'Salvando…' : 'Registrar'}
          </button>
        </footer>
      </form>
    </div>,
    document.body,
  );
}

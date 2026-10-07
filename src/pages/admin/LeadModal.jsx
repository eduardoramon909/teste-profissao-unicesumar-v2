import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Campo from '../../components/Campo.jsx';
import CursoSelect from '../../components/CursoSelect.jsx';
import { IcFechar, IcLixeira } from '../../components/Icones.jsx';
import { acharCurso, camposDoCurso } from '../../lib/cursos.js';
import { formatarNome } from '../../lib/texto.js';
import {
  apenasDigitos, cpfValido, emailValido, formatarCPF, formatarWhatsapp, normalizarWhatsapp, nomeValido, whatsappValido,
} from '../../lib/validacoes.js';
import { msgErro } from './erros.js';

/** Edição (e exclusão) de um lead. */
export default function LeadModal({ lead, repo, onFechar }) {
  const cursoInicial = acharCurso(lead);
  const [f, setF] = useState({
    nome: lead.nome || '',
    whatsapp: formatarWhatsapp(lead.whatsapp),
    cpf: formatarCPF(lead.cpf),
    email: lead.email || '',
    curso: cursoInicial,
  });
  const [tentou, setTentou] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [confirmaExcluir, setConfirmaExcluir] = useState(false);
  const [erroGeral, setErroGeral] = useState('');

  useEffect(() => {
    const anterior = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => e.key === 'Escape' && onFechar();
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = anterior;
      window.removeEventListener('keydown', onKey);
    };
  }, [onFechar]);

  const erros = {};
  if (!nomeValido(f.nome)) erros.nome = 'Informe nome e sobrenome.';
  if (!whatsappValido(f.whatsapp)) erros.whatsapp = 'WhatsApp inválido (DDD + 9 dígitos).';
  if (!cpfValido(f.cpf)) erros.cpf = 'CPF inválido.';
  if (f.email.trim() && !emailValido(f.email)) erros.email = 'E-mail inválido.';
  const erro = (k) => (tentou ? erros[k] : undefined);

  async function salvar(e) {
    e.preventDefault();
    setTentou(true);
    setErroGeral('');
    if (Object.keys(erros).length) return;
    setSalvando(true);
    try {
      const patch = {
        nome: formatarNome(f.nome),
        whatsapp: normalizarWhatsapp(f.whatsapp),
        cpf: apenasDigitos(f.cpf),
        email: f.email.trim(),
      };
      const mudouCurso = (f.curso?.oficial || '') !== (lead.cursoPretendido || '');
      if (mudouCurso) {
        Object.assign(patch, camposDoCurso(f.curso), { origem: f.curso ? 'admin' : '' });
        // com curso definido, o lead deixa de contar como "teste não concluído"
        if (f.curso && (lead.status === 'teste_iniciado' || lead.status === 'teste_concluido')) patch.status = 'concluido';
      }
      await repo.editarLead(lead.id, patch);
      onFechar();
    } catch (err) {
      setErroGeral(msgErro(err));
    } finally {
      setSalvando(false);
    }
  }

  async function excluir() {
    setSalvando(true);
    try {
      await repo.excluirLead(lead.id);
      onFechar();
    } catch (err) {
      setErroGeral(msgErro(err));
      setSalvando(false);
    }
  }

  return createPortal(
    <div className="modal-fundo" onMouseDown={(e) => e.target === e.currentTarget && onFechar()}>
      <form className="modal-folha editor" role="dialog" aria-modal="true" aria-label="Editar lead" onSubmit={salvar} noValidate>
        <header className="seletor-topo">
          <h2>Editar lead</h2>
          <button type="button" className="btn-icone" onClick={onFechar} aria-label="Fechar"><IcFechar /></button>
        </header>

        <div className="editor-corpo">
          <Campo id="e-nome" rotulo="Nome completo" erro={erro('nome')}>
            <input id="e-nome" type="text" value={f.nome} onChange={(e) => setF({ ...f, nome: e.target.value })} autoComplete="off" />
          </Campo>
          <div className="duas-colunas">
            <Campo id="e-whats" rotulo="WhatsApp" erro={erro('whatsapp')}>
              <input id="e-whats" type="tel" inputMode="numeric" value={f.whatsapp} onChange={(e) => setF({ ...f, whatsapp: formatarWhatsapp(e.target.value) })} autoComplete="off" />
            </Campo>
            <Campo id="e-cpf" rotulo="CPF" erro={erro('cpf')}>
              <input id="e-cpf" type="text" inputMode="numeric" value={f.cpf} onChange={(e) => setF({ ...f, cpf: formatarCPF(e.target.value) })} autoComplete="off" />
            </Campo>
          </div>
          <Campo id="e-email" rotulo="E-mail" opcional erro={erro('email')}>
            <input id="e-email" type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} autoComplete="off" />
          </Campo>
          <Campo id="e-curso" rotulo="Curso pretendido" opcional>
            <CursoSelect id="e-curso" valor={f.curso} onChange={(c) => setF({ ...f, curso: c })} placeholder="Sem curso escolhido" />
          </Campo>

          {lead.perfil && (
            <p className="editor-info">
              Resultado do teste: <strong>{lead.perfil}</strong> em {lead.area}
              {lead.escolaridade ? ` (${lead.escolaridade})` : ''}.
            </p>
          )}
          {erroGeral && <p className="msg-erro" role="alert">{erroGeral}</p>}
        </div>

        <footer className="editor-rodape">
          {confirmaExcluir ? (
            <span className="confirma">
              Excluir este lead?
              <button type="button" className="btn btn-perigo" onClick={excluir} disabled={salvando}>Sim, excluir</button>
              <button type="button" className="btn btn-texto" onClick={() => setConfirmaExcluir(false)}>Não</button>
            </span>
          ) : (
            <button type="button" className="btn btn-texto perigo" onClick={() => setConfirmaExcluir(true)}>
              <IcLixeira width={18} height={18} /> Excluir
            </button>
          )}
          <span className="espaco" />
          <button type="button" className="btn btn-secundario" onClick={onFechar}>Cancelar</button>
          <button type="submit" className="btn btn-primario" disabled={salvando}>{salvando ? 'Salvando…' : 'Salvar'}</button>
        </footer>
      </form>
    </div>,
    document.body,
  );
}

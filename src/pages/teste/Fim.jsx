import { useEffect, useState } from 'react';
import { CONFIG } from '../../config.js';
import Logo from '../../components/Logo.jsx';
import { IcCheck } from '../../components/Icones.jsx';
import { getRepo } from '../../lib/db.js';
import { NOME_TIPO, selo } from '../../lib/cursos.js';
import { primeiroNome } from '../../lib/texto.js';

export default function Fim({ dados, onNovo }) {
  const [seg, setSeg] = useState(CONFIG.RESET_APOS_SEGUNDOS);
  const [enviado, setEnviado] = useState(null); // null = verificando

  useEffect(() => {
    const t = setInterval(() => setSeg((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    if (seg <= 0) onNovo();
  }, [seg, onNovo]);
  useEffect(() => {
    let ativo = true;
    getRepo().then((r) => r.sincronizado(2500)).then((ok) => ativo && setEnviado(ok));
    return () => { ativo = false; };
  }, []);

  const { curso } = dados;
  return (
    <div className="tela tela-fim">
      <div className="conteudo">
        <header className="topo"><Logo /></header>

        <section className="folha fim-card">
          <span className="fim-check" aria-hidden="true"><IcCheck width={34} height={34} strokeWidth={3} /></span>
          <h1>Tudo certo, {primeiroNome(dados.nome)}!</h1>
          <p>
            Recebemos o seu cadastro. Um consultor da {CONFIG.INSTITUICAO} vai chamar você no WhatsApp para falar sobre o curso.
          </p>

          {curso && (
            <div className="fim-curso">
              <span className="selo-tipo">{NOME_TIPO[curso.tipo]}{selo(curso) ? ` (${selo(curso)})` : ''}</span>
              <strong>{curso.nome}</strong>
              <small>Curso pretendido</small>
            </div>
          )}

          {enviado === false && (
            <p className="aviso-offline">Sem internet no momento: o cadastro ficou salvo neste aparelho e será enviado assim que a conexão voltar.</p>
          )}

          <div className="fim-matricula">
            <span>Quer garantir sua vaga?</span>
            <a href={CONFIG.URL_MATRICULA} target="_blank" rel="noreferrer">{CONFIG.SITE_MATRICULA}</a>
          </div>
        </section>

        <button type="button" className="btn btn-claro grande" onClick={onNovo}>Próximo participante</button>
        <p className="nota claro">Voltando ao início em {Math.max(seg, 0)}s</p>

        <footer className="rodape-polo">
          <strong>{CONFIG.POLO}</strong>
          <span>{CONFIG.ENDERECO_POLO}</span>
          <span>{CONFIG.TELEFONE_POLO}</span>
        </footer>
      </div>
    </div>
  );
}

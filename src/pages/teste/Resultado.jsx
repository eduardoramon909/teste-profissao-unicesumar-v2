import Logo from '../../components/Logo.jsx';
import CursoSelect from '../../components/CursoSelect.jsx';
import { IcCheck } from '../../components/Icones.jsx';
import { NOME_TIPO, selo } from '../../lib/cursos.js';

export default function Resultado({ resultado, escolha, onEscolher, onConfirmar, confirmando }) {
  const { perfil, area, tracos, cursos } = resultado;
  const selecionado = escolha?.curso?.oficial;
  const extra = escolha && escolha.origem === 'lista' ? escolha.curso : null;

  return (
    <div className="tela tela-resultado">
      <div className="conteudo largo">
        <header className="topo"><Logo /></header>

        <section className="folha perfil">
          <span className="perfil-emoji" aria-hidden="true">{perfil.emoji}</span>
          <p className="perfil-rotulo">Seu perfil</p>
          <h1>{perfil.titulo}</h1>
          <p className="perfil-texto">{perfil.texto}</p>
          <ul className="chips">
            <li className="chip destaque">{area.emoji} {area.nome}</li>
            {tracos.map((t) => <li key={t.id} className="chip">{t.rotulo}</li>)}
          </ul>
          {resultado.duracao != null && (
            <p className="perfil-tempo">Teste concluído em {Math.round(resultado.duracao)} segundos.</p>
          )}
        </section>

        <h2 className="titulo-secao">Os cursos que mais combinam com você</h2>
        <p className="subtitulo-secao">Toque em um deles para escolher como seu curso pretendido.</p>

        <ul className="cartoes-curso" role="radiogroup" aria-label="Cursos sugeridos">
          {cursos.map((c) => {
            const marcado = selecionado === c.curso.oficial;
            return (
              <li key={c.curso.oficial}>
                <button
                  type="button" role="radio" aria-checked={marcado}
                  className={`cartao-curso${marcado ? ' marcado' : ''}`}
                  onClick={() => onEscolher(c.curso, 'sugestao')}
                >
                  <span className="radio" aria-hidden="true">{marcado && <IcCheck width={16} height={16} />}</span>
                  <span className="cartao-topo">
                    <span className="selo-tipo">{NOME_TIPO[c.curso.tipo]}{selo(c.curso) ? ` (${selo(c.curso)})` : ''}</span>
                    <span className="afinidade">{c.afinidade}% de afinidade</span>
                  </span>
                  <strong className="cartao-nome">{c.curso.nome}</strong>
                  <span className="barra" aria-hidden="true"><span style={{ width: `${c.afinidade}%` }} /></span>
                  {c.motivos.length > 0 && (
                    <span className="cartao-motivo">
                      <span className="motivo-rotulo">Combina com</span>
                      {c.motivos.map((m) => <em key={m} className="motivo-chip">{m}</em>)}
                    </span>
                  )}
                  {c.naFormacao && <span className="cartao-formacao">Na direção da sua formação</span>}
                </button>
              </li>
            );
          })}

          {extra && (
            <li>
              <button type="button" role="radio" aria-checked className="cartao-curso marcado" onClick={() => {}}>
                <span className="radio" aria-hidden="true"><IcCheck width={16} height={16} /></span>
                <span className="cartao-topo">
                  <span className="selo-tipo">{NOME_TIPO[extra.tipo]}{selo(extra) ? ` (${selo(extra)})` : ''}</span>
                  <span className="afinidade">Sua escolha</span>
                </span>
                <strong className="cartao-nome">{extra.nome}</strong>
              </button>
            </li>
          )}
        </ul>

        <div className="outro-curso">
          <CursoSelect
            valor={escolha?.curso ?? null}
            abaInicial={cursos[0]?.curso.tipo ?? 'todos'}
            onChange={(c) => c && onEscolher(c, 'lista')}
            gatilho={(abrir) => (
              <button type="button" className="btn btn-texto claro" onClick={abrir}>
                Nenhum desses? Ver todos os cursos
              </button>
            )}
          />
        </div>
      </div>

      <div className="barra-acao">
        <div className="barra-acao-in">
          <p className="barra-acao-texto">
            {escolha ? <>Curso pretendido: <strong>{escolha.curso.nome}</strong></> : 'Escolha um curso para continuar'}
          </p>
          <button type="button" className="btn btn-primario" disabled={!escolha || confirmando} onClick={onConfirmar}>
            Confirmar curso
          </button>
        </div>
      </div>
    </div>
  );
}

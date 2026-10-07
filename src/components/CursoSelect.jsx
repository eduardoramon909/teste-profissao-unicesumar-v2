import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { CURSOS } from '../data/cursos.js';
import { NOME_TIPO, seloModalidade, textoBusca } from '../lib/cursos.js';
import { normalizar } from '../lib/texto.js';
import { IcBusca, IcCheck, IcFechar, IcSeta } from './Icones.jsx';

const ABAS = [
  { id: 'todos', rotulo: 'Todos' },
  { id: 'graduacao', rotulo: 'Graduação' },
  { id: 'pos', rotulo: 'Pós-graduação' },
  { id: 'tecnico', rotulo: 'Técnicos' },
  { id: 'profissionalizante', rotulo: 'Profissionalizantes' },
];

const INDEXADOS = CURSOS.map((c) => ({ c, texto: textoBusca(c) }));

/**
 * Campo "Curso pretendido": abre uma janela com abas (Graduação, Pós, Técnicos, Profissionalizantes),
 * busca sem acento e lista agrupada por área.
 *  - valor: curso selecionado (objeto do catálogo) ou null
 *  - onChange(curso | null)
 *  - gatilho(abrir): opcional, para usar outro botão em vez do campo padrão
 */
export default function CursoSelect({ id, valor, onChange, abaInicial = 'todos', placeholder = 'Toque para escolher (opcional)', gatilho }) {
  const [aberto, setAberto] = useState(false);
  const abrir = () => setAberto(true);
  const fechar = () => setAberto(false);

  return (
    <>
      {gatilho ? (
        gatilho(abrir)
      ) : (
        <button type="button" id={id} className={`select-curso${valor ? ' preenchido' : ''}`} onClick={abrir} aria-haspopup="dialog">
          <span className="select-curso-texto">
            {valor ? (
              <>
                <strong>{valor.nome}</strong>
                <small>{NOME_TIPO[valor.tipo]}{seloModalidade(valor) ? ` (${seloModalidade(valor)})` : ''}</small>
              </>
            ) : (
              <span className="placeholder">{placeholder}</span>
            )}
          </span>
          <IcSeta />
        </button>
      )}
      {aberto && (
        <Painel
          valor={valor}
          abaInicial={abaInicial}
          onFechar={fechar}
          onEscolher={(c) => {
            onChange(c);
            fechar();
          }}
        />
      )}
    </>
  );
}

function Painel({ valor, abaInicial, onEscolher, onFechar }) {
  const [aba, setAba] = useState(abaInicial);
  const [busca, setBusca] = useState('');
  const folha = useRef(null);

  useEffect(() => {
    const anterior = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => e.key === 'Escape' && onFechar();
    window.addEventListener('keydown', onKey);
    folha.current?.focus();
    return () => {
      document.body.style.overflow = anterior;
      window.removeEventListener('keydown', onKey);
    };
  }, [onFechar]);

  const tokens = useMemo(() => normalizar(busca).split(' ').filter(Boolean), [busca]);
  const casaBusca = useMemo(() => INDEXADOS.filter(({ texto }) => tokens.every((t) => texto.includes(t))), [tokens]);
  const contagem = useMemo(() => {
    const m = { todos: casaBusca.length };
    for (const { c } of casaBusca) m[c.tipo] = (m[c.tipo] || 0) + 1;
    return m;
  }, [casaBusca]);

  const grupos = useMemo(() => {
    const mapa = new Map();
    for (const { c } of casaBusca) {
      if (aba !== 'todos' && c.tipo !== aba) continue;
      const chave = `${c.tipo}|${c.secao}`;
      if (!mapa.has(chave)) mapa.set(chave, { tipo: c.tipo, secao: c.secao, itens: [] });
      mapa.get(chave).itens.push(c);
    }
    return [...mapa.values()];
  }, [casaBusca, aba]);

  return createPortal(
    <div className="modal-fundo" onMouseDown={(e) => e.target === e.currentTarget && onFechar()}>
      <div className="modal-folha seletor" role="dialog" aria-modal="true" aria-label="Escolher curso" tabIndex={-1} ref={folha}>
        <header className="seletor-topo">
          <h2>Escolha o curso</h2>
          <button type="button" className="btn-icone" onClick={onFechar} aria-label="Fechar"><IcFechar /></button>
        </header>

        <div className="seletor-busca">
          <IcBusca />
          <input
            type="search"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar curso (ex.: enfermagem, marketing)"
            aria-label="Buscar curso"
            autoComplete="off"
            autoCorrect="off"
            enterKeyHint="search"
          />
        </div>

        <div className="abas" role="tablist" aria-label="Tipo de curso">
          {ABAS.map((a) => (
            <button
              key={a.id}
              type="button"
              role="tab"
              aria-selected={aba === a.id}
              className={`aba${aba === a.id ? ' ativa' : ''}`}
              onClick={() => setAba(a.id)}
            >
              {a.rotulo}
              <span className="aba-n">{contagem[a.id] || 0}</span>
            </button>
          ))}
        </div>

        <div className="seletor-lista">
          {grupos.length === 0 && (
            <p className="vazio">Nenhum curso encontrado{busca ? <> para “{busca}”</> : ''}. Tente outra palavra.</p>
          )}
          {grupos.map((g) => (
            <section key={`${g.tipo}|${g.secao}`} className="grupo">
              <h3 className="grupo-titulo">
                {g.secao}
                {aba === 'todos' && <span className="grupo-tipo">{NOME_TIPO[g.tipo]}</span>}
              </h3>
              <ul>
                {g.itens.map((c) => {
                  const marcado = valor?.oficial === c.oficial;
                  return (
                    <li key={c.oficial}>
                      <button type="button" className={`curso-item${marcado ? ' marcado' : ''}`} onClick={() => onEscolher(c)}>
                        <span className="curso-nome">{c.nome}</span>
                        <span className="curso-selos">
                          {c.novo && <em className="selo novo">Novo</em>}
                          {seloModalidade(c) && <em className="selo">{seloModalidade(c)}</em>}
                          {marcado && <IcCheck width={18} height={18} />}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>

        {valor && (
          <footer className="seletor-rodape">
            <button type="button" className="btn btn-texto" onClick={() => onEscolher(null)}>Limpar escolha</button>
          </footer>
        )}
      </div>
    </div>,
    document.body,
  );
}

import { useState } from 'react';
import { ESCOLARIDADES } from '../data/escolaridade.js';
import { IcCheck, IcSeta } from './Icones.jsx';

/** Pergunta 1 em formato "sanfona": Ensino Fundamental, Ensino Médio e Graduado(a). */
export default function Escolaridade({ valor, onEscolher }) {
  const inicial = ESCOLARIDADES.find((g) => g.itens.some((i) => i.id === valor))?.id ?? null;
  const [aberto, setAberto] = useState(inicial);

  return (
    <div className="sanfona">
      {ESCOLARIDADES.map((g) => {
        const unico = g.itens.length === 1;
        const marcadoNoGrupo = g.itens.some((i) => i.id === valor);
        const expandido = aberto === g.id;
        return (
          <div key={g.id} className={`sanfona-item${expandido ? ' aberto' : ''}${marcadoNoGrupo ? ' marcado' : ''}`}>
            <button
              type="button"
              className="sanfona-cab"
              aria-expanded={unico ? undefined : expandido}
              aria-controls={unico ? undefined : `sanfona-${g.id}`}
              onClick={() => (unico ? onEscolher(g.itens[0].id) : setAberto(expandido ? null : g.id))}
            >
              <span className="sanfona-emoji" aria-hidden="true">{g.emoji}</span>
              <span className="sanfona-titulo">{g.titulo}</span>
              {unico ? (marcadoNoGrupo && <IcCheck />) : <IcSeta className="sanfona-seta" />}
            </button>
            {!unico && (
              <div id={`sanfona-${g.id}`} className="sanfona-corpo" hidden={!expandido}>
                <div className="sanfona-opcoes">
                  {g.itens.map((i) => (
                    <button
                      key={i.id}
                      type="button"
                      className={`pilula${valor === i.id ? ' marcada' : ''}`}
                      onClick={() => onEscolher(i.id)}
                    >
                      {i.rotulo}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

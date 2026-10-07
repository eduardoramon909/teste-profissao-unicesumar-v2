import { useEffect, useRef, useState } from 'react';
import Escolaridade from '../../components/Escolaridade.jsx';
import { IcRelogio, IcVoltar } from '../../components/Icones.jsx';
import { CONFIG } from '../../config.js';

const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

export default function Perguntas({ pergunta, indice, total, valor, onResponder, onVoltar, segundos }) {
  const [marcado, setMarcado] = useState(null);
  const timer = useRef(null);
  const travado = useRef(false);
  
  useEffect(() => () => clearTimeout(timer.current), []);

  // Toque na resposta: destaca por um instante e avança sozinho
  function escolher(v) {
    if (travado.current) return;
    travado.current = true;
    setMarcado(v);
    timer.current = setTimeout(() => onResponder(v), 230);
  }

  const atual = marcado ?? valor;
  const estourou = segundos > CONFIG.META_SEGUNDOS;

  return (
    <div className="tela tela-pergunta">
      <div className="conteudo">
        <header className="barra-quiz">
          <button type="button" className="btn-icone claro" onClick={onVoltar} aria-label="Voltar">
            <IcVoltar />
          </button>
          <span className="contador">Pergunta {indice + 1} de {total}</span>
          <span className={`cronometro${estourou ? ' estourou' : ''}`} title={`Meta: ${CONFIG.META_SEGUNDOS} segundos`}>
            <IcRelogio width={16} height={16} /> {fmt(segundos)}
          </span>
        </header>
        
        <div className="progresso" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={indice + 1}>
          <span style={{ width: `${((indice + 1) / total) * 100}%` }} />
        </div>

        <h1 className="pergunta-titulo">{pergunta.titulo}</h1>

        {pergunta.tipo === 'escolaridade' ? (
          <Escolaridade valor={atual} onEscolher={escolher} />
        ) : (
          <ul className="opcoes">
            {pergunta.opcoes.map((op, i) => (
              <li key={i}>
                <button 
                  type="button" 
                  className={`opcao${atual === i ? ' marcada' : ''}`} 
                  onClick={() => escolher(i)}
                  // Aplicação do Flexbox para proteger o emoji e alinhar os itens
                  style={{ display: 'flex', alignItems: 'center', gap: '12px', textAlign: 'left' }}
                >
                  {/* flexShrink: 0 impede que o emoji diminua de tamanho ou seja cortado */}
                  <span className="opcao-emoji" aria-hidden="true" style={{ flexShrink: 0 }}>
                    {op.emoji}
                  </span>
                  <span className="opcao-texto">{op.texto}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
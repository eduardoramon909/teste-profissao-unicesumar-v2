import { useEffect, useMemo, useState } from 'react';
import {
  IcMais, IcLixeira, IcAlerta, IcCadeado, IcVoltar,
} from '../../components/Icones.jsx';
import { msgErro } from './erros.js';
import {
  DIAS_LABEL, ORDEM_SEMANA, configVazia, novoFuncionarioId,
  formatarDataISO, datasDaSemana, diasDoMes, atribuicoesDoDia, faltasDoDia,
  lacunasDeCobertura, horasPorFuncionarioNoPeriodo, formatarFuncionamento,
} from '../../lib/horarios.js';

const GESTORA_EMAIL = 'maila.sena@polo.uni';
const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

export default function Horarios({ repo, user }) {
  const souGestora = (user?.email || '').toLowerCase() === GESTORA_EMAIL;
  const [config, setConfig] = useState(null);
  const [excecoes, setExcecoes] = useState({});
  const [subview, setSubview] = useState('semana');
  const [dataRef, setDataRef] = useState(() => new Date());
  const [erro, setErro] = useState('');
  const [aviso, setAviso] = useState('');
  const [mostrarConfig, setMostrarConfig] = useState(false);

  useEffect(() => {
    if (!repo) return undefined;
    return repo.observarHorariosConfig(
      (c) => setConfig(c || configVazia()),
      (e) => setErro(msgErro(e)),
    );
  }, [repo]);

  useEffect(() => {
    if (!repo) return undefined;
    return repo.observarHorariosExcecoes(
      (m) => setExcecoes(m || {}),
      (e) => setErro(msgErro(e)),
    );
  }, [repo]);

  useEffect(() => {
    if (!aviso) return undefined;
    const t = setTimeout(() => setAviso(''), 2500);
    return () => clearTimeout(t);
  }, [aviso]);

  async function salvarConfig(novo) {
    setErro('');
    try {
      await repo.salvarHorariosConfig(novo);
      setAviso('Salvo.');
    } catch (e) {
      setErro(msgErro(e));
    }
  }

  async function salvarExcecaoDia(iso, novaExcecao) {
    setErro('');
    try {
      const vazia = !(novaExcecao.adicionar?.length) && !(novaExcecao.remover?.length) && !novaExcecao.observacao;
      if (vazia) await repo.excluirHorarioExcecao(iso);
      else await repo.salvarHorarioExcecao(iso, novaExcecao);
    } catch (e) {
      setErro(msgErro(e));
    }
  }

  if (!config) return <div className="horarios-wrap"><p className="vazio-txt pad">Carregando…</p></div>;

  // ---------- ações (só a gestora pode chamar; os botões já ficam escondidos pra quem não é) ----------
  const acoes = {
    atualizarFuncionamento(dia, patch) {
      salvarConfig({ ...config, funcionamento: { ...config.funcionamento, [dia]: { ...config.funcionamento[dia], ...patch } } });
    },
    adicionarMembro(nome, carga) {
      if (!nome.trim()) return;
      const equipe = [...(config.equipe || []), { id: novoFuncionarioId(), nome: nome.trim(), cargaSemanalHoras: Number(carga) || 40 }];
      salvarConfig({ ...config, equipe });
    },
    removerMembro(id) {
      const equipe = config.equipe.filter((f) => f.id !== id);
      const escalaSemanal = Object.fromEntries(
        Object.entries(config.escalaSemanal).map(([d, lista]) => [d, lista.filter((a) => a.funcionarioId !== id)]),
      );
      salvarConfig({ ...config, equipe, escalaSemanal });
    },
    atualizarCargaMembro(id, carga) {
      const equipe = config.equipe.map((f) => (f.id === id ? { ...f, cargaSemanalHoras: Number(carga) || 0 } : f));
      salvarConfig({ ...config, equipe });
    },
    adicionarBlocoEscala(dia, bloco) {
      const lista = [...(config.escalaSemanal[dia] || []), bloco];
      salvarConfig({ ...config, escalaSemanal: { ...config.escalaSemanal, [dia]: lista } });
    },
    removerBlocoEscala(dia, idx) {
      const lista = config.escalaSemanal[dia].filter((_, i) => i !== idx);
      salvarConfig({ ...config, escalaSemanal: { ...config.escalaSemanal, [dia]: lista } });
    },
    alternarAlerta(campo) {
      salvarConfig({ ...config, [campo]: !config[campo] });
    },
    adicionarPessoaNoDia(iso, funcionarioId, inicio, fim) {
      const atual = excecoes[iso] || { adicionar: [], remover: [] };
      salvarExcecaoDia(iso, { ...atual, adicionar: [...(atual.adicionar || []), { funcionarioId, inicio, fim }] });
    },
    removerAdicaoNoDia(iso, idx) {
      const atual = excecoes[iso] || { adicionar: [], remover: [] };
      salvarExcecaoDia(iso, { ...atual, adicionar: (atual.adicionar || []).filter((_, i) => i !== idx) });
    },
    marcarFaltaNoDia(iso, funcionarioId) {
      const atual = excecoes[iso] || { adicionar: [], remover: [] };
      if ((atual.remover || []).includes(funcionarioId)) return;
      salvarExcecaoDia(iso, { ...atual, remover: [...(atual.remover || []), funcionarioId] });
    },
    desfazerFaltaNoDia(iso, funcionarioId) {
      const atual = excecoes[iso] || { adicionar: [], remover: [] };
      salvarExcecaoDia(iso, { ...atual, remover: (atual.remover || []).filter((id) => id !== funcionarioId) });
    },
    salvarObservacaoDia(iso, observacao) {
      const atual = excecoes[iso] || { adicionar: [], remover: [] };
      if ((atual.observacao || '') === observacao) return;
      salvarExcecaoDia(iso, { ...atual, observacao });
    },
  };

  function navegar(delta) {
    const d = new Date(dataRef);
    if (subview === 'semana') d.setDate(d.getDate() + delta * 7);
    else if (subview === 'mes') d.setMonth(d.getMonth() + delta);
    else d.setFullYear(d.getFullYear() + delta);
    setDataRef(d);
  }

  const labelPeriodo = (() => {
    if (subview === 'semana') {
      const dias = datasDaSemana(dataRef);
      const f = (d) => `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
      return `${f(dias[0])} a ${f(dias[6])}`;
    }
    if (subview === 'mes') return `${MESES[dataRef.getMonth()]} de ${dataRef.getFullYear()}`;
    return String(dataRef.getFullYear());
  })();

  return (
    <div className="horarios-wrap">
      <div className="horarios-cab">
        <h2>Horários da equipe</h2>
        {souGestora
          ? <span className="lock-badge"><IcCadeado width={14} height={14} /> Você pode editar</span>
          : <span className="lock-badge"><IcCadeado width={14} height={14} /> Somente visualização — só a gestora edita</span>}
      </div>

      {erro && <div className="alerta" role="alert"><IcAlerta width={18} height={18} /> {erro}</div>}
      {aviso && <p className="aviso-ok">{aviso}</p>}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
        <div className="horarios-subnav">
          {[['semana', 'Semana'], ['mes', 'Mês'], ['ano', 'Ano']].map(([id, label]) => (
            <button key={id} type="button" className={subview === id ? 'ativa' : ''} onClick={() => setSubview(id)}>{label}</button>
          ))}
        </div>
        <div className="horarios-nav-periodo">
          <button type="button" className="btn-icone" onClick={() => navegar(-1)} aria-label="Período anterior"><IcVoltar width={18} height={18} /></button>
          <strong>{labelPeriodo}</strong>
          <button type="button" className="btn-icone" onClick={() => navegar(1)} aria-label="Próximo período">
            <IcVoltar width={18} height={18} style={{ transform: 'rotate(180deg)' }} />
          </button>
          <button type="button" className="btn btn-secundario pequeno" onClick={() => setDataRef(new Date())}>Hoje</button>
        </div>
      </div>

      {subview === 'semana' && (
        <VisaoSemana dataRef={dataRef} config={config} excecoes={excecoes} souGestora={souGestora} acoes={acoes} />
      )}
      {subview === 'mes' && (
        <VisaoMes dataRef={dataRef} config={config} excecoes={excecoes}
          onEscolherDia={(d) => { setDataRef(d); setSubview('semana'); }} />
      )}
      {subview === 'ano' && (
        <VisaoAno dataRef={dataRef} config={config} excecoes={excecoes}
          onEscolherMes={(d) => { setDataRef(d); setSubview('mes'); }} />
      )}

      <div style={{ marginTop: 22 }}>
        <button type="button" className="btn btn-texto" onClick={() => setMostrarConfig((v) => !v)}>
          {mostrarConfig ? '▲ Ocultar configurações' : '▼ Funcionamento do polo, equipe e escala padrão'}
        </button>
      </div>

      {mostrarConfig && (
        <>
          <FuncionamentoCard config={config} souGestora={souGestora} acoes={acoes} />
          <EquipeCard config={config} souGestora={souGestora} acoes={acoes} />
          <EscalaSemanalCard config={config} souGestora={souGestora} acoes={acoes} />
          <AlertasCard config={config} souGestora={souGestora} acoes={acoes} />
        </>
      )}
    </div>
  );
}

// ================================================================
//  Visão Semana
// ================================================================
function VisaoSemana({ dataRef, config, excecoes, souGestora, acoes }) {
  const dias = datasDaSemana(dataRef);
  const hojeIso = formatarDataISO(new Date());

  const horasSemana = useMemo(
    () => horasPorFuncionarioNoPeriodo(config, excecoes, dias),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [config, excecoes, dataRef],
  );
  const estourosCarga = config.alertaCargaHoraria
    ? (config.equipe || [])
      .map((f) => ({ ...f, minutos: horasSemana[f.id] || 0 }))
      .filter((f) => f.cargaSemanalHoras && f.minutos > f.cargaSemanalHoras * 60)
    : [];

  return (
    <>
      {estourosCarga.length > 0 && (
        <div className="alerta" role="alert">
          <IcAlerta width={18} height={18} />
          <div>
            <strong>Carga horária acima do limite nesta semana:</strong>
            <div className="carga-alerta-lista">
              {estourosCarga.map((f) => (
                <span key={f.id}>
                  {f.nome}: {(f.minutos / 60).toFixed(1)}h escaladas (limite {f.cargaSemanalHoras}h)
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="semana-grid">
        {dias.map((data) => {
          const iso = formatarDataISO(data);
          const diaSemana = data.getDay();
          const funcDia = config.funcionamento[diaSemana] || { ativo: false };
          const excecao = excecoes[iso];
          const atribuicoes = atribuicoesDoDia(config, excecao, diaSemana);
          const faltas = faltasDoDia(config, excecao, diaSemana);
          const lacunas = config.alertaCobertura ? lacunasDeCobertura(funcDia, atribuicoes) : [];
          const disponiveis = (config.equipe || []).filter((f) => !atribuicoes.some((a) => a.funcionarioId === f.id));

          return (
            <DiaCard key={iso} iso={iso} data={data} diaSemana={diaSemana} funcDia={funcDia}
              hoje={iso === hojeIso} atribuicoes={atribuicoes} faltas={faltas} lacunas={lacunas}
              disponiveis={disponiveis} observacao={excecao?.observacao || ''}
              souGestora={souGestora} acoes={acoes} />
          );
        })}
      </div>
    </>
  );
}

function DiaCard({
  iso, data, diaSemana, funcDia, hoje, atribuicoes, faltas, lacunas, disponiveis, observacao, souGestora, acoes,
}) {
  const [novoFunc, setNovoFunc] = useState('');
  const [novoInicio, setNovoInicio] = useState(funcDia.abre || '08:00');
  const [novoFim, setNovoFim] = useState(funcDia.fecha || '18:00');

  return (
    <div className={`dia-card${funcDia.ativo ? '' : ' fechado'}${hoje ? ' hoje' : ''}`}>
      <div className="dia-card-cab">
        <strong>{DIAS_LABEL[diaSemana]}</strong>
        <span>{String(data.getDate()).padStart(2, '0')}/{String(data.getMonth() + 1).padStart(2, '0')}</span>
      </div>
      <div className="dia-card-horario">{funcDia.ativo ? `Aberto ${formatarFuncionamento(funcDia)}` : 'Fechado'}</div>

      {lacunas.length > 0 && (
        <div className="gap-alerta">
          <IcAlerta width={13} height={13} /> Sem ninguém escalado: {lacunas.map((l) => `${l.inicio}–${l.fim}`).join(', ')}
        </div>
      )}

      {atribuicoes.length === 0 && <p className="dia-sem-gente">Ninguém escalado.</p>}
      <div className="atrib-lista">
        {atribuicoes.map((a, i) => (
          <div key={`${a.funcionarioId}-${i}`} className="atrib-chip">
            <span><strong>{a.nome}</strong> {a.inicio}–{a.fim}</span>
            {souGestora && (
              <button type="button"
                onClick={() => (a.origem === 'excecao' ? acoes.removerAdicaoNoDia(iso, a.indiceExcecao) : acoes.marcarFaltaNoDia(iso, a.funcionarioId))}
                aria-label={`Remover ${a.nome} de ${iso}`}>×</button>
            )}
          </div>
        ))}
        {faltas.map((f) => (
          <div key={f.funcionarioId} className="atrib-chip" style={{ opacity: 0.65 }}>
            <span style={{ textDecoration: 'line-through' }}>{f.nome}</span>
            {souGestora && (
              <button type="button" onClick={() => acoes.desfazerFaltaNoDia(iso, f.funcionarioId)} aria-label={`Desfazer falta de ${f.nome}`}>↺</button>
            )}
          </div>
        ))}
      </div>

      {souGestora && (
        <div className="dia-add-form">
          <select value={novoFunc} onChange={(e) => setNovoFunc(e.target.value)}>
            <option value="">Adicionar pessoa…</option>
            {disponiveis.map((f) => <option key={f.id} value={f.id}>{f.nome}</option>)}
          </select>
          <input type="time" value={novoInicio} onChange={(e) => setNovoInicio(e.target.value)} />
          <input type="time" value={novoFim} onChange={(e) => setNovoFim(e.target.value)} />
          <button type="button" className="btn-icone" disabled={!novoFunc}
            onClick={() => { acoes.adicionarPessoaNoDia(iso, novoFunc, novoInicio, novoFim); setNovoFunc(''); }}
            aria-label="Confirmar"><IcMais width={16} height={16} /></button>
        </div>
      )}
      {souGestora && (
        <input type="text" className="campo-input" style={{ marginTop: 8, fontSize: 12.5, padding: '7px 10px' }}
          placeholder="Observação do dia (opcional)" defaultValue={observacao}
          onBlur={(e) => acoes.salvarObservacaoDia(iso, e.target.value.trim())} />
      )}
      {!souGestora && observacao && <p className="dica">Obs.: {observacao}</p>}
    </div>
  );
}

// ================================================================
//  Visão Mês
// ================================================================
function VisaoMes({ dataRef, config, excecoes, onEscolherDia }) {
  const ano = dataRef.getFullYear();
  const mes = dataRef.getMonth();
  const dias = diasDoMes(ano, mes);
  const hojeIso = formatarDataISO(new Date());

  return (
    <div className="mes-grid">
      {ORDEM_SEMANA.map((d) => <div key={d} className="mes-abrev">{DIAS_LABEL[d].slice(0, 3)}</div>)}
      {dias.map(({ data, noMes }) => {
        const iso = formatarDataISO(data);
        const diaSemana = data.getDay();
        const funcDia = config.funcionamento[diaSemana] || { ativo: false };
        const excecao = excecoes[iso];
        const atribuicoes = atribuicoesDoDia(config, excecao, diaSemana);
        const lacunas = config.alertaCobertura ? lacunasDeCobertura(funcDia, atribuicoes) : [];
        return (
          <button key={iso} type="button" onClick={() => onEscolherDia(data)}
            className={`mes-cel${noMes ? '' : ' fora-do-mes'}${iso === hojeIso ? ' hoje' : ''}`}>
            <span className="mes-cel-dia">{data.getDate()}</span>
            <span className="mes-cel-nomes">{atribuicoes.map((a) => a.nome.split(' ')[0]).join(', ')}</span>
            {lacunas.length > 0 && <span className="mes-cel-alerta">cobertura ⚠</span>}
          </button>
        );
      })}
    </div>
  );
}

// ================================================================
//  Visão Ano
// ================================================================
function VisaoAno({ dataRef, config, excecoes, onEscolherMes }) {
  const ano = dataRef.getFullYear();
  return (
    <div className="ano-grid">
      {MESES.map((nomeMes, mes) => {
        const dias = diasDoMes(ano, mes);
        return (
          <button key={mes} type="button" className="mini-mes" onClick={() => onEscolherMes(new Date(ano, mes, 1))}>
            <div className="mini-mes-titulo">{nomeMes}</div>
            <div className="mini-mes-grid">
              {dias.map(({ data, noMes }) => {
                if (!noMes) return <div key={formatarDataISO(data)} className="mini-mes-dia fora" />;
                const iso = formatarDataISO(data);
                const diaSemana = data.getDay();
                const funcDia = config.funcionamento[diaSemana] || { ativo: false };
                const atribuicoes = atribuicoesDoDia(config, excecoes[iso], diaSemana);
                const lacunas = config.alertaCobertura ? lacunasDeCobertura(funcDia, atribuicoes) : [];
                const classe = lacunas.length > 0 ? 'alerta' : (funcDia.ativo ? 'ok' : '');
                return <div key={iso} className={`mini-mes-dia ${classe}`} title={iso} />;
              })}
            </div>
          </button>
        );
      })}
    </div>
  );
}

// ================================================================
//  Configurações: Funcionamento / Equipe / Escala semanal / Alertas
// ================================================================
function FuncionamentoCard({ config, souGestora, acoes }) {
  return (
    <div className="cartao-adm">
      <h3 className="dash-secao-titulo">Funcionamento do polo</h3>
      <p className="dica">
        O intervalo de almoço é opcional: preencha "de / até" só se o polo fechar pro almoço.
        Deixando em branco, o sistema entende que funciona direto, sem pausa.
      </p>
      {ORDEM_SEMANA.map((dia) => {
        const f = config.funcionamento[dia] || { ativo: false, abre: '', fecha: '', pausaInicio: '', pausaFim: '' };
        return (
          <div key={dia} className="func-linha" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <span className="func-dia-nome">{DIAS_LABEL[dia]}</span>
              <label className="check pequeno" htmlFor={`ativo-${dia}`}>
                <input id={`ativo-${dia}`} type="checkbox" checked={!!f.ativo} disabled={!souGestora}
                  onChange={(e) => acoes.atualizarFuncionamento(dia, { ativo: e.target.checked })} />
                <span className="check-caixa" aria-hidden="true">✓</span>
                <span className="check-texto">Aberto</span>
              </label>
              {f.ativo && (
                <>
                  <input type="time" className="campo-input" value={f.abre || ''} disabled={!souGestora}
                    onChange={(e) => acoes.atualizarFuncionamento(dia, { abre: e.target.value })} />
                  <span className="dica" style={{ margin: 0 }}>até</span>
                  <input type="time" className="campo-input" value={f.fecha || ''} disabled={!souGestora}
                    onChange={(e) => acoes.atualizarFuncionamento(dia, { fecha: e.target.value })} />
                </>
              )}
            </div>
            {f.ativo && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', paddingLeft: 102 }}>
                <span className="dica" style={{ margin: 0 }}>Almoço (opcional):</span>
                <input type="time" className="campo-input" value={f.pausaInicio || ''} disabled={!souGestora}
                  onChange={(e) => acoes.atualizarFuncionamento(dia, { pausaInicio: e.target.value })} />
                <span className="dica" style={{ margin: 0 }}>até</span>
                <input type="time" className="campo-input" value={f.pausaFim || ''} disabled={!souGestora}
                  onChange={(e) => acoes.atualizarFuncionamento(dia, { pausaFim: e.target.value })} />
                {(f.pausaInicio || f.pausaFim) && souGestora && (
                  <button type="button" className="btn btn-texto" style={{ minHeight: 32, padding: '4px 10px' }}
                    onClick={() => acoes.atualizarFuncionamento(dia, { pausaInicio: '', pausaFim: '' })}>
                    Limpar (funciona direto)
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function EquipeCard({ config, souGestora, acoes }) {
  const [nome, setNome] = useState('');
  const [carga, setCarga] = useState('40');

  return (
    <div className="cartao-adm">
      <h3 className="dash-secao-titulo">Equipe e carga horária semanal</h3>
      {(config.equipe || []).length === 0 && <p className="vazio-txt">Nenhum funcionário cadastrado ainda.</p>}
      {(config.equipe || []).map((f) => (
        <div key={f.id} className="equipe-linha">
          <span className="equipe-nome">{f.nome}</span>
          <input type="number" min="0" className="campo-input equipe-carga" value={f.cargaSemanalHoras} disabled={!souGestora}
            onChange={(e) => acoes.atualizarCargaMembro(f.id, e.target.value)} />
          <span className="dica" style={{ margin: 0 }}>h/semana</span>
          {souGestora && (
            <button type="button" className="btn-icone" onClick={() => acoes.removerMembro(f.id)} aria-label={`Remover ${f.nome}`}>
              <IcLixeira width={16} height={16} />
            </button>
          )}
        </div>
      ))}
      {souGestora && (
        <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
          <input type="text" className="campo-input" style={{ flex: 1, minWidth: 180 }} placeholder="Nome do funcionário"
            value={nome} onChange={(e) => setNome(e.target.value)} />
          <input type="number" min="0" className="campo-input" style={{ width: 90 }} value={carga}
            onChange={(e) => setCarga(e.target.value)} />
          <button type="button" className="btn btn-secundario"
            onClick={() => { acoes.adicionarMembro(nome, carga); setNome(''); }}>
            <IcMais width={16} height={16} /> Adicionar
          </button>
        </div>
      )}
    </div>
  );
}

function EscalaSemanalCard({ config, souGestora, acoes }) {
  return (
    <div className="cartao-adm">
      <h3 className="dash-secao-titulo">Escala semanal padrão</h3>
      <p className="dica">
        Essa é a escala fixa que se repete toda semana. Dias que variam (como o rodízio de sábado) ou faltas
        extraordinárias são ajustados direto na visão Semana, sem mexer aqui.
      </p>
      {ORDEM_SEMANA.map((dia) => (
        <EscalaDiaBloco key={dia} dia={dia} config={config} souGestora={souGestora} acoes={acoes} />
      ))}
    </div>
  );
}

function EscalaDiaBloco({ dia, config, souGestora, acoes }) {
  const [func, setFunc] = useState('');
  const [inicio, setInicio] = useState('08:00');
  const [fim, setFim] = useState('18:00');
  const blocos = config.escalaSemanal[dia] || [];
  const equipe = config.equipe || [];

  return (
    <div className="escala-dia-bloco">
      <div className="escala-dia-titulo">{DIAS_LABEL[dia]}</div>
      {blocos.length === 0 && <p className="vazio-txt" style={{ marginBottom: 6 }}>Ninguém na escala fixa.</p>}
      {blocos.map((b, i) => (
        <div key={i} className="bloco-horario">
          <span className="nome-bloco">{equipe.find((f) => f.id === b.funcionarioId)?.nome || '(removido)'} — {b.inicio} às {b.fim}</span>
          {souGestora && (
            <button type="button" className="btn-icone" onClick={() => acoes.removerBlocoEscala(dia, i)} aria-label="Remover">
              <IcLixeira width={15} height={15} />
            </button>
          )}
        </div>
      ))}
      {souGestora && (
        <div className="bloco-horario">
          <select value={func} onChange={(e) => setFunc(e.target.value)}>
            <option value="">Adicionar funcionário…</option>
            {equipe.map((f) => <option key={f.id} value={f.id}>{f.nome}</option>)}
          </select>
          <input type="time" value={inicio} onChange={(e) => setInicio(e.target.value)} />
          <input type="time" value={fim} onChange={(e) => setFim(e.target.value)} />
          <button type="button" className="btn-icone" disabled={!func}
            onClick={() => { acoes.adicionarBlocoEscala(dia, { funcionarioId: func, inicio, fim }); setFunc(''); }}
            aria-label="Confirmar"><IcMais width={16} height={16} /></button>
        </div>
      )}
    </div>
  );
}

function AlertasCard({ config, souGestora, acoes }) {
  return (
    <div className="cartao-adm">
      <h3 className="dash-secao-titulo">Alertas (não bloqueiam, só avisam)</h3>
      <label className="check" htmlFor="alerta-cobertura" style={{ marginBottom: 14 }}>
        <input id="alerta-cobertura" type="checkbox" checked={!!config.alertaCobertura} disabled={!souGestora}
          onChange={() => acoes.alternarAlerta('alertaCobertura')} />
        <span className="check-caixa" aria-hidden="true">✓</span>
        <span className="check-texto">Avisar quando um horário em que o polo deveria estar aberto ficar sem ninguém escalado</span>
      </label>
      <label className="check" htmlFor="alerta-carga">
        <input id="alerta-carga" type="checkbox" checked={!!config.alertaCargaHoraria} disabled={!souGestora}
          onChange={() => acoes.alternarAlerta('alertaCargaHoraria')} />
        <span className="check-caixa" aria-hidden="true">✓</span>
        <span className="check-texto">Avisar quando um tutor ultrapassar a carga horária semanal cadastrada</span>
      </label>
    </div>
  );
}

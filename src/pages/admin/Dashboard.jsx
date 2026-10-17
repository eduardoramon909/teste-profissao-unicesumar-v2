import { useEffect, useMemo, useState } from 'react';
import { IcMais, IcAlerta } from '../../components/Icones.jsx';
import NovaMatricula from './NovaMatricula.jsx';
import { msgErro } from './erros.js';

const PRODUTOS = [
  { id: 'grad',   label: 'Graduação' },
  { id: 'pos',    label: 'Pós-Grad.' },
  { id: 'tec',    label: 'Técnico' },
  { id: 'prof',   label: 'Profissionalizante' },
];

function pct(v, total) {
  if (!total) return 0;
  return Math.min(100, Math.round((v / total) * 100));
}

function diasUteis(inicio, fim) {
  if (!inicio || !fim) return 0;
  let d = new Date(inicio + 'T12:00:00');
  const f = new Date(fim + 'T12:00:00');
  let count = 0;
  while (d <= f) {
    const dw = d.getDay();
    if (dw !== 0 && dw !== 6) count++;
    d.setDate(d.getDate() + 1);
  }
  return count;
}

function diasUteisAteHoje(inicio) {
  if (!inicio) return 0;
  const hoje = new Date().toISOString().slice(0, 10);
  return diasUteis(inicio, hoje < inicio ? inicio : hoje);
}

/** Barra de progresso simples */
function Barra({ valor, meta, cor = 'var(--azure)' }) {
  const p = pct(valor, meta);
  return (
    <div className="barra-prog-bg">
      <div
        className="barra-prog-fill"
        style={{ width: `${p}%`, background: cor }}
        role="progressbar"
        aria-valuenow={valor}
        aria-valuemax={meta}
      />
    </div>
  );
}

/** Card de produto com progresso */
function CardProduto({ label, realizado, meta }) {
  const p = pct(realizado, meta);
  const ok = p >= 100;
  return (
    <div className={`dash-card-prod${ok ? ' concluido' : ''}`}>
      <span className="dcp-label">{label}</span>
      <span className="dcp-nums">
        <strong>{realizado}</strong>
        <span>/ {meta || '–'}</span>
      </span>
      <Barra valor={realizado} meta={meta || 1} cor={ok ? 'var(--ok)' : 'var(--azure)'} />
      <span className="dcp-pct">{meta ? `${p}%` : '—'}</span>
    </div>
  );
}

/** Mini card de tutor */
function CardTutor({ nome, matriculas, meta }) {
  const p = pct(matriculas, meta);
  return (
    <div className="dash-tutor-row">
      <span className="dt-nome">{nome}</span>
      <Barra valor={matriculas} meta={meta || 1} />
      <span className="dt-nums">{matriculas}<span className="vazio-txt">/{meta || '?'}</span></span>
      <span className="dt-pct">{meta ? `${p}%` : '—'}</span>
    </div>
  );
}

export default function Dashboard({ repo, user, processo, processos }) {
  const [matriculas, setMatriculas]   = useState(null);
  const [meta, setMeta]               = useState(null);
  const [campanhas, setCampanhas]     = useState([]);
  const [novaOpen, setNovaOpen]       = useState(false);
  const [erro, setErro]               = useState('');

  useEffect(() => {
    if (!repo || !processo) return;
    const unsub1 = repo.observarMatriculas(processo.id, setMatriculas, (e) => setErro(msgErro(e)));
    const unsub2 = repo.observarMeta(processo.id, setMeta, () => {});
    const unsub3 = repo.observarCampanhas(setCampanhas, () => {});
    return () => { unsub1(); unsub2(); unsub3(); };
  }, [repo, processo]);

  const stats = useMemo(() => {
    const mats = matriculas || [];
    const por = {};
    PRODUTOS.forEach((p) => { por[p.id] = 0; });
    const porTutor = {};
    mats.forEach((m) => {
      por[m.produto] = (por[m.produto] || 0) + (m.quantidade || 1);
      const t = m.tutor || 'Sem tutor';
      porTutor[t] = (porTutor[t] || 0) + (m.quantidade || 1);
    });
    const total = Object.values(por).reduce((s, v) => s + v, 0);
    return { por, porTutor, total };
  }, [matriculas]);

  // Gap: quantas matrículas deveríamos ter hoje proporcionalmente
  const gap = useMemo(() => {
    if (!meta?.metaGeral || !processo) return null;
    const totalDias = diasUteis(processo.inicio, processo.fim);
    const diasFeitos = diasUteisAteHoje(processo.inicio);
    if (!totalDias) return null;
    const esperado = Math.round((meta.metaGeral / totalDias) * diasFeitos);
    return esperado - stats.total;
  }, [meta, processo, stats.total]);

  // Spaces: qual estamos agora
  const spaceAtual = useMemo(() => {
    if (!meta?.spaces?.length) return null;
    const hoje = new Date().toISOString().slice(0, 10);
    return [...(meta.spaces)].sort((a, b) => (a.data || '').localeCompare(b.data || '')).find(
      (s) => hoje <= s.data,
    ) || meta.spaces[meta.spaces.length - 1];
  }, [meta]);

  if (!processo) {
    return (
      <div className="dash-vazio">
        <p>Nenhum processo cadastrado. Vá em <strong>Processo</strong> para criar um.</p>
      </div>
    );
  }

  const metaGeral = meta?.metaGeral || 0;
  const pctGeral = pct(stats.total, metaGeral);
  const corGeral = pctGeral >= 100 ? 'var(--ok)' : pctGeral >= 70 ? 'var(--azure)' : 'var(--erro)';

  return (
    <div className="dash">
      {erro && <div className="alerta" role="alert"><IcAlerta width={20} height={20} /> {erro}</div>}

      {/* ── Cabeçalho do processo ── */}
      <div className="dash-proc-header">
        <div>
          <h2 className="dash-titulo">{processo.nome || processo.id}</h2>
          <p className="vazio-txt">{processo.inicio} → {processo.fim}</p>
        </div>
        <button
          type="button"
          className="btn btn-primario"
          onClick={() => setNovaOpen(true)}
        >
          <IcMais width={18} height={18} /> Nova matrícula
        </button>
      </div>

      {/* ── Resumo geral ── */}
      <div className="dash-grid">
        {/* Card geral */}
        <div className="cartao-adm dash-card-geral">
          <p className="dash-card-label">Total realizado</p>
          <p className="dash-card-num" style={{ color: corGeral }}>
            {stats.total}
            <span className="dash-card-de">/ {metaGeral || '–'}</span>
          </p>
          <Barra valor={stats.total} meta={metaGeral || 1} cor={corGeral} />
          <p className="dash-card-pct">{metaGeral ? `${pctGeral}%` : '—'}</p>
        </div>

        {/* Gap */}
        <div className="cartao-adm dash-card-gap">
          <p className="dash-card-label">Gap hoje</p>
          {gap === null ? (
            <p className="vazio-txt">Configure a meta geral</p>
          ) : gap > 0 ? (
            <>
              <p className="dash-card-num dash-num-negativo">-{gap}</p>
              <p className="vazio-txt">Matrículas em atraso para a meta do período</p>
            </>
          ) : (
            <>
              <p className="dash-card-num dash-num-positivo">+{Math.abs(gap)}</p>
              <p className="vazio-txt">Matrículas à frente da meta do período 🎉</p>
            </>
          )}
        </div>

        {/* Space atual */}
        {spaceAtual && (
          <div className="cartao-adm dash-card-space">
            <p className="dash-card-label">Próximo checkpoint</p>
            <p className="dash-card-num">{spaceAtual.meta || '–'}</p>
            <p className="vazio-txt">até {spaceAtual.data}</p>
          </div>
        )}
      </div>

      {/* ── Por produto ── */}
      <div className="cartao-adm">
        <h3 className="dash-secao-titulo">Por produto</h3>
        <div className="dash-produtos">
          {PRODUTOS.map(({ id, label }) => (
            <CardProduto
              key={id}
              label={label}
              realizado={stats.por[id] || 0}
              meta={meta?.porProduto?.[id] || 0}
            />
          ))}
        </div>
      </div>

      {/* ── Por tutor ── */}
      {Object.keys(stats.porTutor).length > 0 && (
        <div className="cartao-adm">
          <h3 className="dash-secao-titulo">Por tutor</h3>
          <div className="dash-tutores">
            {Object.entries(stats.porTutor).map(([nome, qtd]) => {
              const metaTutor = meta?.porTutor?.[nome] || 0;
              return (
                <CardTutor key={nome} nome={nome} matriculas={qtd} meta={metaTutor} />
              );
            })}
          </div>
        </div>
      )}

      {novaOpen && (
        <NovaMatricula
          repo={repo}
          user={user}
          processo={processo}
          campanhas={campanhas}
          meta={meta}
          onFechar={() => setNovaOpen(false)}
        />
      )}
    </div>
  );
}

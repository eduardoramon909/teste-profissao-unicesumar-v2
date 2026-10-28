import { useEffect, useMemo, useState } from 'react';
import { IcMais, IcAlerta } from '../../components/Icones.jsx';
import { PRODUTOS } from '../../lib/produtos.js';
import NovaMatricula from './NovaMatricula.jsx';
import { msgErro } from './erros.js';

function pct(v, total) {
  if (!total) return 0;
  return Math.min(100, Math.round((v / total) * 100));
}

/**
 * Conta dias úteis entre duas datas (inclusive),
 * excluindo domingos e os dias de exceção informados.
 */
function diasUteis(inicio, fim, excecoes = []) {
  if (!inicio || !fim) return 0;
  const excSet = new Set(excecoes);
  let d = new Date(inicio + 'T12:00:00');
  const f = new Date(fim + 'T12:00:00');
  let count = 0;
  while (d <= f) {
    const dw  = d.getDay();
    const iso = d.toISOString().slice(0, 10);
    if (dw !== 0 && !excSet.has(iso)) count++;
    d.setDate(d.getDate() + 1);
  }
  return count;
}

function diasUteisAteHoje(inicio, excecoes = []) {
  if (!inicio) return 0;
  const hoje = new Date().toISOString().slice(0, 10);
  const ate  = hoje < inicio ? inicio : hoje;
  return diasUteis(inicio, ate, excecoes);
}

function calcGap(metaTotal, inicio, fim, realizado, excecoes) {
  if (!metaTotal || !inicio || !fim) return null;
  const total   = diasUteis(inicio, fim, excecoes);
  const feitos  = diasUteisAteHoje(inicio, excecoes);
  if (!total) return null;
  const esperado = Math.round((metaTotal / total) * feitos);
  return esperado - realizado;
}

function Barra({ valor, meta, cor = 'var(--azure)' }) {
  const p = pct(valor, meta);
  return (
    <div className="barra-prog-bg">
      <div className="barra-prog-fill" style={{ width: `${p}%`, background: cor }}
        role="progressbar" aria-valuenow={valor} aria-valuemax={meta} />
    </div>
  );
}

function CardProduto({ label, realizado, meta }) {
  const p  = pct(realizado, meta);
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

function CardTutor({ nome, matriculas, metaGeral, gap }) {
  const p = pct(matriculas, metaGeral);
  return (
    <div className="dash-tutor-row">
      <span className="dt-nome">{nome}</span>
      <Barra valor={matriculas} meta={metaGeral || 1} />
      <span className="dt-nums">{matriculas}<span className="vazio-txt">/{metaGeral || '?'}</span></span>
      <span className="dt-pct">{metaGeral ? `${p}%` : '—'}</span>
      {gap !== null && (
        <span className={`dt-gap ${gap > 0 ? 'gap-neg' : 'gap-pos'}`}>
          {gap > 0 ? `-${gap}` : `+${Math.abs(gap)}`}
        </span>
      )}
    </div>
  );
}

export default function Dashboard({ repo, user, processo, processos }) {
  const [matriculas, setMatriculas] = useState(null);
  const [meta,       setMeta]       = useState(null);
  const [campanhas,  setCampanhas]  = useState([]);
  const [novaOpen,   setNovaOpen]   = useState(false);
  const [erro,       setErro]       = useState('');

  useEffect(() => {
    if (!repo || !processo) return;
    const u1 = repo.observarMatriculas(processo.id, setMatriculas, (e) => setErro(msgErro(e)));
    const u2 = repo.observarMeta(processo.id, setMeta, () => {});
    const u3 = repo.observarCampanhas(setCampanhas, () => {});
    return () => { u1(); u2(); u3(); };
  }, [repo, processo]);

  const excecoes = meta?.diasExcecao || [];

  const stats = useMemo(() => {
    const mats = matriculas || [];
    const por  = Object.fromEntries(PRODUTOS.map((p) => [p.id, 0]));
    const porTutor = {};
    mats.forEach((m) => {
      if (m.produto in por) por[m.produto] += (m.quantidade || 1);
      const t = m.tutor || 'Sem tutor';
      porTutor[t] = (porTutor[t] || 0) + (m.quantidade || 1);
    });
    const total = Object.values(por).reduce((s, v) => s + v, 0);
    return { por, porTutor, total };
  }, [matriculas]);

  // Gap geral
  const gapGeral = useMemo(() => {
    // Meta geral pode ser a soma dos produtos se não tiver metaGeral
    const mg = meta?.metaGeral
      || (meta?.porProduto ? Object.values(meta.porProduto).reduce((s, v) => s + (Number(v) || 0), 0) : 0);
    return calcGap(mg, processo?.inicio, processo?.fim, stats.total, excecoes);
  }, [meta, processo, stats.total, excecoes]);

  // Gap por tutor
  const gapsPorTutor = useMemo(() => {
    if (!meta?.porTutor || !processo) return {};
    const result = {};
    (meta.tutores || []).forEach((t) => {
      const mg = Number(meta.porTutor[`${t}__geral`]) || 0;
      if (!mg) { result[t] = null; return; }
      result[t] = calcGap(mg, processo.inicio, processo.fim, stats.porTutor[t] || 0, excecoes);
    });
    return result;
  }, [meta, processo, stats.porTutor, excecoes]);

  // Space mais próximo
  const spaceAtual = useMemo(() => {
    if (!meta?.spaces?.length) return null;
    const hoje = new Date().toISOString().slice(0, 10);
    return [...meta.spaces]
      .sort((a, b) => (a.data || '').localeCompare(b.data || ''))
      .find((s) => hoje <= s.data) || meta.spaces[meta.spaces.length - 1];
  }, [meta]);

  if (!processo) {
    return (
      <div className="dash-vazio">
        <p>Nenhum processo cadastrado. Vá em <strong>Processo</strong> para criar um.</p>
      </div>
    );
  }

  // Meta geral efetiva para exibição
  const metaGeral = meta?.metaGeral
    || (meta?.porProduto ? Object.values(meta.porProduto).reduce((s, v) => s + (Number(v) || 0), 0) : 0);
  const pctGeral = pct(stats.total, metaGeral);
  const corGeral = pctGeral >= 100 ? 'var(--ok)' : pctGeral >= 70 ? 'var(--azure)' : 'var(--erro)';

  // Tutores para exibir — os cadastrados na meta ou os que aparecem nas matrículas
  const tutoresExibir = meta?.tutores?.length
    ? meta.tutores
    : Object.keys(stats.porTutor);

  return (
    <div className="dash">
      {erro && <div className="alerta" role="alert"><IcAlerta width={20} height={20} /> {erro}</div>}

      {/* Cabeçalho */}
      <div className="dash-proc-header">
        <div>
          <h2 className="dash-titulo">{processo.nome || processo.id}</h2>
          <p className="vazio-txt">{processo.inicio} → {processo.fim}</p>
        </div>
        <button type="button" className="btn btn-primario" onClick={() => setNovaOpen(true)}>
          <IcMais width={18} height={18} /> Nova matrícula
        </button>
      </div>

      {/* Cards de resumo */}
      <div className="dash-grid">
        {/* Total */}
        <div className="cartao-adm dash-card-geral">
          <p className="dash-card-label">Total realizado</p>
          <p className="dash-card-num" style={{ color: corGeral }}>
            {stats.total}<span className="dash-card-de">/ {metaGeral || '–'}</span>
          </p>
          <Barra valor={stats.total} meta={metaGeral || 1} cor={corGeral} />
          <p className="dash-card-pct">{metaGeral ? `${pctGeral}%` : '—'}</p>
        </div>

        {/* Gap geral */}
        <div className="cartao-adm dash-card-gap">
          <p className="dash-card-label">Gap hoje</p>
          {gapGeral === null ? (
            <p className="vazio-txt">Configure a meta</p>
          ) : gapGeral > 0 ? (
            <>
              <p className="dash-card-num dash-num-negativo">-{gapGeral}</p>
              <p className="vazio-txt">em atraso no ritmo da meta</p>
            </>
          ) : (
            <>
              <p className="dash-card-num dash-num-positivo">+{Math.abs(gapGeral)}</p>
              <p className="vazio-txt">à frente da meta do período 🎉</p>
            </>
          )}
        </div>

        {/* Space */}
        {spaceAtual && (
          <div className="cartao-adm dash-card-space">
            <p className="dash-card-label">Próximo checkpoint</p>
            <p className="dash-card-num">{spaceAtual.meta || '–'}</p>
            <p className="vazio-txt">até {spaceAtual.data}</p>
          </div>
        )}
      </div>

      {/* Por produto */}
      <div className="cartao-adm">
        <h3 className="dash-secao-titulo">Por produto</h3>
        <div className="dash-produtos">
          {PRODUTOS.map(({ id, label }) => (
            <CardProduto key={id} label={label}
              realizado={stats.por[id] || 0}
              meta={meta?.porProduto?.[id] || 0} />
          ))}
        </div>
      </div>

      {/* Por tutor */}
      {tutoresExibir.length > 0 && (
        <div className="cartao-adm">
          <h3 className="dash-secao-titulo">Por tutor</h3>
          <div className="dash-tutores-header">
            <span className="dt-nome">Tutor</span>
            <span style={{ flex: 1 }} />
            <span className="dt-nums">Feito/Meta</span>
            <span className="dt-pct">%</span>
            <span className="dt-gap-header">Gap</span>
          </div>
          <div className="dash-tutores">
            {tutoresExibir.map((nome) => {
              const mg  = Number(meta?.porTutor?.[`${nome}__geral`]) || 0;
              const qtd = stats.porTutor[nome] || 0;
              const gap = gapsPorTutor[nome] ?? null;
              return (
                <CardTutor key={nome} nome={nome} matriculas={qtd} metaGeral={mg} gap={gap} />
              );
            })}
          </div>
        </div>
      )}

      {novaOpen && (
        <NovaMatricula
          repo={repo} user={user} processo={processo}
          campanhas={campanhas} meta={meta}
          onFechar={() => setNovaOpen(false)}
        />
      )}
    </div>
  );
}

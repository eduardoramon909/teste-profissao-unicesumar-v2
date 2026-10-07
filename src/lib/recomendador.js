// ============================================================
//  MOTOR DO TESTE (100% local, sem IA externa, resultado sempre igual para as mesmas respostas)
//
//  1. Cada resposta soma pontos em áreas, traços de perfil, famílias de cursos e palavras-chave.
//  2. Depois da pergunta 10 o teste descobre a(s) área(s) que mais combinam e escolhe as perguntas
//     específicas (11 em diante) desse(s) banco(s).
//  3. Cada curso do tipo certo (conforme a escolaridade) recebe uma nota:
//        30% afinidade com a área  +  30% semelhança de traços  +  30% respostas específicas  +  10% palavras-chave
//        (+ pequeno bônus se o curso aparece nos folhetos)
//  4. Os 3 melhores viram a sugestão, sem repetir a mesma "família" (ex.: não mostra 3 cursos de Marketing).
// ============================================================
import { CURSOS } from '../data/cursos.js';
import { FAMILIAS } from '../data/familias.js';
import { AREAS, TRACOS } from '../data/areas.js';
import { PERFIS } from '../data/perfis.js';
import { CONFIG } from '../config.js';
import { normalizar } from './texto.js';
import { tiposDaEscolaridade, rotuloEscolaridade } from '../data/escolaridade.js';
import {
  PERGUNTA_ESCOLARIDADE,
  PERGUNTA_FORMACAO,
  PERGUNTAS_AREA,
  PERGUNTAS_GOSTOS,
  PERGUNTAS_ESPECIFICAS,
} from '../data/perguntas.js';

export const NOME_TIPO = {
  graduacao: 'Graduação',
  pos: 'Pós-graduação',
  tecnico: 'Técnico',
  profissionalizante: 'Profissionalizante',
};

const PESOS = { area: 0.3, traco: 0.3, familia: 0.3, kw: 0.1 };

// ---------------------------------------------------------------- pool de cursos
const _pools = new Map();

/** Cursos recomendáveis para os tipos informados (sem repetir nomes; EAD tem preferência sobre semipresencial). */
export function poolDosTipos(tipos) {
  const chave = tipos.join('|');
  if (_pools.has(chave)) return _pools.get(chave);
  const candidatos = CURSOS.filter((c) => tipos.includes(c.tipo) && !c.restrito).sort(
    (a, b) =>
      tipos.indexOf(a.tipo) - tipos.indexOf(b.tipo) || (a.mod === 'EAD' ? 0 : 1) - (b.mod === 'EAD' ? 0 : 1),
  );
  const vistos = new Set();
  const pool = [];
  for (const c of candidatos) {
    const n = normalizar(c.nome);
    if (vistos.has(n)) continue;
    vistos.add(n);
    pool.push({ ...c, _n: n });
  }
  _pools.set(chave, pool);
  return pool;
}

// ---------------------------------------------------------------- sequência de perguntas
export function perguntasFixas(escId) {
  const areas = escId === 'grad' ? [PERGUNTA_FORMACAO, ...PERGUNTAS_AREA.slice(0, 3)] : PERGUNTAS_AREA;
  return [...areas, ...PERGUNTAS_GOSTOS];
}

/** Perguntas atuais (as específicas só aparecem depois que as 10 primeiras foram respondidas). */
export function montarSequencia(respostas) {
  const seq = [PERGUNTA_ESCOLARIDADE];
  const esc = respostas.escolaridade;
  if (!esc) return seq;
  const fixas = perguntasFixas(esc);
  seq.push(...fixas);
  if (fixas.every((p) => respostas[p.id] != null)) seq.push(...escolherEspecificas(respostas, esc));
  return seq;
}

/** Total exibido na barra de progresso (estimado enquanto as específicas ainda não foram escolhidas). */
export function totalPerguntas(respostas) {
  const esc = respostas.escolaridade;
  if (!esc) return 1 + 4 + PERGUNTAS_GOSTOS.length + CONFIG.QTD_ESPECIFICAS;
  const seq = montarSequencia(respostas);
  const temEspecificas = seq.some((p) => p.bloco === 'especifica');
  return temEspecificas ? seq.length : seq.length + CONFIG.QTD_ESPECIFICAS;
}

export function escolherEspecificas(respostas, escId, qtd = CONFIG.QTD_ESPECIFICAS) {
  const pool = poolDosTipos(tiposDaEscolaridade(escId));
  const P = calcularPerfil(respostas, perguntasFixas(escId));
  const rank = rankearAreas(P, pool).filter((r) => r.n >= 2 && (PERGUNTAS_ESPECIFICAS[r.area] || []).length);
  if (!rank.length) return [];
  const [r1, r2] = rank;
  const dominante = !r2 || (r1.score - r2.score) / (r1.score || 1) >= 0.18;
  const escolhidas = [];
  if (dominante) {
    escolhidas.push(...PERGUNTAS_ESPECIFICAS[r1.area].slice(0, qtd));
  } else {
    const n1 = Math.ceil(qtd * 0.6);
    const b1 = PERGUNTAS_ESPECIFICAS[r1.area].slice(0, n1);
    const b2 = PERGUNTAS_ESPECIFICAS[r2.area].slice(0, qtd - b1.length);
    for (let i = 0; i < Math.max(b1.length, b2.length); i++) {
      if (b1[i]) escolhidas.push(b1[i]);
      if (b2[i]) escolhidas.push(b2[i]);
    }
  }
  // completa com as próximas áreas se algum banco for curto
  for (const r of rank) {
    for (const p of PERGUNTAS_ESPECIFICAS[r.area]) {
      if (escolhidas.length >= qtd) break;
      if (!escolhidas.includes(p)) escolhidas.push(p);
    }
  }
  return escolhidas.slice(0, qtd);
}

// ---------------------------------------------------------------- perfil e pontuação
function somar(dest, orig) {
  if (!orig) return;
  for (const [k, v] of Object.entries(orig)) dest[k] = (dest[k] || 0) + v;
}

export function calcularPerfil(respostas, sequencia) {
  const P = { areas: {}, tracos: {}, familias: {}, kw: [], formacao: null };
  for (const p of sequencia) {
    if (p.tipo === 'escolaridade') continue;
    const op = p.opcoes[respostas[p.id]];
    if (!op) continue;
    somar(P.areas, op.a);
    somar(P.tracos, op.t);
    somar(P.familias, op.f);
    if (op.kw) P.kw.push(...op.kw);
    if (op.formacao) P.formacao = op.formacao;
  }
  return P;
}

const maximo = (obj, minimo = 1) => Math.max(minimo, ...Object.values(obj));

function contexto(P) {
  const aMax = maximo(P.areas);
  const tMax = maximo(P.tracos);
  const areaN = {};
  for (const [k, v] of Object.entries(P.areas)) areaN[k] = v / aMax;
  const tracoN = {};
  for (const [k, v] of Object.entries(P.tracos)) tracoN[k] = v / tMax;
  const kw = new Map();
  for (const k of P.kw) kw.set(k, (kw.get(k) || 0) + 1);
  return { areaN, tracoN, famMax: Math.max(6, ...Object.values(P.familias)), kw };
}

function cosseno(u, v) {
  let dot = 0;
  let nu = 0;
  let nv = 0;
  for (const k of new Set([...Object.keys(u), ...Object.keys(v)])) {
    const a = u[k] || 0;
    const b = v[k] || 0;
    dot += a * b;
    nu += a * a;
    nv += b * b;
  }
  return nu && nv ? dot / Math.sqrt(nu * nv) : 0;
}

/** Ordena as áreas (que existem no pool) da que mais combina para a que menos combina. */
export function rankearAreas(P, pool) {
  const ctx = contexto(P);
  const melhor = {};
  const cont = {};
  for (const c of pool) {
    const s = cosseno(ctx.tracoN, FAMILIAS[c.familia].t);
    melhor[c.area] = Math.max(melhor[c.area] || 0, s);
    cont[c.area] = (cont[c.area] || 0) + 1;
  }
  const maxAf = Math.max(0.0001, ...Object.values(melhor));
  return Object.keys(AREAS)
    .filter((a) => cont[a])
    .map((a) => ({ area: a, n: cont[a], score: 0.7 * (ctx.areaN[a] || 0) + 0.3 * (melhor[a] / maxAf) }))
    .sort((x, y) => y.score - x.score);
}

function pontuar(curso, P, ctx) {
  const fam = FAMILIAS[curso.familia];
  const A = ctx.areaN[curso.area] || 0;
  const T = cosseno(ctx.tracoN, fam.t);
  const F = Math.min(1, (P.familias[curso.familia] || 0) / ctx.famMax);
  let hits = 0;
  for (const [k, n] of ctx.kw) if (curso._n.includes(k)) hits += Math.min(n, 2);
  const K = Math.min(1, hits / 2);
  return PESOS.area * A + PESOS.traco * T + PESOS.familia * F + PESOS.kw * K + (curso.folheto ? CONFIG.BONUS_FOLHETO : 0);
}

function motivosDo(curso, ctx) {
  const fam = FAMILIAS[curso.familia];
  return Object.entries(fam.t)
    .map(([t, w]) => [t, w * (ctx.tracoN[t] || 0)])
    .filter(([, v]) => v > 0.3)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([t]) => TRACOS[t]);
}

// ---------------------------------------------------------------- resultado
/** Converte a nota interna (0 a ~1) em uma porcentagem amigável de "afinidade" (só para exibir). */
export function afinidadePct(score) {
  const t = Math.min(1, Math.max(0, (score - 0.25) / 0.7));
  return Math.round(50 + 47 * t);
}

export function recomendar(respostas) {
  const esc = respostas.escolaridade;
  const sequencia = montarSequencia(respostas);
  const pool = poolDosTipos(tiposDaEscolaridade(esc));
  const P = calcularPerfil(respostas, sequencia);
  const ctx = contexto(P);

  const pontuados = pool
    .map((c) => ({ curso: c, score: pontuar(c, P, ctx) }))
    .sort(
      (a, b) =>
        b.score - a.score ||
        a.curso.nome.length - b.curso.nome.length ||
        a.curso.nome.localeCompare(b.curso.nome, 'pt-BR'),
    );

  const areaRank = rankearAreas(P, pool)[0];
  const areaId = areaRank?.area || pontuados[0]?.curso.area;

  // 3 melhores, evitando repetir a mesma família. Uma alternativa de outra família só entra se for da área
  // principal da pessoa (ou quase tão boa quanto a melhor) — assim não aparece curso "de enfeite".
  const top = [];
  const familias = new Set();
  while (top.length < 3 && top.length < pontuados.length) {
    const restantes = pontuados.filter((p) => !top.includes(p));
    const melhor = restantes[0];
    const alternativa = restantes.find((p) => !familias.has(p.curso.familia));
    const serve =
      alternativa &&
      alternativa.score >= melhor.score * 0.6 &&
      (alternativa.curso.area === areaId || alternativa.score >= melhor.score * 0.85);
    const escolhido = serve ? alternativa : melhor;
    top.push(escolhido);
    familias.add(escolhido.curso.familia);
  }
  top.sort((a, b) => b.score - a.score);

  const tracosOrd = Object.entries(P.tracos).sort((a, b) => b[1] - a[1]);
  const t1 = tracosOrd[0]?.[0] || 'pessoas';
  const t2 = tracosOrd[1]?.[0] || null;
  return {
    escolaridade: esc,
    perfil: {
      traco: t1,
      ...PERFIS[t1],
      secundario: t2 ? { traco: t2, rotulo: TRACOS[t2] } : null,
    },
    area: { id: areaId, nome: AREAS[areaId].nome, emoji: AREAS[areaId].emoji },
    tracos: tracosOrd.slice(0, 3).map(([id]) => ({ id, rotulo: TRACOS[id] })),
    cursos: top.map((p) => ({
      curso: p.curso,
      score: p.score,
      afinidade: afinidadePct(p.score),
      motivos: motivosDo(p.curso, ctx),
      naFormacao: Boolean(P.formacao && p.curso.area === P.formacao),
    })),
  };
}

/** Campos prontos para gravar no lead depois do teste. */
export function resumoParaSalvar(respostas, resultado, duracaoSeg) {
  const brutas = {};
  for (const [k, v] of Object.entries(respostas)) brutas[k] = v;
  return {
    escolaridade: rotuloEscolaridade(respostas.escolaridade),
    area: resultado.area.nome,
    perfil: resultado.perfil.titulo,
    sugestoes: resultado.cursos.map((c) => ({
      id: c.curso.id ?? null,
      nome: c.curso.oficial,
      afinidade: c.afinidade,
    })),
    respostas: brutas,
    duracaoSeg: Math.round(duracaoSeg),
  };
}

/** (Ferramenta de ajuste) Mostra os melhores cursos com o detalhe da nota. */
export function explicarPontuacao(respostas, n = 12) {
  const sequencia = montarSequencia(respostas);
  const pool = poolDosTipos(tiposDaEscolaridade(respostas.escolaridade));
  const P = calcularPerfil(respostas, sequencia);
  const ctx = contexto(P);
  return pool
    .map((c) => {
      const fam = FAMILIAS[c.familia];
      return {
        nome: c.nome, tipo: c.tipo, area: c.area, familia: c.familia,
        A: +(ctx.areaN[c.area] || 0).toFixed(2),
        T: +cosseno(ctx.tracoN, fam.t).toFixed(2),
        F: +Math.min(1, (P.familias[c.familia] || 0) / ctx.famMax).toFixed(2),
        nota: +pontuar(c, P, ctx).toFixed(3),
      };
    })
    .sort((a, b) => b.nota - a.nota)
    .slice(0, n);
}

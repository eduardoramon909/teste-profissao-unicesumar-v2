import { CURSOS } from '../data/cursos.js';
import { normalizar } from './texto.js';

export const NOME_TIPO = {
  graduacao: 'Graduação',
  pos: 'Pós-graduação',
  tecnico: 'Técnico',
  profissionalizante: 'Profissionalizante',
};
export const NOME_TIPO_PLURAL = {
  graduacao: 'Graduação',
  pos: 'Pós-graduação',
  tecnico: 'Técnicos',
  profissionalizante: 'Profissionalizantes',
};

const MODALIDADE_POR_TIPO = {
  graduacao: 'EAD - GRADUAÇÃO',
  pos: 'EAD - PÓS-GRADUAÇÃO',
  tecnico: 'EAD - TÉCNICO',
  profissionalizante: 'EAD - PROFISSIONALIZANTES',
};

/** Modalidade no padrão da planilha modelo (a lista da planilha não tem "semipresencial": usa a de graduação). */
export function modalidadeDoCurso(curso) {
  if (curso.mod === 'Híbrida') return 'EAD - PÓS-GRADUAÇÃO HÍBRIDA';
  return MODALIDADE_POR_TIPO[curso.tipo];
}

export const CAMPOS_CURSO_VAZIOS = { cursoId: null, cursoPretendido: '', modalidade: '' };

/** Campos gravados no lead quando um curso é escolhido. */
export function camposDoCurso(curso) {
  if (!curso) return { ...CAMPOS_CURSO_VAZIOS };
  return {
    cursoId: curso.id ?? null,
    cursoPretendido: curso.oficial,
    modalidade: modalidadeDoCurso(curso),
  };
}

const porId = new Map(CURSOS.filter((c) => c.id != null).map((c) => [c.id, c]));
const porOficial = new Map(CURSOS.map((c) => [c.oficial, c]));

/** Encontra o curso do catálogo a partir do que está salvo no lead. */
export function acharCurso(lead) {
  if (!lead) return null;
  if (lead.cursoId != null && porId.has(lead.cursoId)) return porId.get(lead.cursoId);
  if (lead.cursoPretendido && porOficial.has(lead.cursoPretendido)) return porOficial.get(lead.cursoPretendido);
  return null;
}

export function nomeDoCursoDoLead(lead) {
  const c = acharCurso(lead);
  return c ? c.nome : lead?.cursoPretendido || '';
}

export function selo(curso) {
  if (curso.mod === 'Semipresencial') return 'Semipresencial';
  if (curso.mod === 'Híbrida') return 'Híbrida';
  return '';
}

export function textoBusca(curso) {
  return normalizar(`${curso.nome} ${curso.secao} ${NOME_TIPO[curso.tipo]} ${curso.mod}`);
}

// Quando o mesmo curso existe em EAD e semipresencial, as duas linhas ganham selo para não confundir.
const _repeticoes = new Map();
for (const c of CURSOS) {
  const k = `${c.tipo}|${normalizar(c.nome)}`;
  _repeticoes.set(k, (_repeticoes.get(k) || 0) + 1);
}
export function seloModalidade(curso) {
  return selo(curso) || (_repeticoes.get(`${curso.tipo}|${normalizar(curso.nome)}`) > 1 ? 'EAD' : '');
}

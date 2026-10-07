import { CONFIG } from '../config.js';

/** Chave da "ação" = o dia (YYYY-MM-DD) no fuso configurado. Tudo que acontece no mesmo dia cai na mesma ação. */
export function acaoIdDe(data = new Date(), fuso = CONFIG.FUSO) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: fuso,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(data);
}

/** "2026-09-28" -> { data: "28/09/2026", dia: "segunda-feira" } */
export function descreverAcao(acaoId) {
  const [y, m, d] = String(acaoId).split('-').map(Number);
  if (!y || !m || !d) return { data: String(acaoId), dia: '' };
  const dt = new Date(Date.UTC(y, m - 1, d, 12));
  const dia = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', timeZone: 'UTC' }).format(dt);
  return { data: `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`, dia };
}

/** Aceita Timestamp do Firestore, Date, número (ms) ou string ISO. */
export function paraData(v) {
  if (!v) return null;
  if (typeof v.toDate === 'function') return v.toDate();
  if (v instanceof Date) return v;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function formatarHora(v, fuso = CONFIG.FUSO) {
  const d = paraData(v);
  if (!d) return '';
  return new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: fuso }).format(d);
}

export function formatarDataHora(v, fuso = CONFIG.FUSO) {
  const d = paraData(v);
  if (!d) return '';
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: fuso,
  }).format(d);
}

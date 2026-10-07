import { montarSequencia, recomendar } from '../src/lib/recomendador.js';

const dot = (u = {}, v = {}) => Object.keys(u).reduce((s, k) => s + (u[k] || 0) * (v[k] || 0), 0);
const soma = (o = {}) => Object.values(o).reduce((s, x) => s + x, 0);

/** Simula uma pessoa com preferências coerentes: em cada pergunta marca a opção que mais combina com o "persona". */
export function responder(persona, escolaridade) {
  const respostas = { escolaridade };
  for (let guarda = 0; guarda < 40; guarda++) {
    const seq = montarSequencia(respostas);
    const q = seq.find((p) => p.tipo !== 'escolaridade' && respostas[p.id] == null);
    if (!q) break;
    let melhor = 0;
    let melhorNota = -1;
    q.opcoes.forEach((op, i) => {
      // quanto mais "ruído" (pesos que a pessoa não liga) a opção tem, menos ela atrai
      const bruto = dot(persona.a, op.a) + dot(persona.t, op.t) + dot(persona.f, op.f) * 1.2;
      const nota = bruto / (1 + 0.15 * (soma(op.a) + soma(op.t) + soma(op.f))) - 0.001 * (soma(op.a) + soma(op.t) + soma(op.f));
      if (nota > melhorNota) { melhorNota = nota; melhor = i; }
    });
    respostas[q.id] = melhor;
  }
  return respostas;
}

export const PERSONAS = {
  numeros:   { esc: 'med3', a: { negocios: 3 }, t: { numeros: 3, organizar: 1 }, f: { contabil: 3, financas: 3, adm: 1 } },
  tech:      { esc: 'med2', a: { tecnologia: 3 }, t: { tecnologia: 3, cientifico: 1 }, f: { dev: 3, ux: 1 } },
  cuidar:    { esc: 'med3', a: { saude: 3 }, t: { cuidar: 3, pessoas: 1 }, f: { enfermagem: 3, fisioterapia: 1, 'saude-idoso': 1 } },
  professora:{ esc: 'grad', a: { educacao: 3 }, t: { ensinar: 3 }, f: { psicopedagogia: 3, inclusao: 2, pedagogia: 1 } },
  criativo:  { esc: 'fund8', a: { comunicacao: 3, tecnologia: 1 }, t: { criar: 3, comunicar: 1 }, f: { games: 3, 'design-visual': 2, audiovisual: 2 } },
  direito:   { esc: 'med3', a: { direito: 3 }, t: { lei: 3 }, f: { direito: 3, seguranca: 1 } },
  natureza:  { esc: 'fund9', a: { ambiente: 3 }, t: { natureza: 3 }, f: { agro: 2, ambiental: 3, 'saude-animal': 2 } },
  cozinha:   { esc: 'med1', a: { alimentos: 3 }, t: { gastro: 3, criar: 1 }, f: { gastronomia: 3 } },
  esporte:   { esc: 'med3', a: { saude: 2, educacao: 1 }, t: { esporte: 3 }, f: { 'esporte-saude': 3, 'ensino-fisica': 2 } },
  engenharia:{ esc: 'med3', a: { engenharia: 3 }, t: { pratico: 3, cientifico: 1 }, f: { 'eletrica-automacao': 2, 'eng-civil': 3, producao: 1 } },
  gradGestor:{ esc: 'grad', a: { negocios: 3 }, t: { lideranca: 3, pessoas: 1 }, f: { rh: 3, estrategia: 2 } },
  gradSaude: { esc: 'grad', a: { saude: 3 }, t: { cuidar: 3 }, f: { enfermagem: 2, 'saude-mental': 3 } },
  comunica:  { esc: 'med3', a: { comunicacao: 3, negocios: 1 }, t: { comunicar: 3, criar: 1 }, f: { publicidade: 3, marketing: 2, jornalismo: 1 } },
  vendas:    { esc: 'med1', a: { negocios: 3 }, t: { comunicar: 2, pessoas: 2 }, f: { vendas: 3, marketing: 1 } },
};

export function rodar(persona) {
  const respostas = responder(persona, persona.esc);
  const r = recomendar(respostas);
  return { respostas, r, total: Object.keys(respostas).length };
}

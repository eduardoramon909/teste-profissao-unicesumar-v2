import { PERSONAS, responder } from './helpers.mjs';
import { explicarPontuacao, calcularPerfil, montarSequencia } from '../src/lib/recomendador.js';
const nome = process.argv[2] || 'direito';
const p = PERSONAS[nome];
const r = responder(p, p.esc);
const P = calcularPerfil(r, montarSequencia(r));
console.log('áreas', P.areas); console.log('traços', P.tracos); console.log('famílias', P.familias);
console.table(explicarPontuacao(r, 14));

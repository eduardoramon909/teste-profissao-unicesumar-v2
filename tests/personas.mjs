// Ferramenta de ajuste: node tests/personas.mjs  -> imprime a sugestão de cada persona.
import { PERSONAS, rodar } from './helpers.mjs';
import { NOME_TIPO } from '../src/lib/recomendador.js';
for (const [nome, p] of Object.entries(PERSONAS)) {
  const { r, total } = rodar(p);
  console.log(`\n▶ ${nome} (${p.esc}) | ${total} respostas | área: ${r.area.nome} | perfil: ${r.perfil.titulo}`);
  for (const c of r.cursos) {
    console.log(`   ${String(c.afinidade).padStart(3)}%  ${c.curso.nome}  [${NOME_TIPO[c.curso.tipo]}${c.curso.mod !== 'EAD' ? ' ' + c.curso.mod : ''} · ${c.curso.familia}]  (${c.score.toFixed(2)})${c.naFormacao ? ' ✔formação' : ''}  – ${c.motivos.join(' + ')}`);
  }
}

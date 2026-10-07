// Testes automáticos da lógica (rode com: npm test)
import test from 'node:test';
import assert from 'node:assert/strict';
import ExcelJS from 'exceljs';

import { cpfValido, formatarCPF, whatsappValido, formatarWhatsapp, normalizarWhatsapp, nomeValido, emailValido } from '../src/lib/validacoes.js';
import { formatarNome, normalizar } from '../src/lib/texto.js';
import { acaoIdDe, descreverAcao } from '../src/lib/datas.js';
import { CURSOS } from '../src/data/cursos.js';
import { CURSOS_OFICIAIS } from '../src/data/oficial.js';
import { FAMILIAS } from '../src/data/familias.js';
import { AREAS, TRACOS } from '../src/data/areas.js';
import { ESCOLARIDADES, TRILHAS } from '../src/data/escolaridade.js';
import {
  PERGUNTAS_AREA, PERGUNTAS_GOSTOS, PERGUNTAS_ESPECIFICAS, PERGUNTA_FORMACAO,
} from '../src/data/perguntas.js';
import { CONFIG } from '../src/config.js';
import { montarSequencia, recomendar, poolDosTipos, totalPerguntas } from '../src/lib/recomendador.js';
import { montarPlanilha, deduplicarPorCpf, nomeArquivo } from '../src/lib/exportar.js';
import { responder, PERSONAS } from './helpers.mjs';

// ------------------------------------------------------------------ validações
test('CPF: algoritmo oficial (sem API)', () => {
  for (const ok of ['52998224725', '529.982.247-25', '11144477735', '39053344705']) assert.equal(cpfValido(ok), true, ok);
  for (const ruim of ['52998224726', '11111111111', '00000000000', '123', '', '5299822472', '529982247250']) assert.equal(cpfValido(ruim), false, ruim);
  assert.equal(formatarCPF('52998224725'), '529.982.247-25');
  assert.equal(formatarCPF('5299'), '529.9');
});

test('WhatsApp: DDD real + 9 dígitos', () => {
  assert.equal(whatsappValido('(91) 98888-7777'), true);
  assert.equal(whatsappValido('+55 94 98123-4567'), true);
  assert.equal(whatsappValido('44988887777'), true);
  assert.equal(whatsappValido('10988887777'), false); // DDD 10 não existe
  assert.equal(whatsappValido('9138887777'), false); // falta o 9
  assert.equal(whatsappValido('919888877'), false);
  assert.equal(normalizarWhatsapp('+55 (91) 98888-7777'), '91988887777');
  assert.equal(formatarWhatsapp('91988887777'), '(91) 98888-7777');
});

test('Nome e e-mail', () => {
  assert.equal(nomeValido('Maria Silva'), true);
  assert.equal(nomeValido('Ana Lu'), true);
  assert.equal(nomeValido('Maria'), false);
  assert.equal(nomeValido('12345 6789'), false);
  assert.equal(formatarNome('  maria DA silva   dos santos '), 'Maria da Silva dos Santos');
  assert.equal(formatarNome("joão d'ávila-souza"), "João D'Ávila-Souza");
  assert.equal(emailValido('a@b.co'), true);
  assert.equal(emailValido('a@b'), false);
  assert.equal(normalizar('  Ação  Educação '), 'acao educacao');
});

test('Ação = dia no fuso de Belém/São Paulo', () => {
  assert.equal(acaoIdDe(new Date('2026-09-28T02:30:00Z')), '2026-09-27'); // 23:30 do dia anterior (UTC-3)
  assert.equal(acaoIdDe(new Date('2026-09-28T03:00:00Z')), '2026-09-28');
  assert.deepEqual(descreverAcao('2026-09-28'), { data: '28/09/2026', dia: 'segunda-feira' });
});

// ------------------------------------------------------------------ dados
test('Catálogo de cursos é consistente', () => {
  assert.ok(CURSOS.length >= 500);
  const oficiais = new Set(CURSOS_OFICIAIS.map(([nm]) => nm));
  const vistos = new Set();
  for (const c of CURSOS) {
    assert.ok(AREAS[c.area], `área inválida: ${c.nome}`);
    assert.ok(FAMILIAS[c.familia], `família inválida: ${c.nome}`);
    assert.ok(['graduacao', 'pos', 'tecnico', 'profissionalizante'].includes(c.tipo), c.nome);
    assert.ok(!vistos.has(c.oficial), `nome oficial repetido: ${c.oficial}`);
    vistos.add(c.oficial);
    if (c.id != null) assert.ok(oficiais.has(c.oficial), `não existe na planilha oficial: ${c.oficial}`);
  }
  for (const t of ['graduacao', 'pos', 'tecnico', 'profissionalizante']) {
    assert.ok(CURSOS.filter((c) => c.tipo === t).length >= 10, `poucos cursos em ${t}`);
  }
});

test('Famílias, áreas e perguntas só usam chaves que existem', () => {
  for (const [id, f] of Object.entries(FAMILIAS)) {
    for (const t of Object.keys(f.t)) assert.ok(TRACOS[t], `traço inexistente ${t} em ${id}`);
  }
  const todas = [...PERGUNTAS_AREA, PERGUNTA_FORMACAO, ...PERGUNTAS_GOSTOS, ...Object.values(PERGUNTAS_ESPECIFICAS).flat()];
  const ids = new Set();
  for (const q of todas) {
    assert.ok(!ids.has(q.id), `id de pergunta repetido: ${q.id}`);
    ids.add(q.id);
    assert.ok(q.opcoes.length >= 2 && q.opcoes.length <= 8, `${q.id}: nº de opções`);
    for (const op of q.opcoes) {
      for (const a of Object.keys(op.a || {})) assert.ok(AREAS[a], `${q.id}: área ${a}`);
      for (const t of Object.keys(op.t || {})) assert.ok(TRACOS[t], `${q.id}: traço ${t}`);
      for (const f of Object.keys(op.f || {})) assert.ok(FAMILIAS[f], `${q.id}: família ${f}`);
      for (const k of op.kw || []) assert.equal(k, normalizar(k), `${q.id}: kw deve ser sem acento/minúscula (${k})`);
    }
  }
  for (const a of Object.keys(AREAS)) assert.ok((PERGUNTAS_ESPECIFICAS[a] || []).length >= 4, `banco específico curto: ${a}`);
});

// ------------------------------------------------------------------ sequência do teste
test('Sequência: 15 perguntas, ids únicos, pergunta de formação só para graduados', () => {
  for (const g of ESCOLARIDADES) {
    for (const item of g.itens) {
      const respostas = { escolaridade: item.id };
      for (let i = 0; i < 40; i++) {
        const q = montarSequencia(respostas).find((p) => p.tipo !== 'escolaridade' && respostas[p.id] == null);
        if (!q) break;
        respostas[q.id] = 0;
      }
      const seq = montarSequencia(respostas);
      assert.equal(seq.length, 1 + 4 + PERGUNTAS_GOSTOS.length + CONFIG.QTD_ESPECIFICAS, item.id);
      assert.equal(new Set(seq.map((q) => q.id)).size, seq.length, `ids repetidos (${item.id})`);
      assert.equal(seq.some((q) => q.id === 'formacao'), item.id === 'grad', item.id);
      assert.equal(totalPerguntas(respostas), seq.length);
      assert.equal(seq[0].tipo, 'escolaridade');
      assert.deepEqual(seq.slice(1, 5).map((q) => q.bloco), ['area', 'area', 'area', 'area']);
      assert.deepEqual(seq.slice(5, 10).map((q) => q.bloco), Array(5).fill('gosto'));
      assert.ok(seq.slice(10).every((q) => q.bloco === 'especifica'));
    }
  }
});

test('Cada escolaridade recebe só o tipo de curso certo', () => {
  const esperado = {
    fund7: ['profissionalizante', 'tecnico'], fund8: ['profissionalizante', 'tecnico'], fund9: ['profissionalizante', 'tecnico'],
    med1: ['tecnico', 'profissionalizante'], med2: ['tecnico', 'profissionalizante'], med3: ['graduacao'], medc: ['graduacao'], grad: ['pos'],
  };
  assert.deepEqual(TRILHAS, esperado);
  for (const [id, tipos] of Object.entries(TRILHAS)) {
    const pool = poolDosTipos(tipos);
    assert.ok(pool.length > 15, id);
    assert.ok(pool.every((c) => tipos.includes(c.tipo) && !c.restrito), id);
    assert.equal(new Set(pool.map((c) => normalizar(c.nome))).size, pool.length, `nomes repetidos no pool de ${id}`);
  }
});

// ------------------------------------------------------------------ recomendação
const nomes = (r) => r.cursos.map((c) => c.curso.nome);

test('Recomendação: perfis simulados recebem cursos coerentes', () => {
  const rodar = (p) => recomendar(responder(p, p.esc));

  const num = rodar(PERSONAS.numeros);
  assert.ok(nomes(num).some((n) => /Contábeis|Financeira|Administração|Econômicas|Financeiro/.test(n)), nomes(num).join(', '));
  assert.ok(num.cursos.every((c) => c.curso.tipo === 'graduacao'));
  assert.equal(num.area.nome, 'Gestão e Negócios');

  const tech = rodar(PERSONAS.tech);
  assert.ok(tech.cursos.every((c) => ['tecnico', 'profissionalizante'].includes(c.curso.tipo)));
  assert.ok(tech.cursos.some((c) => ['dev', 'ux', 'games'].includes(c.curso.familia)), nomes(tech).join(', '));

  const cuidar = rodar(PERSONAS.cuidar);
  assert.ok(cuidar.cursos.some((c) => c.curso.area === 'saude'), nomes(cuidar).join(', '));

  const prof = rodar(PERSONAS.professora);
  assert.ok(prof.cursos.every((c) => c.curso.tipo === 'pos'));
  assert.equal(prof.area.nome, 'Educação');
  assert.ok(prof.cursos.some((c) => c.naFormacao));

  const cozinha = rodar(PERSONAS.cozinha);
  assert.ok(cozinha.cursos.some((c) => c.curso.area === 'alimentos'), nomes(cozinha).join(', '));
});

test('Recomendação: sempre 3 cursos distintos, ordenados e determinísticos', () => {
  for (const [nome, p] of Object.entries(PERSONAS)) {
    const respostas = responder(p, p.esc);
    const a = recomendar(respostas);
    const b = recomendar(respostas);
    assert.deepEqual(nomes(a), nomes(b), `${nome}: resultado não determinístico`);
    assert.equal(a.cursos.length, 3, nome);
    assert.equal(new Set(a.cursos.map((c) => c.curso.oficial)).size, 3, nome);
    const afin = a.cursos.map((c) => c.afinidade);
    assert.deepEqual([...afin].sort((x, y) => y - x), afin, `${nome}: fora de ordem`);
    assert.ok(afin.every((x) => x >= 50 && x <= 98), `${nome}: ${afin}`);
    assert.ok(a.perfil.titulo && a.area.nome, nome);
  }
});

test('Robustez: 400 conjuntos aleatórios de respostas não quebram', () => {
  let seed = 123456789;
  const rnd = () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const escs = Object.keys(TRILHAS);
  for (let i = 0; i < 400; i++) {
    const respostas = { escolaridade: escs[Math.floor(rnd() * escs.length)] };
    for (let k = 0; k < 40; k++) {
      const q = montarSequencia(respostas).find((p) => p.tipo !== 'escolaridade' && respostas[p.id] == null);
      if (!q) break;
      respostas[q.id] = Math.floor(rnd() * q.opcoes.length);
    }
    const r = recomendar(respostas);
    assert.equal(r.cursos.length, 3);
    assert.ok(r.cursos.every((c) => Number.isFinite(c.afinidade) && c.curso.nome));
  }
});

// ------------------------------------------------------------------ planilha
const leadsExemplo = [
  { id: 'a', nome: 'Maria da Silva', whatsapp: '91988887777', cpf: '52998224725', email: '', cursoId: 56, cursoPretendido: 'ADMINISTRAÇÃO (GRADUAÇÃO - EAD)', modalidade: 'EAD - GRADUAÇÃO', origem: 'sugestao', status: 'concluido', criadoEm: new Date('2026-09-28T13:05:00Z') },
  { id: 'b', nome: 'João Souza', whatsapp: '91977776666', cpf: '11144477735', email: 'j@x.com', cursoPretendido: '', modalidade: '', status: 'teste_iniciado', criadoEm: new Date('2026-09-28T14:10:00Z') },
  { id: 'c', nome: 'Maria da Silva', whatsapp: '91988887777', cpf: '52998224725', cursoPretendido: '', modalidade: '', status: 'teste_iniciado', criadoEm: new Date('2026-09-28T15:00:00Z') },
];

test('Planilha: mesmo formato do modelo (Leads + Cursos) e deduplicação por CPF', async () => {
  assert.equal(deduplicarPorCpf(leadsExemplo).length, 2);
  assert.equal(deduplicarPorCpf(leadsExemplo).find((l) => l.cpf === '52998224725').id, 'a'); // fica o que tem curso
  assert.equal(nomeArquivo({ id: '2026-09-28', nome: 'Feira das Profissões – Colégio X' }), 'leads_feira-das-profissoes-colegio-x_2026-09-28.xlsx');

  const wb = await montarPlanilha(ExcelJS, { acao: { id: '2026-09-28', nome: 'Feira X' }, leads: leadsExemplo, removerDuplicados: true });
  const buf = await wb.xlsx.writeBuffer();
  const lido = new ExcelJS.Workbook();
  await lido.xlsx.load(buf);
  assert.deepEqual(lido.worksheets.map((w) => w.name), ['Leads', 'Cursos', 'Detalhes']);

  const ws = lido.getWorksheet('Leads');
  assert.deepEqual(ws.getRow(1).values.slice(1, 9), ['NOME COMPLETO', 'CPF (opcional)', 'EMAIL', 'CELULAR', 'MODALIDADE', 'ID_MODALIDADE', 'CURSO (opcional)', 'ID_CURSO']);
  assert.equal(ws.getCell('A2').value, 'Maria da Silva');
  assert.equal(ws.getCell('B2').value, '529.982.247-25');
  assert.equal(ws.getCell('D2').value, '(91) 98888-7777');
  assert.equal(ws.getCell('E2').value, 'EAD - GRADUAÇÃO');
  assert.equal(ws.getCell('G2').value, 'ADMINISTRAÇÃO (GRADUAÇÃO - EAD)');
  assert.equal(ws.getCell('F2').value.formula, 'IFERROR(VLOOKUP(E2,Cursos!E:F,2,0),"")');
  assert.equal(ws.getCell('H2').value.formula, 'IFERROR(VLOOKUP(G2,Cursos!A:B,2,0),"")');
  assert.equal(ws.getCell('A4').value, null); // só 2 leads após remover o CPF repetido
  assert.equal(ws.getColumn(6).hidden, true);
  assert.equal(ws.getColumn(8).hidden, true);

  const wc = lido.getWorksheet('Cursos');
  assert.equal(wc.rowCount, CURSOS_OFICIAIS.length + 1);
  assert.equal(wc.getCell('A2').value, CURSOS_OFICIAIS[0][0]);
  assert.equal(wc.getCell('E2').value, 'EAD - GRADUAÇÃO');
  assert.equal(wc.getCell('F2').value, 9);
});

// Exportação da planilha de leads no MESMO formato do modelo enviado (abas "Leads" e "Cursos"),
// mais uma aba extra "Detalhes" com dados do teste (área, perfil, sugestões...).
import { CURSOS_OFICIAIS, MODALIDADES } from '../data/oficial.js';
import { descreverAcao, formatarHora, paraData } from './datas.js';
import { acharCurso, nomeDoCursoDoLead } from './cursos.js';
import { formatarCPF, formatarWhatsapp } from './validacoes.js';
import { normalizar } from './texto.js';

const ID_CURSO = new Map();
for (const [nome, id] of CURSOS_OFICIAIS) if (!ID_CURSO.has(nome)) ID_CURSO.set(nome, id); // VLOOKUP devolve a 1ª ocorrência
const ID_MODALIDADE = new Map(MODALIDADES);

const ORIGEM = {
  cadastro: 'Cadastro direto (sem teste)',
  sugestao: 'Teste: curso sugerido',
  lista: 'Teste: curso escolhido na lista',
  admin: 'Editado no painel',
};
const STATUS = {
  cadastro: 'Cadastro direto',
  teste_iniciado: 'Teste não concluído',
  teste_concluido: 'Teste concluído, sem curso escolhido',
  concluido: 'Concluído',
};

const tempo = (l) => paraData(l.criadoEm)?.getTime() ?? 0;
export const porHorario = (a, b) => tempo(a) - tempo(b);

/** Mantém um registro por CPF: prefere o que tem curso escolhido e, depois, o mais recente. */
export function deduplicarPorCpf(leads) {
  const melhor = new Map();
  for (const l of leads) {
    const atual = melhor.get(l.cpf);
    if (!atual) { melhor.set(l.cpf, l); continue; }
    const pontos = (x) => (x.cursoPretendido ? 1e15 : 0) + tempo(x);
    if (pontos(l) > pontos(atual)) melhor.set(l.cpf, l);
  }
  return leads.filter((l) => melhor.get(l.cpf) === l);
}

export function nomeArquivo(acao) {
  const slug = normalizar(acao.nome || 'acao').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80) || 'acao';
  return `leads_${slug}_${acao.id}.xlsx`;
}

const AZUL = 'FF1B345A';
const FONTE_CURSOS = { name: 'Segoe UI', size: 11 };

/** Monta o workbook. Recebe o construtor do ExcelJS (assim também roda em Node, nos testes). */
export async function montarPlanilha(ExcelJS, { acao, leads, removerDuplicados = false }) {
  const lista = [...(removerDuplicados ? deduplicarPorCpf(leads) : leads)].sort(porHorario);
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Teste de Profissão UniCesumar';
  wb.created = new Date();
  wb.calcProperties.fullCalcOnLoad = true;

  // ---------------------------------------------------------------- aba Leads (igual ao modelo)
  const ws = wb.addWorksheet('Leads', { views: [{ state: 'frozen', ySplit: 1 }] });
  ws.columns = [
    { key: 'nome', width: 34.3 },
    { key: 'cpf', width: 17.2 },
    { key: 'email', width: 42.1 },
    { key: 'cel', width: 26.8 },
    { key: 'mod', width: 32.7 },
    { key: 'idmod', width: 17.1, hidden: true },
    { key: 'curso', width: 66.3 },
    { key: 'idcurso', width: 10.9, hidden: true },
  ];
  const cab = ['NOME COMPLETO', 'CPF (opcional)', 'EMAIL', 'CELULAR', 'MODALIDADE', 'ID_MODALIDADE', 'CURSO (opcional)', 'ID_CURSO'];
  cab.forEach((t, i) => {
    const c = ws.getCell(1, i + 1);
    c.value = t;
    c.font = { name: 'Calibri', size: 11, bold: true };
    if (i === 5 || i === 7) c.alignment = { horizontal: 'center' };
  });
  for (const col of [2, 4, 5, 7]) ws.getColumn(col).numFmt = '@';

  const ULTIMA = Math.max(2000, lista.length + 1);
  for (let r = 2; r <= ULTIMA; r++) {
    const l = lista[r - 2];
    const modalidade = l?.modalidade || '';
    const curso = l?.cursoPretendido || '';
    if (l) {
      ws.getCell(r, 1).value = l.nome;
      ws.getCell(r, 2).value = formatarCPF(l.cpf);
      ws.getCell(r, 3).value = l.email || null;
      ws.getCell(r, 4).value = formatarWhatsapp(l.whatsapp);
      ws.getCell(r, 5).value = modalidade || null;
      ws.getCell(r, 7).value = curso || null;
    }
    ws.getCell(r, 6).value = { formula: `IFERROR(VLOOKUP(E${r},Cursos!E:F,2,0),"")`, result: ID_MODALIDADE.get(modalidade) ?? '' };
    ws.getCell(r, 8).value = { formula: `IFERROR(VLOOKUP(G${r},Cursos!A:B,2,0),"")`, result: ID_CURSO.get(curso) ?? '' };
    ws.getCell(r, 6).alignment = { horizontal: 'center' };
    ws.getCell(r, 8).alignment = { horizontal: 'right' };
  }
  ws.dataValidations.add(`E2:E${ULTIMA}`, { type: 'list', allowBlank: true, showErrorMessage: true, formulae: ['Cursos!$E$2:$E$6'] });
  ws.dataValidations.add(`G2:G${ULTIMA}`, { type: 'list', allowBlank: true, showErrorMessage: true, formulae: ['Cursos!$A$2:$A$1048576'] });

  // ---------------------------------------------------------------- aba Cursos (cópia do modelo)
  const wc = wb.addWorksheet('Cursos', { views: [{ zoomScale: 70 }] });
  [118.2, 15.5, 29.2, 15.7, 35.2, 21].forEach((w, i) => { wc.getColumn(i + 1).width = w; });
  ['NM_CURSO', 'ID_CURSO', 'CD_CURSO', null, 'MODALIDADE', 'ID_MODALIDADE'].forEach((t, i) => {
    if (t) wc.getCell(1, i + 1).value = t;
  });
  CURSOS_OFICIAIS.forEach(([nm, id, cd], i) => {
    const r = i + 2;
    const linha = wc.getRow(r);
    linha.height = 16.5;
    [nm, id, cd].forEach((v, k) => {
      const c = linha.getCell(k + 1);
      c.value = v;
      c.font = FONTE_CURSOS;
      c.alignment = { vertical: 'middle', wrapText: true };
    });
  });
  MODALIDADES.forEach(([m, id], i) => {
    wc.getCell(i + 2, 5).value = m;
    wc.getCell(i + 2, 6).value = id;
  });

  // ---------------------------------------------------------------- aba Detalhes (extra)
  const wd = wb.addWorksheet('Detalhes');
  const { data, dia } = descreverAcao(acao.id);
  wd.getCell('A1').value = 'Ação';
  wd.getCell('B1').value = acao.nome || '(sem nome)';
  wd.getCell('A2').value = 'Data';
  wd.getCell('B2').value = `${data} (${dia})`;
  wd.getCell('A3').value = 'Leads na planilha';
  wd.getCell('B3').value = lista.length;
  ['A1', 'A2', 'A3'].forEach((a) => { wd.getCell(a).font = { bold: true }; });
  const cabD = ['Hora', 'Nome completo', 'WhatsApp', 'CPF', 'E-mail', 'Escolaridade', 'Área do perfil', 'Perfil', 'Curso pretendido', 'Origem do curso', 'Sugestões do teste', 'Situação', 'Duração do teste (s)'];
  const larg = [8, 34, 17, 16, 30, 26, 30, 26, 52, 30, 80, 32, 14];
  cabD.forEach((t, i) => {
    const c = wd.getCell(5, i + 1);
    c.value = t;
    c.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: AZUL } };
    c.alignment = { vertical: 'middle', wrapText: true };
    wd.getColumn(i + 1).width = larg[i];
  });
  wd.getRow(5).height = 30;
  lista.forEach((l, i) => {
    const sug = (l.sugestoes || [])
      .map((s) => `${acharCurso({ cursoId: s.id, cursoPretendido: s.nome })?.nome ?? s.nome} (${s.afinidade}%)`)
      .join('  |  ');
    const cursoObj = acharCurso(l);
    const obs = l.cursoPretendido && cursoObj && cursoObj.id == null ? ' [sem ID na planilha oficial]' : '';
    const valores = [
      formatarHora(l.criadoEm), l.nome, formatarWhatsapp(l.whatsapp), formatarCPF(l.cpf), l.email || '',
      l.escolaridade || '', l.area || '', l.perfil || '', (nomeDoCursoDoLead(l) || '') + obs,
      ORIGEM[l.origem] || '', sug, STATUS[l.status] || '', l.duracaoSeg ?? '',
    ];
    valores.forEach((v, k) => { wd.getCell(6 + i, k + 1).value = v === '' ? null : v; });
    wd.getCell(6 + i, 3).numFmt = '@';
    wd.getCell(6 + i, 4).numFmt = '@';
  });
  wd.autoFilter = { from: { row: 5, column: 1 }, to: { row: 5 + Math.max(lista.length, 1), column: cabD.length } };
  wd.views = [{ state: 'frozen', ySplit: 5 }];

  return wb;
}

/** Gera o .xlsx no navegador e dispara o download. */
export async function baixarPlanilha({ acao, leads, removerDuplicados }) {
  const mod = await import('exceljs/dist/exceljs.min.js');
  const ExcelJS = mod.default ?? mod;
  const wb = await montarPlanilha(ExcelJS, { acao, leads, removerDuplicados });
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const nome = nomeArquivo(acao);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nome;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
  return nome;
}

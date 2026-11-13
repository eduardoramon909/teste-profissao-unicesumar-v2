// Lógica pura do módulo de Horários (escala da equipe). Sem dependências de UI/Firebase,
// pra ficar fácil de testar e de reaproveitar entre a visão semana/mês/ano.

export const DIAS_LABEL = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
export const DIAS_ABREV = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
// Ordem de exibição (semana começando na segunda, sábado em destaque antes do domingo).
export const ORDEM_SEMANA = [1, 2, 3, 4, 5, 6, 0];

export function configVazia() {
  const funcionamento = {};
  const escalaSemanal = {};
  for (let d = 0; d <= 6; d++) {
    funcionamento[d] = d === 0
      ? { ativo: false, abre: '', fecha: '' }
      : d === 6
        ? { ativo: true, abre: '08:00', fecha: '12:00' }
        : { ativo: true, abre: '08:00', fecha: '18:00' };
    escalaSemanal[d] = [];
  }
  return {
    funcionamento,
    equipe: [],
    escalaSemanal,
    alertaCobertura: true,
    alertaCargaHoraria: true,
  };
}

export function novoFuncionarioId() {
  return globalThis.crypto?.randomUUID ? crypto.randomUUID().slice(0, 8) : Math.random().toString(36).slice(2, 10);
}

export function minutos(hhmm) {
  if (!hhmm || typeof hhmm !== 'string' || !hhmm.includes(':')) return null;
  const [h, m] = hhmm.split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return h * 60 + m;
}

export function formatarHoras(mins) {
  const h = Math.floor(Math.abs(mins) / 60);
  const m = Math.abs(mins) % 60;
  return `${mins < 0 ? '-' : ''}${h}h${m ? String(m).padStart(2, '0') : ''}`;
}

export function formatarDataISO(data) {
  const d = new Date(data);
  const ano = d.getFullYear();
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

export function parseISO(iso) {
  const [ano, mes, dia] = iso.split('-').map(Number);
  return new Date(ano, mes - 1, dia);
}

/** Segunda-feira da semana que contém `data`. */
export function inicioDaSemana(data) {
  const d = new Date(data);
  const diaSemana = d.getDay(); // 0=dom..6=sab
  const deslocamento = diaSemana === 0 ? -6 : 1 - diaSemana;
  d.setDate(d.getDate() + deslocamento);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** As 7 datas da semana (seg..dom) que contém `data`. */
export function datasDaSemana(data) {
  const seg = inicioDaSemana(data);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(seg);
    d.setDate(seg.getDate() + i);
    return d;
  });
}

/** Grade do mês: datas do mês + preenchimento dos dias de outros meses pra fechar as semanas (seg..dom). */
export function diasDoMes(ano, mes) {
  const primeiro = new Date(ano, mes, 1);
  const ultimo = new Date(ano, mes + 1, 0);
  const inicio = inicioDaSemana(primeiro);
  const fimGrade = new Date(inicioDaSemana(ultimo));
  fimGrade.setDate(fimGrade.getDate() + 6);
  const dias = [];
  const cursor = new Date(inicio);
  while (cursor <= fimGrade) {
    dias.push({ data: new Date(cursor), noMes: cursor.getMonth() === mes });
    cursor.setDate(cursor.getDate() + 1);
  }
  return dias;
}

function nomeFuncionario(equipe, id) {
  return equipe.find((f) => f.id === id)?.nome || '(removido)';
}

/**
 * Atribuições efetivas de um dia específico: escala semanal padrão (filtrada pelo dia da
 * semana) menos quem foi removido naquela data (falta extraordinária) mais quem foi
 * adicionado só naquela data (ex.: rodízio de sábado).
 */
export function atribuicoesDoDia(config, excecao, diaSemana) {
  const equipe = config.equipe || [];
  const base = (config.escalaSemanal?.[diaSemana] || []).map((a) => ({ ...a, origem: 'template' }));
  const removidos = new Set(excecao?.remover || []);
  const efetivos = base.filter((a) => !removidos.has(a.funcionarioId));
  (excecao?.adicionar || []).forEach((extra, indiceExcecao) => {
    efetivos.push({ ...extra, origem: 'excecao', indiceExcecao });
  });
  return efetivos
    .map((a) => ({ ...a, nome: nomeFuncionario(equipe, a.funcionarioId) }))
    .sort((a, b) => minutos(a.inicio) - minutos(b.inicio));
}

/** Membros da escala padrão do dia que foram marcados como falta (ausência extraordinária). */
export function faltasDoDia(config, excecao, diaSemana) {
  const equipe = config.equipe || [];
  const removidos = excecao?.remover || [];
  const idsNoTemplate = new Set((config.escalaSemanal?.[diaSemana] || []).map((a) => a.funcionarioId));
  return removidos
    .filter((id) => idsNoTemplate.has(id))
    .map((id) => ({ funcionarioId: id, nome: nomeFuncionario(equipe, id) }));
}

/**
 * Lacunas de cobertura: trechos do horário de funcionamento do dia em que ninguém está
 * escalado. Retorna [] se o polo estiver fechado nesse dia ou se tudo estiver coberto.
 */
export function lacunasDeCobertura(funcionamentoDia, atribuicoes) {
  if (!funcionamentoDia?.ativo) return [];
  const abre = minutos(funcionamentoDia.abre);
  const fecha = minutos(funcionamentoDia.fecha);
  if (abre == null || fecha == null || fecha <= abre) return [];

  const intervalos = atribuicoes
    .map((a) => [minutos(a.inicio), minutos(a.fim)])
    .filter(([i, f]) => i != null && f != null && f > i)
    .sort((a, b) => a[0] - b[0]);

  const lacunas = [];
  let cursor = abre;
  for (const [i, f] of intervalos) {
    if (i > cursor) lacunas.push([cursor, Math.min(i, fecha)]);
    cursor = Math.max(cursor, f);
    if (cursor >= fecha) break;
  }
  if (cursor < fecha) lacunas.push([cursor, fecha]);
  return lacunas.filter(([i, f]) => f > i).map(([i, f]) => ({
    inicio: `${String(Math.floor(i / 60)).padStart(2, '0')}:${String(i % 60).padStart(2, '0')}`,
    fim: `${String(Math.floor(f / 60)).padStart(2, '0')}:${String(f % 60).padStart(2, '0')}`,
  }));
}

/** Soma, em minutos, as horas escaladas de cada funcionário nas datas informadas. */
export function horasPorFuncionarioNoPeriodo(config, excecoesPorData, datas) {
  const totais = {};
  for (const data of datas) {
    const iso = formatarDataISO(data);
    const diaSemana = data.getDay();
    const atrib = atribuicoesDoDia(config, excecoesPorData[iso], diaSemana);
    for (const a of atrib) {
      const i = minutos(a.inicio);
      const f = minutos(a.fim);
      if (i == null || f == null || f <= i) continue;
      totais[a.funcionarioId] = (totais[a.funcionarioId] || 0) + (f - i);
    }
  }
  return totais;
}

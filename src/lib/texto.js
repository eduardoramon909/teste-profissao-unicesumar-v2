// Utilitários de texto (busca sem acento, nomes próprios)

export function normalizar(s) {
  return String(s ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

const CONECTIVOS = new Set(['de', 'da', 'do', 'das', 'dos', 'e']);

/** "maria da silva" -> "Maria da Silva" */
export function formatarNome(nome) {
  return String(nome ?? '')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .map((p, i) => {
      const l = p.toLowerCase();
      if (i > 0 && CONECTIVOS.has(l)) return l;
      return l.replace(/(^|[-'’])(\p{L})/gu, (_, a, b) => a + b.toUpperCase());
    })
    .join(' ');
}

export function primeiroNome(nome) {
  return String(nome ?? '').trim().split(/\s+/)[0] || '';
}

/** Junta a lista com vírgulas e "e": ["a","b","c"] -> "a, b e c" */
export function listaComE(itens) {
  const l = itens.filter(Boolean);
  if (l.length <= 1) return l.join('');
  return l.slice(0, -1).join(', ') + ' e ' + l[l.length - 1];
}

// Validações e máscaras — tudo local, sem API externa.

export function apenasDigitos(s) {
  return String(s ?? '').replace(/\D/g, '');
}

// ---------- CPF ----------
export function formatarCPF(s) {
  const d = apenasDigitos(s).slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

/**
 * Valida o CPF pelo algoritmo oficial (dois dígitos verificadores, módulo 11).
 * Não consulta nenhum serviço: confere apenas se o número é matematicamente válido.
 */
export function cpfValido(s) {
  const d = apenasDigitos(s);
  if (d.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(d)) return false; // 111.111.111-11 etc.
  const digito = (base) => {
    let soma = 0;
    for (let i = 0; i < base.length; i++) soma += Number(base[i]) * (base.length + 1 - i);
    const resto = (soma * 10) % 11;
    return resto === 10 ? 0 : resto;
  };
  return digito(d.slice(0, 9)) === Number(d[9]) && digito(d.slice(0, 10)) === Number(d[10]);
}

// ---------- WhatsApp / celular ----------
const DDDS = new Set(
  (
    '11 12 13 14 15 16 17 18 19 21 22 24 27 28 31 32 33 34 35 37 38 41 42 43 44 45 46 47 48 49 51 53 54 55 ' +
    '61 62 63 64 65 66 67 68 69 71 73 74 75 77 79 81 82 83 84 85 86 87 88 89 91 92 93 94 95 96 97 98 99'
  ).split(' '),
);

/** Remove +55 e deixa só DDD + número (até 11 dígitos). */
export function normalizarWhatsapp(s) {
  let d = apenasDigitos(s);
  if (d.length > 11 && d.startsWith('55')) d = d.slice(2);
  return d.slice(0, 11);
}

export function formatarWhatsapp(s) {
  const d = normalizarWhatsapp(s);
  if (d.length === 0) return '';
  if (d.length <= 2) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

export function whatsappValido(s) {
  const d = normalizarWhatsapp(s);
  return d.length === 11 && DDDS.has(d.slice(0, 2)) && d[2] === '9';
}

// ---------- Nome / e-mail ----------
export function nomeValido(s) {
  const n = String(s ?? '').replace(/\s+/g, ' ').trim();
  const partes = n.split(' ');
  return (
    partes.length >= 2 &&
    partes.every((p) => p.length >= 1) &&
    n.replace(/[^\p{L}]/gu, '').length >= 5 &&
    /^[\p{L}][\p{L}'’.\- ]*$/u.test(n)
  );
}

export function emailValido(s) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(s ?? '').trim());
}

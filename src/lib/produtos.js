// Arquivo auxiliar — lista canônica de produtos compartilhada
export const PRODUTOS = [
  { id: 'grad_ead', label: 'Graduação (EAD)                ' },
  { id: 'grad_lic', label: 'Graduação (Licenciatura)       ' },
  { id: 'grad_ef',  label: 'Graduação Bacharel (Ed. Física)' },
  { id: 'pos',      label: 'Pós-Graduação                  ' },
  { id: 'tec',      label: 'Técnico' },
  { id: 'prof',     label: 'Profissionalizante' },
];
export const PROD_LABEL = Object.fromEntries(PRODUTOS.map((p) => [p.id, p.label]));

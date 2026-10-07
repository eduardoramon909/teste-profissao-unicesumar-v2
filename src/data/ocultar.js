// Cursos que NÃO aparecem no seletor nem nas recomendações (sem polo = sem aula presencial obrigatória).
// A aba "Cursos" da planilha exportada continua completa (é cópia do modelo).
export const OCULTAR = {
  // exigem encontros presenciais no polo
  modalidades: ['Semipresencial', 'Híbrida'],

  // cursos EAD da saúde com aulas práticas/estágio presencial. Formato: tipo -> famílias (ver src/data/familias.js)
  familiasPorTipo: {
    graduacao: ['enfermagem', 'farmacia', 'fisioterapia', 'nutricao', 'estetica', 'esporte-saude', 'terapias-integrativas'],
    tecnico: ['enfermagem', 'saude-idoso', 'estetica', 'diagnostico'],
    profissionalizante: ['farmacia'],
    pos: [], // pós EAD costuma ser 100% online; inclua famílias aqui se quiser ocultar também
  },

  // nomes exatos (campo "nome" de cursos.js) para ocultar um a um. Ex.: 'Engenharia Civil', 'Agronomia'
  nomes: [],
};

export function visivel(curso) {
  if (OCULTAR.modalidades.includes(curso.mod)) return false;
  if ((OCULTAR.familiasPorTipo[curso.tipo] || []).includes(curso.familia)) return false;
  if (OCULTAR.nomes.includes(curso.nome)) return false;
  return true;
}

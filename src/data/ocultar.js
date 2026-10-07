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

  // nomes exatos (campo "nome" de cursos.js) para ocultar
  nomes: [
    'Validação de Teologia',
    'Biomedicina',
    'Radiologia',
    'Terapia Ocupacional',
    'Arquitetura e Urbanismo',
    'Automação Industrial',
    'Controle de Obras',
    'Energias Renováveis',
    'Engenharia de Energia',
    'Engenharia Ambiental e Sanitária',
    'Engenharia de Produção',
    'Engenharia de Produção - Híbrido',
    'Engenharia Elétrica',
    'Engenharia Mecânica',
    'Engenharia Mecatrônica',
    'Manutenção Industrial',
    'Sistemas Construtivos Sustentáveis',
    'Sistemas Elétricos',
    'Agronomia',
    'Produção Cervejeira',
    'Produção de Cerveja',
    'Segurança Alimentar',
    'Gestão das Organizações do Terceiro Setor'
  ],

  // nomes exatos (campo "nome" de cursos.js) que serão ocultados APENAS se forem do tipo técnico ou profissionalizante
  nomesApenasTecnicoEProfissionalizante: [
    'Administração',
    'Comércio Exterior',
    'Gastronomia',
    'Logística',
    'Marketing',
    'Recursos Humanos',
    'Transações Imobiliárias',
    'Segurança do Trabalho'
  ],
};

export function visivel(curso) {
  // 1. Oculta pelas modalidades com aula prática obrigatória
  if (OCULTAR.modalidades.includes(curso.mod)) return false;
  
  // 2. Oculta pela família do curso (ex: saúde presencial) de acordo com o tipo
  if ((OCULTAR.familiasPorTipo[curso.tipo] || []).includes(curso.familia)) return false;
  
  // 3. Oculta pelos nomes gerais (onde a restrição vale para qualquer grau de escolaridade)
  if (OCULTAR.nomes.includes(curso.nome)) return false;
  
  // 4. Oculta pelos nomes específicos APENAS se o curso for técnico ou profissionalizante. 
  // Se for Graduação ou Pós, ele ignora esse 'if' e o curso continua no teste.
  if (OCULTAR.nomesApenasTecnicoEProfissionalizante.includes(curso.nome)) {
     if (curso.tipo === 'tecnico' || curso.tipo === 'profissionalizante') {
         return false;
     }
  }
  
  return true;
}
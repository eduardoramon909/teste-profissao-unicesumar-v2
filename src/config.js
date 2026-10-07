// ============================================================
//  CONFIGURAÇÕES DO APP — edite aqui sem mexer no resto do código
// ============================================================
export const CONFIG = {
  // Identificação (aparece no logo, no rodapé e na tela final)
  INSTITUICAO: 'UniCesumar',
  POLO: 'Polo Igarapé-Açu - PA',
  TELEFONE_POLO: '(44) 3309-2890',
  ENDERECO_POLO: 'Av. Magalhães Barata, 2831 - Centro',
  SITE_MATRICULA: 'inscricoes.unicesumar.edu.br',
  URL_MATRICULA: 'https://inscricoes.unicesumar.edu.br',

  // Logo oficial: coloque o arquivo em /public (ex.: public/logo.png) e informe o caminho aqui.
  // Enquanto estiver vazio, o app mostra o nome da instituição em texto.
  LOGO_URL: '',

  // Fuso usado para separar as "ações" por dia (todo lead do mesmo dia cai na mesma ação).
  FUSO: 'America/Sao_Paulo',

  // Teste
  META_SEGUNDOS: 60,        // meta exibida no cronômetro (não bloqueia ninguém)
  QTD_ESPECIFICAS: 5,       // perguntas específicas (11 em diante). Máx. 10 => teste de 20 perguntas
  BONUS_FOLHETO: 0.03,      // pequeno bônus para cursos que aparecem nos folhetos impressos
  RESET_APOS_SEGUNDOS: 30,  // tela final volta sozinha ao início (para o próximo participante)
  INATIVIDADE_SEGUNDOS: 180, // sem mexer no aparelho por esse tempo => volta ao início e apaga o que foi digitado

  // Formulário
  COLETAR_EMAIL: false,     // true => mostra o campo "E-mail (opcional)" no cadastro (a planilha modelo tem coluna EMAIL)
  EXIGIR_CONSENTIMENTO: true,
  TEXTO_CONSENTIMENTO:
    'Autorizo a UniCesumar a usar meus dados para me contatar sobre cursos. Se tenho menos de 18 anos, meu responsável autorizou.',
};

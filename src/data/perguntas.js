// ============================================================
//  BANCO DE PERGUNTAS DO TESTE
//
//  Cada opção soma pontos em até 4 "gavetas":
//    a  -> áreas        (ex.: { saude: 3 })          ver src/data/areas.js
//    t  -> traços       (ex.: { cuidar: 2 })         ver TRACOS em src/data/areas.js
//    f  -> famílias     (ex.: { enfermagem: 3 })     ver src/data/familias.js
//    kw -> palavras (sem acento, minúsculas) que, se aparecerem no NOME do curso, dão um empurrãozinho
//  Pesos sugeridos: 1 (leve), 2 (médio), 3 (forte).
//
//  Estrutura do teste (15 perguntas por padrão):
//    1        escolaridade (menu sanfona)             -> define o tipo de curso (técnico/prof., graduação ou pós)
//    2 a 5    área (4 perguntas)                      -> descobre a área de maior afinidade
//    6 a 10   gostos pessoais (5 perguntas)           -> traços de personalidade
//    11 a 15  específicas (5 perguntas, da(s) área(s) que mais combinam) -> afinam o curso ideal
//  Para graduados, uma das perguntas de área é trocada por "Sua graduação é em qual área?".
// ============================================================

const o = (emoji, texto, w = {}) => ({ emoji, texto, ...w });
const q = (id, titulo, opcoes, extra = {}) => ({ id, titulo, opcoes, ...extra });

export const PERGUNTA_ESCOLARIDADE = {
  id: 'escolaridade',
  tipo: 'escolaridade',
  bloco: 'escolaridade',
  titulo: 'Qual é o seu grau de escolaridade?',
};

// ---------------- Perguntas 2 a 5: ÁREA ----------------
export const PERGUNTAS_AREA = [
  q('area1', 'Onde você se imagina trabalhando?', [
    o('🏥', 'Hospital, clínica ou laboratório', { a: { saude: 3 }, t: { cuidar: 1, cientifico: 1 } }),
    o('🏫', 'Escola, universidade ou ONG', { a: { educacao: 3, direito: 1 }, t: { ensinar: 1, social: 1 } }),
    o('💼', 'Escritório, empresa ou tribunal', { a: { negocios: 2, direito: 2 }, t: { organizar: 1, numeros: 1 } }),
    o('💻', 'Estúdio, agência ou computador', { a: { tecnologia: 2, comunicacao: 2 }, t: { tecnologia: 1, criar: 1 } }),
    o('🌳', 'Campo, obra ou cozinha', { a: { ambiente: 2, engenharia: 2, alimentos: 2 }, t: { pratico: 2 } }),
  ], { bloco: 'area' }),

  q('area2', 'Qual assunto mais chama sua atenção?', [
    o('🧬', 'Corpo humano e bem-estar', { a: { saude: 3, alimentos: 1 }, t: { cuidar: 1, cientifico: 1 } }),
    o('📱', 'Tecnologia e inovação', { a: { tecnologia: 3, engenharia: 1 }, t: { tecnologia: 2 } }),
    o('💰', 'Dinheiro e negócios', { a: { negocios: 3 }, t: { numeros: 2, lideranca: 1 } }),
    o('⚖️', 'Leis, justiça e sociedade', { a: { direito: 3 }, t: { lei: 2, social: 1 } }),
    o('🎬', 'Arte, moda e mídia', { a: { comunicacao: 3 }, t: { criar: 2, comunicar: 1 } }),
  ], { bloco: 'area' }),

  q('area3', 'O que você mais gostaria de fazer?', [
    o('👩‍🍳', 'Criar pratos e experiências com comida', { a: { alimentos: 3, negocios: 1 }, t: { gastro: 3 } }),
    o('📐', 'Projetar e construir soluções', { a: { engenharia: 3, tecnologia: 1 }, t: { pratico: 1, cientifico: 1, criar: 1 } }),
    o('🌎', 'Cuidar da natureza e dos animais', { a: { ambiente: 3, saude: 1 }, t: { natureza: 3 } }),
    o('🎓', 'Ensinar e ajudar os outros a aprender', { a: { educacao: 3 }, t: { ensinar: 3 } }),
    o('⚖️', 'Defender direitos e proteger a sociedade', { a: { direito: 3 }, t: { lei: 2, social: 1 } }),
  ], { bloco: 'area' }),

  q('area4', 'Qual frase é mais a sua cara?', [
    o('❤️', 'Adoro ajudar e cuidar das pessoas', { a: { saude: 2, educacao: 2, direito: 2 }, t: { cuidar: 2, pessoas: 2, social: 1 } }),
    o('📋', 'Gosto de organizar, planejar e liderar', { a: { negocios: 3, engenharia: 1 }, t: { lideranca: 2, organizar: 2 } }),
    o('💡', 'Gosto de criar, inventar e testar ideias', { a: { tecnologia: 2, comunicacao: 2, engenharia: 1 }, t: { criar: 2, cientifico: 1 } }),
    o('🌤️', 'Prefiro o trabalho prático e ao ar livre', { a: { ambiente: 2, engenharia: 2, alimentos: 2 }, t: { pratico: 3, natureza: 1 } }),
  ], { bloco: 'area' }),
];

// Só para graduados (professores etc.): entra no lugar da pergunta "area4".
export const PERGUNTA_FORMACAO = q('formacao', 'Sua graduação é em qual área?', [
  o('📚', 'Educação ou licenciaturas', { a: { educacao: 5 }, formacao: 'educacao' }),
  o('🩺', 'Saúde', { a: { saude: 5 }, formacao: 'saude' }),
  o('💻', 'Tecnologia', { a: { tecnologia: 5 }, formacao: 'tecnologia' }),
  o('📊', 'Gestão e negócios', { a: { negocios: 5 }, formacao: 'negocios' }),
  o('⚖️', 'Direito ou humanas', { a: { direito: 5 }, formacao: 'direito' }),
  o('🎨', 'Comunicação, artes ou design', { a: { comunicacao: 5 }, formacao: 'comunicacao' }),
  o('🏗️', 'Engenharias ou exatas', { a: { engenharia: 5 }, formacao: 'engenharia' }),
  o('🌱', 'Outra área', {}),
], { bloco: 'area' });

// ---------------- Perguntas 6 a 10: GOSTOS PESSOAIS ----------------
export const PERGUNTAS_GOSTOS = [
  q('gosto1', 'No tempo livre, você prefere…', [
    o('🎮', 'Jogos, vídeos e tecnologia', { t: { tecnologia: 2, criar: 1 } }),
    o('🎨', 'Desenhar, filmar ou criar', { t: { criar: 3, comunicar: 1 } }),
    o('🏃', 'Esporte e atividade física', { t: { esporte: 3, pessoas: 1 } }),
    o('📚', 'Ler, estudar e aprender', { t: { cientifico: 2, ensinar: 1 } }),
    o('🤝', 'Sair com amigos e ajudar alguém', { t: { pessoas: 3, social: 1 } }),
  ], { bloco: 'gosto' }),

  q('gosto2', 'Em trabalho de grupo, você…', [
    o('🧭', 'Lidera e divide as tarefas', { t: { lideranca: 3 } }),
    o('🗂️', 'Organiza prazos e detalhes', { t: { organizar: 3, numeros: 1 } }),
    o('💡', 'Dá as ideias criativas', { t: { criar: 2, comunicar: 1 } }),
    o('🔧', 'Resolve a parte técnica', { t: { cientifico: 2, pratico: 2 } }),
  ], { bloco: 'gosto' }),

  q('gosto3', 'Você resolve problemas com…', [
    o('🔢', 'Números e lógica', { t: { numeros: 3, tecnologia: 1, cientifico: 1 } }),
    o('💬', 'Conversa e empatia', { t: { pessoas: 3, cuidar: 1, comunicar: 1 } }),
    o('✨', 'Criatividade', { t: { criar: 3 } }),
    o('🛠️', 'Mão na massa', { t: { pratico: 3 } }),
  ], { bloco: 'gosto' }),

  q('gosto4', 'Qual rotina combina com você?', [
    o('🗣️', 'Agitada, com muita gente', { t: { pessoas: 2, comunicar: 2 } }),
    o('📋', 'Organizada e previsível', { t: { organizar: 3, numeros: 1, lei: 1 } }),
    o('🌤️', 'Ao ar livre, em movimento', { t: { natureza: 2, pratico: 2, esporte: 1 } }),
    o('🧑‍💻', 'Focada, no computador ou laboratório', { t: { tecnologia: 2, cientifico: 2 } }),
  ], { bloco: 'gosto' }),

  q('gosto5', 'O que mais te motiva?', [
    o('❤️', 'Ajudar e transformar vidas', { t: { cuidar: 2, ensinar: 1, social: 2 } }),
    o('🚀', 'Crescer, liderar e ganhar bem', { t: { lideranca: 3, numeros: 1 } }),
    o('🔍', 'Descobrir e inovar', { t: { cientifico: 2, tecnologia: 1, criar: 1 } }),
    o('🛡️', 'Ter estabilidade e segurança', { t: { organizar: 1, lei: 2 } }),
  ], { bloco: 'gosto' }),
];

// ---------------- Perguntas 11 em diante: ESPECÍFICAS (por área) ----------------
// O teste escolhe o banco da área que mais combinou (e, se houver empate técnico, mistura as duas melhores).
const esp = (area, n, titulo, opcoes) => q(`esp-${area}-${n}`, titulo, opcoes, { bloco: 'especifica', area });

export const PERGUNTAS_ESPECIFICAS = {
  educacao: [
    esp('educacao', 1, 'Que tipo de aluno você quer ajudar?', [
      o('👶', 'Crianças pequenas', { t: { ensinar: 2, cuidar: 1 }, f: { pedagogia: 3, psicopedagogia: 1 } }),
      o('🧑‍🎓', 'Adolescentes e jovens', { t: { ensinar: 2, pessoas: 1 }, f: { docencia: 2, 'ensino-humanas': 1, 'ensino-exatas': 1 } }),
      o('🧩', 'Alunos com necessidades especiais', { t: { cuidar: 2, social: 1 }, f: { inclusao: 3, psicopedagogia: 2 } }),
      o('👩‍💼', 'Adultos e profissionais', { t: { ensinar: 1, comunicar: 1 }, f: { docencia: 2, 'edu-tec': 1, rh: 1 } }),
    ]),
    esp('educacao', 2, 'Qual matéria te empolga mais?', [
      o('➗', 'Matemática e Ciências', { t: { cientifico: 2, numeros: 1 }, f: { 'ensino-exatas': 3, 'ensino-biologia': 2 } }),
      o('📖', 'Português e idiomas', { t: { comunicar: 2 }, f: { 'ensino-letras': 3 } }),
      o('🌍', 'História, Geografia e sociedade', { t: { social: 2 }, f: { 'ensino-humanas': 3 } }),
      o('🎭', 'Artes e música', { t: { criar: 2 }, f: { 'ensino-artes': 3 } }),
      o('⚽', 'Educação Física', { t: { esporte: 2 }, f: { 'ensino-fisica': 3, 'esporte-saude': 1 } }),
    ]),
    esp('educacao', 3, 'Onde você quer atuar?', [
      o('🏫', 'Direto na sala de aula', { f: { docencia: 2, pedagogia: 1, 'ensino-humanas': 1, 'ensino-exatas': 1 } }),
      o('🗂️', 'Na coordenação e direção', { t: { lideranca: 2, organizar: 1 }, f: { 'gestao-escolar': 3 } }),
      o('💻', 'Na educação online e tecnologia', { t: { tecnologia: 2 }, f: { 'edu-tec': 3 } }),
      o('🧠', 'No acompanhamento de cada aluno', { t: { cuidar: 1, pessoas: 1 }, f: { psicopedagogia: 3, inclusao: 1 } }),
    ]),
    esp('educacao', 4, 'O que mais importa no seu trabalho?', [
      o('🌈', 'Incluir todo mundo', { t: { social: 2, cuidar: 1 }, f: { inclusao: 3 } }),
      o('🎲', 'Aulas criativas e divertidas', { t: { criar: 2 }, f: { 'edu-tec': 1, 'ensino-artes': 1, pedagogia: 1 } }),
      o('📈', 'Organização e resultados', { t: { organizar: 2 }, f: { 'gestao-escolar': 2 } }),
      o('🙏', 'Valores e propósito', { t: { social: 2 }, f: { teologia: 3 } }),
    ]),
    esp('educacao', 5, 'Você se vê…', [
      o('🎓', 'Como professor(a)', { t: { ensinar: 2 }, f: { docencia: 2, pedagogia: 1 } }),
      o('🧭', 'Como gestor(a) escolar', { t: { lideranca: 2 }, f: { 'gestao-escolar': 3 } }),
      o('🔬', 'Pesquisando como as pessoas aprendem', { t: { cientifico: 2 }, f: { psicopedagogia: 2, 'edu-tec': 1 } }),
      o('🕊️', 'Em projetos sociais e na comunidade', { t: { social: 2 }, f: { teologia: 1, inclusao: 1, 'servico-social': 2 } }),
    ]),
  ],

  saude: [
    esp('saude', 1, 'Qual tarefa você faria com mais vontade?', [
      o('🩺', 'Cuidar de pacientes', { t: { cuidar: 2, pessoas: 1 }, f: { enfermagem: 3, 'saude-idoso': 1 } }),
      o('🏃', 'Ajudar alguém a se recuperar', { t: { pratico: 1, cuidar: 1 }, f: { fisioterapia: 3, reabilitacao: 2 } }),
      o('🥗', 'Orientar alimentação e hábitos', { t: { cientifico: 1 }, f: { nutricao: 3, 'esporte-saude': 1 } }),
      o('🔬', 'Analisar exames e diagnósticos', { t: { cientifico: 2 }, f: { diagnostico: 3, farmacia: 1 } }),
    ]),
    esp('saude', 2, 'Com quem você prefere trabalhar?', [
      o('👶', 'Crianças e bebês', { t: { cuidar: 1 }, f: { enfermagem: 1, fono: 1, 'saude-mental': 1 }, kw: ['neonat', 'pediatr', 'infan', 'materno'] }),
      o('🧓', 'Idosos', { t: { cuidar: 1 }, f: { 'saude-idoso': 3, fisioterapia: 1 }, kw: ['idos', 'geronto', 'geriat', 'paliativ'] }),
      o('🧠', 'Pessoas que precisam de apoio emocional', { t: { pessoas: 2 }, f: { 'saude-mental': 3 }, kw: ['psic', 'mental'] }),
      o('🏋️', 'Atletas e pessoas ativas', { t: { esporte: 2 }, f: { 'esporte-saude': 3, fisioterapia: 1, nutricao: 1 } }),
    ]),
    esp('saude', 3, 'Qual ambiente combina mais com você?', [
      o('🏥', 'Hospital e UTI', { t: { cuidar: 1 }, f: { enfermagem: 2 }, kw: ['intensiv', 'urgencia', 'hospital'] }),
      o('🧪', 'Laboratório ou farmácia', { f: { diagnostico: 2, farmacia: 3 } }),
      o('💆', 'Clínica de estética e bem-estar', { f: { estetica: 3, 'terapias-integrativas': 1 } }),
      o('🏢', 'Gestão e organização da saúde', { t: { organizar: 2 }, f: { 'gestao-saude': 3, 'saude-digital': 1, 'saude-coletiva': 1 } }),
    ]),
    esp('saude', 4, 'O que mais te atrai na saúde?', [
      o('🤖', 'Tecnologia na saúde', { t: { tecnologia: 2 }, f: { 'saude-digital': 3 } }),
      o('🌿', 'Terapias naturais e cuidado integral', { f: { 'terapias-integrativas': 3, 'bem-estar': 1 } }),
      o('🗣️', 'Fala, audição e comunicação', { f: { fono: 3 } }),
      o('🌍', 'Saúde de toda a população', { t: { social: 1 }, f: { 'saude-coletiva': 3, 'gestao-saude': 1 } }),
    ]),
    esp('saude', 5, 'Você se vê…', [
      o('👐', 'Cuidando direto, mão na massa', { t: { pratico: 2, cuidar: 1 }, f: { enfermagem: 1, fisioterapia: 1, estetica: 1, reabilitacao: 1 } }),
      o('📊', 'Coordenando equipes e processos', { t: { lideranca: 2, organizar: 1 }, f: { 'gestao-saude': 3 } }),
      o('📖', 'Pesquisando e investigando', { t: { cientifico: 2 }, f: { diagnostico: 2, farmacia: 1 } }),
      o('🍎', 'Educando sobre hábitos saudáveis', { t: { ensinar: 2 }, f: { nutricao: 1, 'esporte-saude': 1, 'saude-coletiva': 1, 'bem-estar': 1 } }),
    ]),
  ],

  tecnologia: [
    esp('tecnologia', 1, 'O que você quer fazer com tecnologia?', [
      o('📱', 'Criar apps e sites', { t: { tecnologia: 2, criar: 1 }, f: { dev: 3, ux: 1 } }),
      o('📊', 'Analisar dados e usar IA', { t: { cientifico: 2, numeros: 1 }, f: { dados: 3 } }),
      o('🔒', 'Proteger redes e sistemas', { t: { lei: 1 }, f: { infra: 3 } }),
      o('🎮', 'Criar jogos', { t: { criar: 2 }, f: { games: 3 } }),
    ]),
    esp('tecnologia', 2, 'Qual parte do projeto é sua?', [
      o('🧑‍💻', 'Programar', { f: { dev: 3 } }),
      o('🎨', 'Desenhar telas e experiência', { t: { criar: 2 }, f: { ux: 3, games: 1 } }),
      o('🧪', 'Testar e garantir qualidade', { t: { organizar: 1, cientifico: 1 }, f: { 'qualidade-sw': 3 } }),
      o('🗓️', 'Coordenar equipe e prazos', { t: { lideranca: 2 }, f: { 'gestao-ti': 3, projetos: 1 } }),
    ]),
    esp('tecnologia', 3, 'Você curte mais…', [
      o('🧩', 'Lógica e desafios', { t: { cientifico: 2 }, f: { dev: 2, dados: 2 } }),
      o('🖼️', 'Visual e criação', { t: { criar: 2 }, f: { ux: 2, games: 2, 'design-visual': 1 } }),
      o('🔌', 'Redes e equipamentos', { t: { pratico: 2 }, f: { infra: 3 } }),
      o('📚', 'Organizar informação', { t: { organizar: 2 }, f: { biblioteca: 3, dados: 1, informatica: 1 } }),
    ]),
    esp('tecnologia', 4, 'Qual tema te empolga mais?', [
      o('🤖', 'Inteligência artificial', { f: { dados: 3 } }),
      o('🕹️', 'Games e mundos virtuais', { f: { games: 3 } }),
      o('☁️', 'Infraestrutura e segurança', { f: { infra: 3 } }),
      o('💼', 'Tecnologia para empresas', { f: { 'gestao-ti': 2, dev: 1, informatica: 1 } }),
    ]),
    esp('tecnologia', 5, 'Você prefere…', [
      o('📈', 'Descobrir padrões nos dados', { t: { numeros: 2 }, f: { dados: 3 } }),
      o('🕵️', 'Caçar falhas de segurança', { t: { lei: 1 }, f: { infra: 3 } }),
      o('🧱', 'Construir sistemas do zero', { f: { dev: 3 } }),
      o('💬', 'Ajudar pessoas a usar tecnologia', { t: { ensinar: 1, pessoas: 2 }, f: { informatica: 3, 'gestao-ti': 1 } }),
    ]),
  ],

  negocios: [
    esp('negocios', 1, 'Qual área de uma empresa te atrai?', [
      o('💵', 'Finanças e contabilidade', { t: { numeros: 2 }, f: { contabil: 2, financas: 2, economia: 1 } }),
      o('📣', 'Marketing e vendas', { t: { comunicar: 2 }, f: { marketing: 2, vendas: 2, midias: 1 } }),
      o('👥', 'Pessoas e cultura (RH)', { t: { pessoas: 2 }, f: { rh: 3 } }),
      o('📦', 'Logística e operações', { t: { organizar: 2 }, f: { logistica: 3, producao: 1 } }),
    ]),
    esp('negocios', 2, 'Você se imagina…', [
      o('🧮', 'Cuidando do dinheiro', { t: { numeros: 2 }, f: { financas: 3, contabil: 1, economia: 1 } }),
      o('🛍️', 'Vendendo e atendendo clientes', { t: { comunicar: 1, pessoas: 1 }, f: { vendas: 3, marketing: 1 } }),
      o('🏪', 'Abrindo o próprio negócio', { t: { lideranca: 2 }, f: { empreender: 3, estrategia: 1 } }),
      o('🏛️', 'No serviço público', { t: { organizar: 1, social: 1 }, f: { 'gestao-publica': 3, politica: 1 } }),
    ]),
    esp('negocios', 3, 'Qual tarefa você faria com prazer?', [
      o('📑', 'Controlar contas e documentos', { t: { organizar: 2 }, f: { contabil: 3, secretariado: 1, adm: 1 } }),
      o('📱', 'Criar campanhas nas redes', { t: { criar: 2 }, f: { marketing: 2, midias: 3 } }),
      o('🤝', 'Contratar e treinar equipes', { t: { pessoas: 2 }, f: { rh: 3 } }),
      o('🚚', 'Organizar entregas e estoque', { t: { pratico: 1 }, f: { logistica: 3 } }),
    ]),
    esp('negocios', 4, 'Que setor te interessa mais?', [
      o('🏠', 'Imóveis', { f: { imobiliario: 3 } }),
      o('✈️', 'Turismo e eventos', { f: { 'eventos-turismo': 3 } }),
      o('🌽', 'Agronegócio e cooperativas', { t: { natureza: 1 }, f: { 'agro-gestao': 3 } }),
      o('🌐', 'Mercado financeiro e comércio exterior', { f: { financas: 2, 'comercio-ext': 2, economia: 1 } }),
    ]),
    esp('negocios', 5, 'Qual é o seu estilo de trabalho?', [
      o('🎯', 'Estratégico, de olho no resultado', { t: { lideranca: 2 }, f: { estrategia: 3, empreender: 1 } }),
      o('🗓️', 'Organizado, com processos claros', { t: { organizar: 2 }, f: { adm: 3, qualidade: 1, secretariado: 1, projetos: 1 } }),
      o('🔎', 'Detalhista e analítico', { t: { cientifico: 1, numeros: 1 }, f: { contabil: 1, financas: 1, qualidade: 2 } }),
      o('🗣️', 'Comunicativo e persuasivo', { t: { comunicar: 2 }, f: { vendas: 2, marketing: 1, rh: 1 } }),
    ]),
  ],

  direito: [
    esp('direito', 1, 'O que mais te interessa?', [
      o('⚖️', 'Advogar e resolver conflitos', { t: { lei: 2 }, f: { direito: 3 } }),
      o('🕵️', 'Investigar e proteger a sociedade', { t: { lei: 1, cientifico: 1 }, f: { seguranca: 3 } }),
      o('🤲', 'Apoiar quem mais precisa', { t: { social: 2 }, f: { 'servico-social': 3 } }),
      o('🏛️', 'Política e políticas públicas', { t: { comunicar: 1 }, f: { politica: 3, 'gestao-publica': 1 } }),
    ]),
    esp('direito', 2, 'Qual atividade você faria?', [
      o('📜', 'Analisar leis e contratos', { f: { direito: 3 }, kw: ['direito civil', 'trabalhista'] }),
      o('🔬', 'Perícia e investigação de crimes', { f: { seguranca: 3 }, kw: ['forense', 'pericia', 'criminolog'] }),
      o('🫶', 'Atender pessoas em situação difícil', { f: { 'servico-social': 3 } }),
      o('📋', 'Cartórios e serviços judiciais', { f: { direito: 2 }, kw: ['notari', 'notori', 'judiciais'] }),
    ]),
    esp('direito', 3, 'Onde você prefere atuar?', [
      o('👔', 'Em empresa ou escritório', { f: { direito: 2, governanca: 2 } }),
      o('🚓', 'Na segurança pública', { f: { seguranca: 3 } }),
      o('🏘️', 'Junto à comunidade', { f: { 'servico-social': 2, politica: 1 } }),
      o('🕊️', 'Em causas de fé e valores', { f: { teologia: 3 } }),
    ]),
    esp('direito', 4, 'Qual tema te empolga?', [
      o('🔒', 'Crimes e segurança', { f: { seguranca: 3 }, kw: ['penal', 'criminolog'] }),
      o('👷', 'Trabalho e empresas', { f: { direito: 2, governanca: 1 }, kw: ['trabalhista', 'compliance'] }),
      o('🩺', 'Saúde e ética', { f: { direito: 1, 'saude-coletiva': 1 }, kw: ['medico'] }),
      o('🌍', 'Direitos humanos e cidadania', { f: { 'servico-social': 2, politica: 2 }, kw: ['direitos humanos', 'cidadania'] }),
    ]),
    esp('direito', 5, 'Como você resolve problemas?', [
      o('🧠', 'Argumentando com lógica', { t: { lei: 1, comunicar: 1 }, f: { direito: 2 } }),
      o('🧩', 'Investigando pistas', { t: { cientifico: 1 }, f: { seguranca: 2 } }),
      o('🫶', 'Ouvindo e acolhendo', { t: { pessoas: 2 }, f: { 'servico-social': 2 } }),
      o('🧑‍💼', 'Planejando e decidindo', { t: { lideranca: 1 }, f: { governanca: 2, politica: 1, 'gestao-publica': 1 } }),
    ]),
  ],

  comunicacao: [
    esp('comunicacao', 1, 'Que tipo de criação você prefere?', [
      o('🎬', 'Vídeos, cinema e fotos', { f: { audiovisual: 3 } }),
      o('✏️', 'Design e ilustração', { f: { 'design-visual': 3 } }),
      o('👗', 'Moda e ambientes', { f: { 'design-moda': 2, 'design-interiores': 2, arquitetura: 1 } }),
      o('📰', 'Textos e notícias', { f: { jornalismo: 3 } }),
    ]),
    esp('comunicacao', 2, 'Você quer trabalhar com…', [
      o('📣', 'Campanhas e propaganda', { f: { publicidade: 3, marketing: 1 } }),
      o('🎙️', 'Imprensa e reportagem', { f: { jornalismo: 3 } }),
      o('🤝', 'Imagem e relacionamento de marcas', { f: { 'rel-publicas': 3 } }),
      o('💡', 'Ideias e inovação', { f: { criatividade: 3 } }),
    ]),
    esp('comunicacao', 3, 'Qual ferramenta você gostaria de usar?', [
      o('📷', 'Câmera e edição', { f: { audiovisual: 3 } }),
      o('🖥️', 'Programas de design', { f: { 'design-visual': 3, ux: 1, midias: 1 } }),
      o('🧵', 'Tecidos, cores e ambientes', { f: { 'design-moda': 2, 'design-interiores': 2 } }),
      o('📝', 'Caneta e teclado', { f: { jornalismo: 2, publicidade: 1, 'rel-publicas': 1 } }),
    ]),
    esp('comunicacao', 4, 'Você prefere…', [
      o('🎤', 'Aparecer e se expressar', { t: { comunicar: 2 }, f: { audiovisual: 1, 'rel-publicas': 1, musica: 1 } }),
      o('🖌️', 'Criar nos bastidores', { t: { criar: 2 }, f: { 'design-visual': 2, 'design-interiores': 1 } }),
      o('🧠', 'Pensar estratégias criativas', { f: { publicidade: 2, criatividade: 2 } }),
      o('🎵', 'Música e artes', { f: { musica: 3, 'ensino-artes': 1 }, kw: ['music', 'danca', 'teatro'] }),
    ]),
    esp('comunicacao', 5, 'Onde você quer chegar?', [
      o('🏆', 'Agência de publicidade', { f: { publicidade: 3, midias: 1 } }),
      o('📺', 'Emissora ou produtora', { f: { audiovisual: 2, jornalismo: 2 } }),
      o('🛍️', 'Marca de moda ou de produtos', { f: { 'design-moda': 3, 'design-visual': 1 }, kw: ['moda', 'produto'] }),
      o('🏠', 'Estúdio de arquitetura e interiores', { f: { 'design-interiores': 2, arquitetura: 3 } }),
    ]),
  ],

  engenharia: [
    esp('engenharia', 1, 'Qual desafio você prefere?', [
      o('🏠', 'Automatizar casas e prédios', { f: { 'eletrica-automacao': 3 }, kw: ['automacao', 'predial'] }),
      o('🏭', 'Melhorar a produção de uma fábrica', { f: { producao: 3, mecanica: 1 } }),
      o('🦺', 'Garantir segurança no trabalho', { f: { 'seg-trabalho': 3 } }),
      o('🏗️', 'Planejar e construir obras', { f: { 'eng-civil': 3, arquitetura: 2 } }),
    ]),
    esp('engenharia', 2, 'Você prefere trabalhar…', [
      o('🔧', 'Na obra ou no campo', { t: { pratico: 2 }, f: { 'eng-civil': 2, 'seg-trabalho': 1, mecanica: 1 } }),
      o('🖥️', 'Com sistemas e sensores', { t: { tecnologia: 2 }, f: { 'eletrica-automacao': 3, energia: 1 } }),
      o('📊', 'Com planejamento e indicadores', { t: { numeros: 1, organizar: 1 }, f: { producao: 3 } }),
      o('⚙️', 'Com máquinas e manutenção', { t: { pratico: 2 }, f: { mecanica: 3 } }),
    ]),
    esp('engenharia', 3, 'O que mais te atrai?', [
      o('⚡', 'Energia e eletricidade', { f: { energia: 2, 'eletrica-automacao': 2 }, kw: ['energia', 'eletric'] }),
      o('⚙️', 'Máquinas e processos', { f: { mecanica: 2, producao: 2 } }),
      o('📜', 'Normas e prevenção de acidentes', { t: { lei: 1 }, f: { 'seg-trabalho': 3 } }),
      o('🌿', 'Soluções sustentáveis', { f: { energia: 2, 'eng-civil': 1 }, kw: ['sustent', 'renov'] }),
    ]),
    esp('engenharia', 4, 'Você se vê…', [
      o('🧑‍🔧', 'Resolvendo problemas técnicos', { t: { cientifico: 2 }, f: { 'eletrica-automacao': 1, mecanica: 1, 'eng-civil': 1 } }),
      o('🧑‍💼', 'Coordenando a operação', { t: { lideranca: 1, organizar: 1 }, f: { producao: 2, 'seg-trabalho': 1 } }),
      o('🛡️', 'Fiscalizando e orientando', { t: { lei: 1 }, f: { 'seg-trabalho': 2 } }),
      o('📐', 'Projetando e desenhando', { t: { criar: 2 }, f: { arquitetura: 2, 'eng-civil': 1 } }),
    ]),
  ],

  ambiente: [
    esp('ambiente', 1, 'Qual parte da natureza te atrai?', [
      o('🌾', 'Plantações e agronegócio', { f: { agro: 3, 'agro-gestao': 1 } }),
      o('🌳', 'Florestas, rios e sustentabilidade', { f: { ambiental: 3 } }),
      o('🐶', 'Animais', { f: { 'saude-animal': 3 } }),
      o('♻️', 'Energia limpa e reciclagem', { f: { ambiental: 2, energia: 2, esg: 1 } }),
    ]),
    esp('ambiente', 2, 'Como você quer atuar?', [
      o('🚜', 'No campo, com produção', { t: { pratico: 2 }, f: { agro: 3 } }),
      o('🧪', 'Em pesquisa e laboratório', { t: { cientifico: 2 }, f: { ambiental: 2, 'tec-alimentos': 1 }, kw: ['biotecnologia'] }),
      o('🏢', 'Na gestão e fiscalização', { t: { organizar: 2 }, f: { ambiental: 2, 'agro-gestao': 1, esg: 1 }, kw: ['gestao ambiental', 'pericia'] }),
      o('🏫', 'Na educação e conscientização', { t: { ensinar: 2 }, f: { ambiental: 1, 'ensino-biologia': 2 }, kw: ['educacao ambiental'] }),
    ]),
    esp('ambiente', 3, 'O que é mais importante para você?', [
      o('🌎', 'Preservar o planeta', { f: { ambiental: 3 } }),
      o('💚', 'O bem-estar dos animais', { f: { 'saude-animal': 3 } }),
      o('📈', 'Produzir mais e melhor', { f: { agro: 3, 'agro-gestao': 1 } }),
      o('🤝', 'Ajudar as comunidades', { t: { social: 2 }, f: { ambiental: 1, 'terceiro-setor': 2, 'servico-social': 1 } }),
    ]),
    esp('ambiente', 4, 'Você prefere lidar com…', [
      o('🐄', 'Animais e pecuária', { f: { 'saude-animal': 2, agro: 2 } }),
      o('🌱', 'Plantas e solo', { f: { agro: 3 } }),
      o('💧', 'Água, ar e resíduos', { f: { ambiental: 3 } }),
      o('📊', 'Negócios do campo', { f: { 'agro-gestao': 3 } }),
    ]),
  ],

  alimentos: [
    esp('alimentos', 1, 'Na cozinha, você prefere…', [
      o('👩‍🍳', 'Criar pratos', { f: { gastronomia: 3 } }),
      o('🎂', 'Confeitaria e doces', { f: { gastronomia: 3 }, kw: ['confeitaria'] }),
      o('🧪', 'Entender como o alimento é feito', { t: { cientifico: 2 }, f: { 'tec-alimentos': 3 } }),
      o('💼', 'Gerenciar restaurante ou negócio', { t: { lideranca: 2 }, f: { 'gastro-negocios': 3 } }),
    ]),
    esp('alimentos', 2, 'O que mais te atrai?', [
      o('🌟', 'Tendências e novos sabores', { f: { gastronomia: 2 }, kw: ['tendencias', 'funcional'] }),
      o('🏭', 'Qualidade e indústria de alimentos', { f: { 'tec-alimentos': 3 } }),
      o('🥗', 'Alimentação saudável', { f: { nutricao: 3, gastronomia: 1 } }),
      o('🚀', 'Empreender com comida', { f: { 'gastro-negocios': 3, empreender: 1 } }),
    ]),
    esp('alimentos', 3, 'Onde você quer trabalhar?', [
      o('🍽️', 'Restaurante ou buffet', { f: { gastronomia: 3 } }),
      o('🏭', 'Fábrica de alimentos', { f: { 'tec-alimentos': 3 } }),
      o('🔎', 'Inspeção e vigilância', { f: { 'tec-alimentos': 2, 'saude-coletiva': 1 }, kw: ['inspecao', 'higiene', 'seguranca alimentar'] }),
      o('🏪', 'No meu próprio negócio', { f: { 'gastro-negocios': 2, empreender: 2 } }),
    ]),
    esp('alimentos', 4, 'Você é mais…', [
      o('🎨', 'Criativo(a) e artista', { t: { criar: 2 }, f: { gastronomia: 2 } }),
      o('🔬', 'Cientista dos alimentos', { t: { cientifico: 2 }, f: { 'tec-alimentos': 2 } }),
      o('📊', 'Gestor(a) nato(a)', { t: { lideranca: 2 }, f: { 'gastro-negocios': 2 } }),
      o('🩺', 'Focado(a) em saúde e nutrição', { t: { cuidar: 1 }, f: { nutricao: 3 } }),
    ]),
  ],
};

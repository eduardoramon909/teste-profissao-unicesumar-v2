// Grau de escolaridade (pergunta 1) e a "trilha" de cursos que cada um recebe no resultado.

export const ESCOLARIDADES = [
  {
    id: 'fund', titulo: 'Ensino Fundamental', emoji: '📘',
    itens: [
      { id: 'fund7', rotulo: '7º ano' },
      { id: 'fund8', rotulo: '8º ano' },
      { id: 'fund9', rotulo: '9º ano' },
    ],
  },
  {
    id: 'med', titulo: 'Ensino Médio', emoji: '🎒',
    itens: [
      { id: 'med1', rotulo: '1º ano' },
      { id: 'med2', rotulo: '2º ano' },
      { id: 'med3', rotulo: '3º ano' },
      { id: 'medc', rotulo: 'Já concluí o Ensino Médio' },
    ],
  },
  {
    id: 'grad', titulo: 'Já sou graduado(a)', emoji: '🎓',
    itens: [{ id: 'grad', rotulo: 'Graduado(a)' }],
  },
];

// Tipos de curso oferecidos em cada caso (a ordem define a preferência quando o mesmo curso existe em dois tipos).
// Para mudar a regra, edite aqui. Tipos: 'graduacao' | 'pos' | 'tecnico' | 'profissionalizante'
export const TRILHAS = {
  fund7: ['profissionalizante', 'tecnico'],
  fund8: ['profissionalizante', 'tecnico'],
  fund9: ['profissionalizante', 'tecnico'],
  med1: ['tecnico', 'profissionalizante'],
  med2: ['tecnico', 'profissionalizante'],
  med3: ['graduacao'],
  medc: ['graduacao'],
  grad: ['pos'],
};

export function tiposDaEscolaridade(id) {
  return TRILHAS[id] || TRILHAS.med3;
}

export function rotuloEscolaridade(id) {
  for (const g of ESCOLARIDADES) {
    const it = g.itens.find((i) => i.id === id);
    if (it) return g.id === 'grad' ? 'Graduado(a)' : `${g.titulo} - ${it.rotulo}`;
  }
  return '';
}

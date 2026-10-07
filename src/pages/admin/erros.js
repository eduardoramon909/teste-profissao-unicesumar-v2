export function msgErro(e) {
  const c = String(e?.code || '');
  if (c.includes('permission-denied')) {
    return 'Sem permissão para acessar os dados. Confira se o seu e-mail está na lista de administradores em firestore.rules e se as regras foram publicadas.';
  }
  if (c.includes('unavailable') || c.includes('network')) return 'Sem conexão com o servidor. Verifique a internet.';
  return e?.message || 'Erro inesperado.';
}

export function msgLogin(e) {
  const c = String(e?.code || '');
  if (c.includes('invalid-credential') || c.includes('wrong-password') || c.includes('user-not-found') || c.includes('invalid-email')) {
    return 'E-mail ou senha incorretos.';
  }
  if (c.includes('too-many-requests')) return 'Muitas tentativas. Aguarde alguns minutos e tente de novo.';
  if (c.includes('network')) return 'Sem conexão com a internet.';
  return e?.message || 'Não foi possível entrar.';
}

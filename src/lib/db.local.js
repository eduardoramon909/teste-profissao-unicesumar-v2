// MODO DEMONSTRAÇÃO: guarda tudo no localStorage deste navegador. Serve para testar o fluxo sem Firebase.
// (Não use em produção: os dados não saem do aparelho.)
const K_LEADS = 'tp.demo.leads';
const K_ACOES = 'tp.demo.acoes';
const K_AUTH = 'tp.demo.auth';
export const SENHA_DEMO = 'demo';

const ouvintes = new Set();
const avisar = () => ouvintes.forEach((f) => f());

function ler(k, padrao) {
  try {
    return JSON.parse(localStorage.getItem(k)) ?? padrao;
  } catch {
    return padrao;
  }
}
function gravar(k, v) {
  try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* ignora */ }
  avisar();
}
function assinar(fn) {
  ouvintes.add(fn);
  const onStorage = (e) => { if (!e.key || e.key.startsWith('tp.demo')) fn(); };
  window.addEventListener('storage', onStorage);
  return () => {
    ouvintes.delete(fn);
    window.removeEventListener('storage', onStorage);
  };
}
const aguardar = (v) => Promise.resolve(v);

const repo = {
  modo: 'demo',

  novoId: () =>
    (globalThis.crypto?.randomUUID ? crypto.randomUUID().replace(/-/g, '').slice(0, 20) : Math.random().toString(36).slice(2) + Date.now().toString(36)),

  garantirAcao(acaoId) {
    const a = ler(K_ACOES, {});
    if (!a[acaoId]) {
      a[acaoId] = { data: acaoId, nome: '' };
      gravar(K_ACOES, a);
    }
  },

  criarLead(id, dados) {
    const l = ler(K_LEADS, {});
    const agora = Date.now();
    l[id] = { ...dados, id, criadoEm: agora, atualizadoEm: agora };
    gravar(K_LEADS, l);
    return aguardar();
  },

  atualizarLead(id, patch) {
    const l = ler(K_LEADS, {});
    if (l[id]) {
      l[id] = { ...l[id], ...patch, atualizadoEm: Date.now() };
      gravar(K_LEADS, l);
    }
    return aguardar();
  },

  sincronizado: () => aguardar(true),

  // ---------- admin ----------
  observarAuth(cb) {
    const f = () => {
      const email = sessionStorage.getItem(K_AUTH);
      cb(email ? { email } : null);
    };
    f();
    return assinar(f);
  },

  async entrar(email, senha) {
    if (senha !== SENHA_DEMO) {
      const e = new Error('Senha incorreta');
      e.code = 'auth/invalid-credential';
      throw e;
    }
    sessionStorage.setItem(K_AUTH, email || 'demo@local');
    avisar();
  },

  async sair() {
    sessionStorage.removeItem(K_AUTH);
    avisar();
  },

  observarAcoes(cb) {
    const f = () => {
      const acoes = ler(K_ACOES, {});
      const leads = Object.values(ler(K_LEADS, {}));
      for (const l of leads) if (l.acaoId && !acoes[l.acaoId]) acoes[l.acaoId] = { data: l.acaoId, nome: '' };
      cb(Object.entries(acoes).map(([id, a]) => ({ id, ...a })));
    };
    f();
    return assinar(f);
  },

  contarLeads: (acaoId) => aguardar(Object.values(ler(K_LEADS, {})).filter((l) => l.acaoId === acaoId).length),

  observarLeads(acaoId, cb) {
    const f = () => cb(Object.values(ler(K_LEADS, {})).filter((l) => l.acaoId === acaoId));
    f();
    return assinar(f);
  },

  salvarNomeAcao(acaoId, nome) {
    const a = ler(K_ACOES, {});
    a[acaoId] = { ...(a[acaoId] || { data: acaoId }), nome };
    gravar(K_ACOES, a);
    return aguardar();
  },

  editarLead(id, patch) {
    return repo.atualizarLead(id, patch);
  },

  excluirLead(id) {
    const l = ler(K_LEADS, {});
    delete l[id];
    gravar(K_LEADS, l);
    return aguardar();
  },
};

export default repo;

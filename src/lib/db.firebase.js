// Backend de produção: Firestore (com cache offline) + Firebase Auth (só no painel admin).
import { initializeApp } from 'firebase/app';
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  getFirestore,
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  serverTimestamp,
  waitForPendingWrites,
  getCountFromServer,
} from 'firebase/firestore';
import { configFirebase } from './firebase.js';

const app = initializeApp(configFirebase);

// Cache offline: se a internet da escola cair, os cadastros ficam guardados no aparelho e sobem sozinhos depois.
let db;
try {
  db = initializeFirestore(app, { localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }) });
} catch {
  db = getFirestore(app);
}

/** Firestore não aceita `undefined`. */
function limpar(v) {
  if (Array.isArray(v)) return v.map(limpar);
  if (v && typeof v === 'object' && !(v instanceof Date)) {
    return Object.fromEntries(Object.entries(v).filter(([, x]) => x !== undefined).map(([k, x]) => [k, limpar(x)]));
  }
  return v;
}

const leads = () => collection(db, 'leads');
const ts = (v) => (v && typeof v.toDate === 'function' ? v.toDate() : v ?? null);

const repo = {
  modo: 'firebase',

  // ---------- quiz (público) ----------
  novoId: () => doc(leads()).id,

  garantirAcao(acaoId) {
    const chave = `tp.acao.${acaoId}`;
    try {
      if (localStorage.getItem(chave)) return;
    } catch { /* ignora */ }
    setDoc(doc(db, 'acoes', acaoId), { data: acaoId })
      .catch(() => { /* já existia (as regras só deixam criar) */ })
      .finally(() => {
        try { localStorage.setItem(chave, '1'); } catch { /* ignora */ }
      });
  },

  criarLead(id, dados) {
    return setDoc(doc(db, 'leads', id), { ...limpar(dados), criadoEm: serverTimestamp(), atualizadoEm: serverTimestamp() });
  },

  atualizarLead(id, patch) {
    return updateDoc(doc(db, 'leads', id), { ...limpar(patch), atualizadoEm: serverTimestamp() });
  },

  /** true se tudo que estava na fila já chegou ao servidor (espera até `ms`). */
  sincronizado(ms = 2500) {
    return Promise.race([
      waitForPendingWrites(db).then(() => true),
      new Promise((resolve) => setTimeout(() => resolve(false), ms)),
    ]);
  },

  // ---------- admin ----------
  observarAuth(cb) {
    let ativo = true;
    let cancelar = () => {};
    import('firebase/auth').then(({ getAuth, onAuthStateChanged }) => {
      if (!ativo) return;
      cancelar = onAuthStateChanged(getAuth(app), (u) => cb(u ? { email: u.email } : null));
    });
    return () => {
      ativo = false;
      cancelar();
    };
  },

  async entrar(email, senha) {
    const { getAuth, signInWithEmailAndPassword } = await import('firebase/auth');
    await signInWithEmailAndPassword(getAuth(app), email, senha);
  },

  async sair() {
    const { getAuth, signOut } = await import('firebase/auth');
    await signOut(getAuth(app));
  },

  observarAcoes(cb, erro) {
    return onSnapshot(
      collection(db, 'acoes'),
      (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
      erro,
    );
  },

  async contarLeads(acaoId) {
    const s = await getCountFromServer(query(leads(), where('acaoId', '==', acaoId)));
    return s.data().count;
  },

  observarLeads(acaoId, cb, erro) {
    return onSnapshot(
      query(leads(), where('acaoId', '==', acaoId)),
      (snap) =>
        cb(
          snap.docs.map((d) => {
            const x = d.data({ serverTimestamps: 'estimate' });
            return { ...x, id: d.id, criadoEm: ts(x.criadoEm), atualizadoEm: ts(x.atualizadoEm) };
          }),
        ),
      erro,
    );
  },

  salvarNomeAcao(acaoId, nome) {
    return setDoc(doc(db, 'acoes', acaoId), { data: acaoId, nome, atualizadoEm: serverTimestamp() }, { merge: true });
  },

  editarLead(id, patch) {
    return updateDoc(doc(db, 'leads', id), { ...limpar(patch), atualizadoEm: serverTimestamp() });
  },

  excluirLead(id) {
    return deleteDoc(doc(db, 'leads', id));
  },
};

export default repo;

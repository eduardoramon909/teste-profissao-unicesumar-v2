// Lê a configuração do Firebase das variáveis de ambiente (Vercel > Settings > Environment Variables).
// Sem elas o app roda em MODO DEMONSTRAÇÃO (dados só no navegador).
const env = import.meta.env;

export const configFirebase = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
};

export const firebaseConfigurado = Boolean(configFirebase.apiKey && configFirebase.projectId && configFirebase.appId);

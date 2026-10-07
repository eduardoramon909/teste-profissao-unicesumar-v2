import { useEffect, useState } from 'react';
import { getRepo, modoDemo } from '../lib/db.js';
import Login from './admin/Login.jsx';
import Painel from './admin/Painel.jsx';

/** /admin — login (Firebase Auth) e painel de leads. */
export default function Admin() {
  const [repo, setRepo] = useState(null);
  const [user, setUser] = useState(undefined); // undefined = verificando, null = deslogado

  useEffect(() => {
    document.title = 'Painel • Teste de Profissão UniCesumar';
    getRepo().then(setRepo);
  }, []);
  useEffect(() => (repo ? repo.observarAuth(setUser) : undefined), [repo]);

  let conteudo;
  if (!repo || user === undefined) conteudo = <div className="carregando">Carregando…</div>;
  else if (!user) conteudo = <Login repo={repo} />;
  else conteudo = <Painel repo={repo} user={user} />;

  return (
    <div className="app app-admin">
      {modoDemo && (
        <div className="faixa-demo" role="note">
          Modo demonstração: dados salvos só neste navegador. Entre com qualquer e-mail e a senha <b>demo</b>.
        </div>
      )}
      {conteudo}
    </div>
  );
}

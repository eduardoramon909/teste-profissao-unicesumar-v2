import { useState } from 'react';
import Logo from '../../components/Logo.jsx';
import Campo from '../../components/Campo.jsx';
import { msgLogin } from './erros.js';

// Sufixo interno — deve bater com firestore.rules e com os usuários criados no Firebase Auth
const SUFIXO = '@polo.uni';

export default function Login({ repo }) {
  const [usuario,  setUsuario]  = useState('');
  const [senha,    setSenha]    = useState('');
  const [erro,     setErro]     = useState('');
  const [enviando, setEnviando] = useState(false);

  async function entrar(e) {
    e.preventDefault();
    setErro('');
    setEnviando(true);
    try {
      // Monta o e-mail fictício que o Firebase Auth reconhece
      const email = usuario.trim().toLowerCase() + SUFIXO;
      await repo.entrar(email, senha);
    } catch (err) {
      setErro(msgLogin(err));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <main className="login">
      <form className="login-card" onSubmit={entrar} noValidate>
        <Logo className="escuro" />
        <h1>Painel de leads</h1>
        <p>Acesso restrito à equipe.</p>

        <Campo id="l-usuario" rotulo="Usuário">
          <input
            id="l-usuario"
            type="text"
            autoComplete="username"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            placeholder="ex: nainanda.soares"
            value={usuario}
            onChange={(e) => setUsuario(e.target.value)}
            required
          />
        </Campo>

        <Campo id="l-senha" rotulo="Senha" erro={erro}>
          <input
            id="l-senha"
            type="password"
            autoComplete="current-password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            required
          />
        </Campo>

        <button className="btn btn-primario grande" type="submit" disabled={enviando}>
          {enviando ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
    </main>
  );
}

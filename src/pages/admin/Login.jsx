import { useState } from 'react';
import Logo from '../../components/Logo.jsx';
import Campo from '../../components/Campo.jsx';
import { msgLogin } from './erros.js';

export default function Login({ repo }) {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);

  async function entrar(e) {
    e.preventDefault();
    setErro('');
    setEnviando(true);
    try {
      await repo.entrar(email.trim(), senha);
    } catch (err) {
      setErro(msgLogin(err));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <main className="login">
      <form className="login-card" onSubmit={entrar}>
        <Logo className="escuro" />
        <h1>Painel de leads</h1>
        <p>Acesso restrito à equipe.</p>
        <Campo id="l-email" rotulo="E-mail">
          <input id="l-email" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </Campo>
        <Campo id="l-senha" rotulo="Senha" erro={erro}>
          <input id="l-senha" type="password" autoComplete="current-password" value={senha} onChange={(e) => setSenha(e.target.value)} required />
        </Campo>
        <button className="btn btn-primario grande" type="submit" disabled={enviando}>{enviando ? 'Entrando…' : 'Entrar'}</button>
      </form>
    </main>
  );
}

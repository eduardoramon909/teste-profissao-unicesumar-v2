import { useEffect, useState } from 'react';
import { getRepo, modoDemo } from '../lib/db.js';
import Login from './admin/Login.jsx';
import Painel from './admin/Painel.jsx';
import Dashboard from './admin/Dashboard.jsx';
import Metas from './admin/Metas.jsx';
import SouMais from './admin/SouMais.jsx';
import Processo from './admin/Processo.jsx';
import Campanhas from './admin/Campanhas.jsx';
import { IcDash, IcMeta, IcStar, IcCampanha, IcProcesso, IcPlacar } from '../components/Icones.jsx';

const ABAS = [
  { id: 'dashboard', label: 'Dashboard', Ic: IcDash },
  { id: 'acoes',     label: 'Ações',     Ic: IcPlacar },
  { id: 'sou-mais',  label: 'Sou +',     Ic: IcStar },
  { id: 'metas',     label: 'Metas',     Ic: IcMeta },
  { id: 'campanhas', label: 'Campanhas', Ic: IcCampanha },
  { id: 'processo',  label: 'Processo',  Ic: IcProcesso },
];

export default function Admin() {
  const [repo, setRepo]         = useState(null);
  const [user, setUser]         = useState(undefined);
  const [aba, setAba]           = useState('dashboard');
  const [processos, setProcessos] = useState([]);
  const [processoSel, setProcessoSel] = useState(null); // id do processo selecionado

  useEffect(() => {
    document.title = 'Painel • Teste de Profissão UniCesumar';
    getRepo().then(setRepo);
  }, []);

  useEffect(() => (repo ? repo.observarAuth(setUser) : undefined), [repo]);

  useEffect(() => {
    if (!repo) return;
    return repo.observarProcessos((lista) => {
      const ordenados = [...lista].sort((a, b) => (b.inicio || '').localeCompare(a.inicio || ''));
      setProcessos(ordenados);
      // Seleciona automaticamente o processo ativo (hoje dentro do período)
      if (!processoSel && ordenados.length) {
        const hoje = new Date().toISOString().slice(0, 10);
        const ativo = ordenados.find((p) => p.inicio <= hoje && p.fim >= hoje) || ordenados[0];
        setProcessoSel(ativo.id);
      }
    }, () => {});
  }, [repo]);

  let conteudo;
  if (!repo || user === undefined) {
    conteudo = <div className="carregando">Carregando…</div>;
  } else if (!user) {
    conteudo = <Login repo={repo} />;
  } else {
    const processoAtual = processos.find((p) => p.id === processoSel) || processos[0] || null;

    conteudo = (
      <div className="adm-shell">
        {/* ── Top bar ── */}
        <header className="painel-topo">
          <span className="painel-titulo">UniCesumar · Polo Igarapé-Açu</span>
          <span className="espaco" />

          {/* Seletor de processo */}
          {processos.length > 0 && (
            <select
              className="proc-select"
              value={processoSel || ''}
              onChange={(e) => setProcessoSel(e.target.value)}
              aria-label="Selecionar processo"
            >
              {processos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nome || p.id}
                </option>
              ))}
            </select>
          )}

          <span className="painel-usuario">{(user.email || '').split('@')[0]}</span>
          <button
            type="button"
            className="btn btn-secundario pequeno"
            onClick={() => repo.sair()}
          >
            Sair
          </button>
        </header>

        {/* ── Nav de abas ── */}
        <nav className="adm-nav" aria-label="Navegação principal">
          {ABAS.map(({ id, label, Ic }) => (
            <button
              key={id}
              type="button"
              className={`adm-nav-item${aba === id ? ' ativa' : ''}`}
              onClick={() => setAba(id)}
            >
              <Ic width={18} height={18} />
              <span>{label}</span>
            </button>
          ))}
        </nav>

        {/* ── Conteúdo ── */}
        <div className="adm-conteudo">
          {aba === 'dashboard' && (
            <Dashboard repo={repo} user={user} processo={processoAtual} processos={processos} />
          )}
          {aba === 'acoes' && (
            <Painel repo={repo} user={user} />
          )}
          {aba === 'sou-mais' && (
            <SouMais repo={repo} user={user} processo={processoAtual} />
          )}
          {aba === 'metas' && (
            <Metas repo={repo} processo={processoAtual} />
          )}
          {aba === 'campanhas' && (
            <Campanhas repo={repo} processo={processoAtual} />
          )}
          {aba === 'processo' && (
            <Processo repo={repo} processos={processos} />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="app app-admin">
      {modoDemo && (
        <div className="faixa-demo" role="note">
          Modo demonstração: dados salvos só neste navegador.
        </div>
      )}
      {conteudo}
    </div>
  );
}

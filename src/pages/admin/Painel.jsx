import { useEffect, useMemo, useState } from 'react';
import Logo from '../../components/Logo.jsx';
import { IcAlerta, IcBaixar, IcBusca, IcEditar, IcSair, IcWhats } from '../../components/Icones.jsx';
import { acharCurso, nomeDoCursoDoLead, NOME_TIPO } from '../../lib/cursos.js';
import { acaoIdDe, descreverAcao, formatarHora, paraData } from '../../lib/datas.js';
import { normalizar } from '../../lib/texto.js';
import { formatarCPF, formatarWhatsapp } from '../../lib/validacoes.js';
import LeadModal from './LeadModal.jsx';
import { msgErro } from './erros.js';

function situacao(l) {
  if (l.origem === 'admin') return 'Editado no painel';
  if (l.status === 'cadastro') return 'Cadastro direto';
  if (l.status === 'teste_iniciado') return 'Teste não concluído';
  if (l.status === 'teste_concluido') return 'Teste feito, sem curso';
  if (l.origem === 'sugestao') return 'Curso sugerido pelo teste';
  if (l.origem === 'lista') return 'Curso escolhido na lista';
  return '';
}
const tempo = (l) => paraData(l.criadoEm)?.getTime() ?? 0;

export default function Painel({ repo, user }) {
  const [acoes, setAcoes] = useState(null);
  const [sel, setSel] = useState(null);
  const [leads, setLeads] = useState(null);
  const [contagens, setContagens] = useState({});
  const [busca, setBusca] = useState('');
  const [editando, setEditando] = useState(null);
  const [nomeAcao, setNomeAcao] = useState('');
  const [salvandoNome, setSalvandoNome] = useState(false);
  const [semRepetidos, setSemRepetidos] = useState(true);
  const [exportando, setExportando] = useState(false);
  const [erro, setErro] = useState('');
  const [aviso, setAviso] = useState('');

  // ações (dias)
  useEffect(
    () => repo.observarAcoes((l) => setAcoes([...l].sort((a, b) => b.id.localeCompare(a.id))), (e) => setErro(msgErro(e))),
    [repo],
  );
  useEffect(() => {
    if (acoes?.length && !sel) setSel(acoes[0].id);
  }, [acoes, sel]);

  // leads da ação selecionada (ao vivo)
  useEffect(() => {
    setLeads(null);
    if (!sel) return undefined;
    return repo.observarLeads(sel, (l) => { setErro(''); setLeads(l); }, (e) => setErro(msgErro(e)));
  }, [repo, sel]);

  // contagem de leads por ação (lista lateral)
  const chaveAcoes = (acoes || []).map((a) => a.id).join(',');
  useEffect(() => {
    let ativo = true;
    (acoes || []).forEach((a) => {
      repo.contarLeads(a.id).then((n) => ativo && setContagens((c) => ({ ...c, [a.id]: n }))).catch(() => {});
    });
    return () => { ativo = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [repo, chaveAcoes]);

  const acaoAtual = acoes?.find((a) => a.id === sel);
  useEffect(() => { setNomeAcao(acaoAtual?.nome || ''); }, [sel, acaoAtual?.nome]);

  const duplicados = useMemo(() => {
    const c = {};
    (leads || []).forEach((l) => { c[l.cpf] = (c[l.cpf] || 0) + 1; });
    return c;
  }, [leads]);
  const qtdRepetidos = useMemo(() => Object.values(duplicados).reduce((s, n) => s + Math.max(0, n - 1), 0), [duplicados]);

  const filtrados = useMemo(() => {
    const ordenados = [...(leads || [])].sort((a, b) => tempo(b) - tempo(a));
    const termos = normalizar(busca).split(' ').filter(Boolean);
    if (!termos.length) return ordenados;
    return ordenados.filter((l) => {
      const palheiro = normalizar(`${l.nome} ${l.cpf} ${formatarCPF(l.cpf)} ${l.whatsapp} ${l.email || ''} ${nomeDoCursoDoLead(l)} ${situacao(l)}`);
      return termos.every((t) => palheiro.includes(t));
    });
  }, [leads, busca]);

  const stats = useMemo(() => {
    const l = leads || [];
    return {
      total: l.length,
      comCurso: l.filter((x) => x.cursoPretendido).length,
      testes: l.filter((x) => x.status === 'teste_concluido' || x.status === 'concluido').length,
      abandonos: l.filter((x) => x.status === 'teste_iniciado').length,
    };
  }, [leads]);

  async function salvarNome(e) {
    e.preventDefault();
    setSalvandoNome(true);
    setAviso('');
    try {
      await repo.salvarNomeAcao(sel, nomeAcao.trim());
      setAviso('Nome da ação salvo.');
    } catch (err) {
      setErro(msgErro(err));
    } finally {
      setSalvandoNome(false);
    }
  }

  async function exportar() {
    setExportando(true);
    setAviso('');
    setErro('');
    try {
      const { baixarPlanilha } = await import('../../lib/exportar.js');
      const nome = await baixarPlanilha({ acao: { id: sel, nome: nomeAcao.trim() }, leads, removerDuplicados: semRepetidos });
      setAviso(`Planilha gerada: ${nome}`);
    } catch (err) {
      setErro(`Não foi possível gerar a planilha: ${err.message}`);
    } finally {
      setExportando(false);
    }
  }

  const hoje = acaoIdDe();
  const infoAcao = sel ? descreverAcao(sel) : null;

  return (
    <div className="painel">
      <header className="painel-topo">
        <Logo className="escuro" />
        <span className="painel-titulo">Painel de leads</span>
        <span className="espaco" />
        <span className="painel-usuario">{user.email}</span>
        <button type="button" className="btn btn-secundario pequeno" onClick={() => repo.sair()}><IcSair width={18} height={18} /> Sair</button>
      </header>

      {erro && (
        <div className="alerta" role="alert"><IcAlerta width={20} height={20} /> <span>{erro}</span></div>
      )}

      <div className="painel-corpo">
        <aside className="painel-acoes" aria-label="Ações">
          <h2>Ações</h2>
          {acoes === null && <p className="vazio-txt">Carregando…</p>}
          {acoes?.length === 0 && (
            <p className="vazio-txt">Nenhuma ação ainda. Elas aparecem aqui assim que o primeiro lead do dia é cadastrado.</p>
          )}
          <ul>
            {(acoes || []).map((a) => {
              const d = descreverAcao(a.id);
              const n = a.id === sel && leads ? leads.length : contagens[a.id];
              return (
                <li key={a.id}>
                  <button type="button" className={`acao-item${a.id === sel ? ' ativa' : ''}`} onClick={() => { setSel(a.id); setBusca(''); setAviso(''); }}>
                    <span className="acao-nome">{a.nome || 'Sem nome'}</span>
                    <span className="acao-data">{d.data}, {d.dia}{a.id === hoje && <em className="selo novo">Hoje</em>}</span>
                    <span className="acao-n">{n ?? '…'} {n === 1 ? 'lead' : 'leads'}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </aside>

        <main className="painel-principal">
          {!sel ? (
            <div className="cartao-adm vazio-grande">Selecione uma ação.</div>
          ) : (
            <>
              <section className="cartao-adm">
                <div className="acao-cab">
                  <div>
                    <h2>{infoAcao.data}</h2>
                    <p className="vazio-txt">{infoAcao.dia}</p>
                  </div>
                  <ul className="numeros">
                    <li><strong>{stats.total}</strong><span>leads</span></li>
                    <li><strong>{stats.comCurso}</strong><span>com curso</span></li>
                    <li><strong>{stats.testes}</strong><span>testes feitos</span></li>
                    <li><strong>{stats.abandonos}</strong><span>não concluídos</span></li>
                  </ul>
                </div>

                <form className="linha-nome" onSubmit={salvarNome}>
                  <label htmlFor="nome-acao">Nome da ação</label>
                  <div className="linha-nome-campos">
                    <input id="nome-acao" type="text" value={nomeAcao} onChange={(e) => setNomeAcao(e.target.value)} placeholder="Ex.: Feira das Profissões - Colégio Estadual X" maxLength={120} autoComplete="off" />
                    <button type="submit" className="btn btn-secundario" disabled={salvandoNome || nomeAcao.trim() === (acaoAtual?.nome || '')}>
                      {salvandoNome ? 'Salvando…' : 'Salvar nome'}
                    </button>
                  </div>
                </form>

                <div className="linha-exportar">
                  <label className="check pequeno" htmlFor="sem-rep">
                    <input id="sem-rep" type="checkbox" checked={semRepetidos} onChange={(e) => setSemRepetidos(e.target.checked)} />
                    <span className="check-caixa" aria-hidden="true">✓</span>
                    <span className="check-texto">Não repetir CPF na planilha{qtdRepetidos > 0 ? ` (${qtdRepetidos} repetido${qtdRepetidos > 1 ? 's' : ''})` : ''}</span>
                  </label>
                  <button type="button" className="btn btn-primario" onClick={exportar} disabled={exportando || !leads?.length}>
                    <IcBaixar width={18} height={18} /> {exportando ? 'Gerando…' : 'Baixar planilha (.xlsx)'}
                  </button>
                </div>
                {aviso && <p className="aviso-ok" role="status">{aviso}</p>}
              </section>

              <section className="cartao-adm">
                <div className="busca-adm">
                  <IcBusca />
                  <input type="search" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar por nome, CPF, WhatsApp ou curso" aria-label="Buscar leads" autoComplete="off" />
                </div>

                {leads === null && <p className="vazio-txt pad">Carregando leads…</p>}
                {leads && filtrados.length === 0 && (
                  <p className="vazio-txt pad">{leads.length ? 'Nenhum lead encontrado para essa busca.' : 'Ainda não há leads nesta ação.'}</p>
                )}

                {filtrados.length > 0 && (
                  <table className="tabela">
                    <thead>
                      <tr>
                        <th>Hora</th><th>Nome</th><th>WhatsApp</th><th>CPF</th><th>Curso pretendido</th><th>Situação</th><th><span className="sr-only">Editar</span></th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtrados.map((l) => {
                        const curso = acharCurso(l);
                        return (
                          <tr key={l.id}>
                            <td data-label="Hora">{formatarHora(l.criadoEm)}</td>
                            <td data-label="Nome">
                              <strong>{l.nome}</strong>
                              {duplicados[l.cpf] > 1 && <em className="selo aviso">CPF repetido</em>}
                            </td>
                            <td data-label="WhatsApp">
                              <a className="link-whats" href={`https://wa.me/55${l.whatsapp}`} target="_blank" rel="noreferrer">
                                <IcWhats width={16} height={16} /> {formatarWhatsapp(l.whatsapp)}
                              </a>
                            </td>
                            <td data-label="CPF">{formatarCPF(l.cpf)}</td>
                            <td data-label="Curso pretendido">
                              {l.cursoPretendido ? (
                                <>
                                  <span className="curso-lead">{nomeDoCursoDoLead(l)}</span>
                                  {curso && <small className="tipo-lead">{NOME_TIPO[curso.tipo]}</small>}
                                </>
                              ) : (
                                <span className="vazio-txt">Sem curso</span>
                              )}
                            </td>
                            <td data-label="Situação"><span className="situacao">{situacao(l)}</span></td>
                            <td className="col-acoes">
                              <button type="button" className="btn-icone" onClick={() => setEditando(l)} aria-label={`Editar ${l.nome}`}><IcEditar /></button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </section>
            </>
          )}
        </main>
      </div>

      {editando && <LeadModal key={editando.id} lead={editando} repo={repo} onFechar={() => setEditando(null)} />}
    </div>
  );
}

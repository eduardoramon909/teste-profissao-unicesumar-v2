import { useCallback, useEffect, useRef, useState } from 'react';
import { CONFIG } from '../config.js';
import { getRepo, modoDemo } from '../lib/db.js';
import { acaoIdDe } from '../lib/datas.js';
import { camposDoCurso } from '../lib/cursos.js';
import { apenasDigitos, normalizarWhatsapp } from '../lib/validacoes.js';
import { formatarNome } from '../lib/texto.js';
import { montarSequencia, recomendar, resumoParaSalvar, totalPerguntas } from '../lib/recomendador.js';
import Inicio from './teste/Inicio.jsx';
import Perguntas from './teste/Perguntas.jsx';
import Analisando from './teste/Analisando.jsx';
import Resultado from './teste/Resultado.jsx';
import Fim from './teste/Fim.jsx';

const FORM_VAZIO = { nome: '', whatsapp: '', cpf: '', email: '', curso: null, consent: false };

export default function Teste() {
  const [fase, setFase] = useState('inicio');
  const [form, setForm] = useState(FORM_VAZIO);
  const [enviando, setEnviando] = useState(false);
  const [respostas, setRespostas] = useState({});
  const [passo, setPasso] = useState(0);
  const [segundos, setSegundos] = useState(0);
  const [resultado, setResultado] = useState(null);
  const [escolha, setEscolha] = useState(null);
  const [confirmando, setConfirmando] = useState(false);
  const [final, setFinal] = useState(null);
  const leadId = useRef(null);
  const inicioTeste = useRef(0);
  const estado = useRef({});
  estado.current = { fase, form };

  useEffect(() => { getRepo(); }, []);

  const novoParticipante = useCallback(() => {
    leadId.current = null;
    inicioTeste.current = 0;
    setForm(FORM_VAZIO);
    setRespostas({});
    setPasso(0);
    setSegundos(0);
    setResultado(null);
    setEscolha(null);
    setFinal(null);
    setConfirmando(false);
    setEnviando(false);
    setFase('inicio');
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (fase !== 'perguntas') return undefined;
    const t = setInterval(() => setSegundos(Math.floor((Date.now() - inicioTeste.current) / 1000)), 500);
    return () => clearInterval(t);
  }, [fase]);

  useEffect(() => {
    let t;
    const reiniciar = () => {
      clearTimeout(t);
      t = setTimeout(() => {
        const { fase: f, form: fm } = estado.current;
        const sujo = f !== 'inicio' || fm.nome || fm.cpf || fm.whatsapp || fm.curso;
        if (sujo && f !== 'fim') novoParticipante();
      }, CONFIG.INATIVIDADE_SEGUNDOS * 1000);
    };
    const eventos = ['pointerdown', 'keydown', 'scroll'];
    eventos.forEach((e) => window.addEventListener(e, reiniciar, { passive: true }));
    reiniciar();
    return () => {
      clearTimeout(t);
      eventos.forEach((e) => window.removeEventListener(e, reiniciar));
    };
  }, [novoParticipante]);

  const dadosBase = () => {
    const cpfLimpo = apenasDigitos(form.cpf || ''); // '' quando não preenchido
    return {
      nome: formatarNome(form.nome),
      whatsapp: normalizarWhatsapp(form.whatsapp),
      cpf: cpfLimpo,
      email: form.email ? form.email.trim() : '',
      consentimento: Boolean(form.consent),
    };
  };

  async function gravarCadastro(extra) {
    const repo = await getRepo();
    const base = dadosBase();
    if (!leadId.current) {
      leadId.current = repo.novoId();
      const acaoId = acaoIdDe();
      repo.garantirAcao(acaoId);
      repo.criarLead(leadId.current, { ...base, ...extra, acaoId }).catch((e) => console.error('criarLead', e));
    } else {
      repo.atualizarLead(leadId.current, { ...base, ...extra }).catch((e) => console.error('atualizarLead', e));
    }
  }

  async function aoEnviarInicio() {
    setEnviando(true);
    try {
      if (form.curso) {
        await gravarCadastro({ ...camposDoCurso(form.curso), origem: 'cadastro', status: 'cadastro' });
        setFinal({ nome: formatarNome(form.nome), curso: form.curso });
        setFase('fim');
      } else {
        await gravarCadastro({ ...camposDoCurso(null), origem: '', status: 'teste_iniciado' });
        if (!inicioTeste.current) inicioTeste.current = Date.now();
        setFase('perguntas');
      }
    } finally {
      setEnviando(false);
    }
  }

  function responder(pergunta, valor) {
    const novas = { ...respostas, [pergunta.id]: valor };
    setRespostas(novas);
    const seq = montarSequencia(novas);
    const proxima = seq.findIndex((p) => novas[p.id] == null);
    if (proxima === -1) finalizar(novas, seq);
    else setPasso(proxima);
  }

  function voltar() {
    if (passo > 0) setPasso(passo - 1);
    else setFase('inicio');
  }

  async function finalizar(novas, seq) {
    setFase('analisando');
    const filtradas = {};
    for (const p of seq) if (novas[p.id] != null) filtradas[p.id] = novas[p.id];
    const r = recomendar(filtradas);
    const duracao = (Date.now() - inicioTeste.current) / 1000;
    const repo = await getRepo();
    repo
      .atualizarLead(leadId.current, { ...resumoParaSalvar(filtradas, r, duracao), status: 'teste_concluido' })
      .catch((e) => console.error('atualizarLead', e));
    setTimeout(() => {
      setResultado({ ...r, duracao });
      setEscolha(null);
      setFase('resultado');
      window.scrollTo(0, 0);
    }, 1500);
  }

  async function confirmar() {
    if (!escolha) return;
    setConfirmando(true);
    const repo = await getRepo();
    repo
      .atualizarLead(leadId.current, { ...camposDoCurso(escolha.curso), origem: escolha.origem, status: 'concluido' })
      .catch((e) => console.error('atualizarLead', e));
    setFinal({ nome: formatarNome(form.nome), curso: escolha.curso });
    setConfirmando(false);
    setFase('fim');
    window.scrollTo(0, 0);
  }

  let tela = null;
  if (fase === 'inicio') {
    tela = <Inicio form={form} setForm={setForm} onSubmit={aoEnviarInicio} enviando={enviando} />;
  } else if (fase === 'perguntas') {
    const seq = montarSequencia(respostas);
    const pergunta = seq[Math.min(passo, seq.length - 1)];
    tela = (
      <Perguntas
        key={pergunta.id}
        pergunta={pergunta}
        indice={Math.min(passo, seq.length - 1)}
        total={totalPerguntas(respostas)}
        valor={respostas[pergunta.id]}
        onResponder={(v) => responder(pergunta, v)}
        onVoltar={voltar}
        segundos={segundos}
      />
    );
  } else if (fase === 'analisando') {
    tela = <Analisando />;
  } else if (fase === 'resultado' && resultado) {
    tela = (
      <Resultado
        resultado={resultado}
        escolha={escolha}
        onEscolher={(curso, origem) => setEscolha({ curso, origem })}
        onConfirmar={confirmar}
        confirmando={confirmando}
      />
    );
  } else if (fase === 'fim' && final) {
    tela = <Fim dados={final} onNovo={novoParticipante} />;
  }

  return (
    <div className="app app-quiz">
      {modoDemo && (
        <div className="faixa-demo" role="note">
          Modo demonstração: cadastros salvos só neste navegador.
        </div>
      )}
      {tela}
    </div>
  );
}

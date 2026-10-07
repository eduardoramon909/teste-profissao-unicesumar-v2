import { useMemo, useState } from 'react';
import { CONFIG } from '../../config.js';
import Campo from '../../components/Campo.jsx';
import CursoSelect from '../../components/CursoSelect.jsx';
import Logo from '../../components/Logo.jsx';
import { Anel } from '../../components/Marca.jsx';
import { IcCheck } from '../../components/Icones.jsx';
import {
  apenasDigitos, cpfValido, emailValido, formatarCPF, formatarWhatsapp, nomeValido, whatsappValido,
} from '../../lib/validacoes.js';

export function validarForm(f) {
  const e = {};
  if (!nomeValido(f.nome)) e.nome = 'Digite seu nome completo (nome e sobrenome).';
  if (!whatsappValido(f.whatsapp)) e.whatsapp = 'Informe o WhatsApp com DDD. Ex.: (91) 98888-7777';
  const d = apenasDigitos(f.cpf);
  if (d.length !== 11) e.cpf = 'O CPF tem 11 números.';
  else if (!cpfValido(d)) e.cpf = 'Esse CPF não parece válido. Confira os números.';
  if (CONFIG.COLETAR_EMAIL && f.email.trim() && !emailValido(f.email)) e.email = 'E-mail inválido.';
  if (CONFIG.EXIGIR_CONSENTIMENTO && !f.consent) e.consent = 'Marque a autorização para continuar.';
  return e;
}

export default function Inicio({ form, setForm, onSubmit, enviando }) {
  const [tentou, setTentou] = useState(false);
  const [tocados, setTocados] = useState({});
  const erros = useMemo(() => validarForm(form), [form]);
  const erro = (campo) => ((tentou || tocados[campo]) && erros[campo]) || undefined;
  const tocar = (campo) => () => setTocados((t) => ({ ...t, [campo]: true }));
  const set = (campo) => (valor) => setForm((f) => ({ ...f, [campo]: valor }));
  const cpfOk = apenasDigitos(form.cpf).length === 11 && cpfValido(form.cpf);

  function enviar(e) {
    e.preventDefault();
    setTentou(true);
    const primeiro = ['nome', 'whatsapp', 'cpf', 'email', 'consent'].find((k) => erros[k]);
    if (primeiro) {
      document.getElementById(`f-${primeiro}`)?.focus();
      return;
    }
    onSubmit();
  }

  return (
    <div className="tela tela-inicio">
      <Anel className="deco-anel" />
      <div className="conteudo">
        <header className="topo"><Logo /></header>

        <section className="hero">
          <h1>Descubra os cursos que combinam com você</h1>
          <p>Faça o Teste de Profissão em cerca de 1 minuto. São perguntas rápidas: é só tocar na resposta.</p>
        </section>

        <form className="folha form-inicio" onSubmit={enviar} noValidate autoComplete="off">
          <h2>Seus dados</h2>

          <Campo id="f-nome" rotulo="Nome completo" erro={erro('nome')}>
            <input
              id="f-nome" type="text" value={form.nome} onChange={(e) => set('nome')(e.target.value)} onBlur={tocar('nome')}
              autoComplete="off" autoCapitalize="words" autoCorrect="off" spellCheck={false} maxLength={120}
              placeholder="Nome e sobrenome" aria-invalid={Boolean(erro('nome'))}
            />
          </Campo>

          <Campo id="f-whatsapp" rotulo="WhatsApp" erro={erro('whatsapp')}>
            <input
              id="f-whatsapp" type="tel" inputMode="numeric" value={form.whatsapp}
              onChange={(e) => set('whatsapp')(formatarWhatsapp(e.target.value))} onBlur={tocar('whatsapp')}
              autoComplete="off" placeholder="(91) 98888-7777" aria-invalid={Boolean(erro('whatsapp'))}
            />
          </Campo>

          <Campo id="f-cpf" rotulo="CPF" erro={erro('cpf')}>
            <div className="input-ok">
              <input
                id="f-cpf" type="text" inputMode="numeric" value={form.cpf}
                onChange={(e) => set('cpf')(formatarCPF(e.target.value))} onBlur={tocar('cpf')}
                autoComplete="off" placeholder="000.000.000-00" aria-invalid={Boolean(erro('cpf'))}
              />
              {cpfOk && <span className="ok-check" title="CPF válido"><IcCheck width={18} height={18} /></span>}
            </div>
          </Campo>

          {CONFIG.COLETAR_EMAIL && (
            <Campo id="f-email" rotulo="E-mail" opcional erro={erro('email')}>
              <input
                id="f-email" type="email" inputMode="email" value={form.email} onChange={(e) => set('email')(e.target.value)}
                onBlur={tocar('email')} autoComplete="off" autoCapitalize="none" placeholder="voce@email.com"
              />
            </Campo>
          )}

          <Campo
            id="f-curso" rotulo="Curso pretendido" opcional
            dica="Já sabe o curso que quer? Escolha aqui e o cadastro é salvo sem o teste. Se ainda não sabe, deixe em branco."
          >
            <CursoSelect id="f-curso" valor={form.curso} onChange={set('curso')} />
          </Campo>

          {CONFIG.EXIGIR_CONSENTIMENTO && (
            <div className={`campo${erro('consent') ? ' tem-erro' : ''}`}>
              <label className="check" htmlFor="f-consent">
                <input id="f-consent" type="checkbox" checked={form.consent} onChange={(e) => set('consent')(e.target.checked)} />
                <span className="check-caixa" aria-hidden="true"><IcCheck width={16} height={16} /></span>
                <span className="check-texto">{CONFIG.TEXTO_CONSENTIMENTO}</span>
              </label>
              {erro('consent') && <p className="msg-erro" role="alert">{erro('consent')}</p>}
            </div>
          )}

          <button className="btn btn-primario grande" type="submit" disabled={enviando}>
            {form.curso ? 'Salvar cadastro' : 'Começar o teste'}
          </button>
          <p className="nota">{form.curso ? 'Como você já escolheu um curso, vamos direto ao cadastro.' : 'Leva cerca de 1 minuto.'}</p>
        </form>

        <footer className="rodape-polo">
          <strong>{CONFIG.POLO}</strong>
          <span>{CONFIG.ENDERECO_POLO}</span>
        </footer>
      </div>
    </div>
  );
}

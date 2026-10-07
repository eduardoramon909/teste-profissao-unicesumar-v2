import { Chevrons } from '../../components/Marca.jsx';

export default function Analisando() {
  return (
    <div className="tela tela-analisando" role="status" aria-live="polite">
      <div className="conteudo centro">
        <Chevrons className="chevrons-anim" />
        <h1>Analisando seu perfil…</h1>
        <p>Cruzando suas respostas com mais de 500 cursos.</p>
      </div>
    </div>
  );
}

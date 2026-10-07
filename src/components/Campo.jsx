/** Rótulo + campo + mensagem de erro/dica. */
export default function Campo({ id, rotulo, opcional, erro, dica, children }) {
  return (
    <div className={`campo${erro ? ' tem-erro' : ''}`}>
      <label htmlFor={id}>
        {rotulo}
        {opcional && <span className="opcional"> (opcional)</span>}
      </label>
      {children}
      {erro ? (
        <p className="msg-erro" role="alert">{erro}</p>
      ) : dica ? (
        <p className="dica">{dica}</p>
      ) : null}
    </div>
  );
}

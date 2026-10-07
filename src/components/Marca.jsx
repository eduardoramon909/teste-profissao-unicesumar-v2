// Elementos decorativos inspirados nos folhetos: anel azul e as três setas.
export function Anel({ className }) {
  return (
    <svg className={className} viewBox="0 0 400 400" aria-hidden="true" focusable="false">
      <circle
        cx="200" cy="200" r="150" fill="none" stroke="currentColor" strokeWidth="70"
        strokeDasharray="760 183" strokeLinecap="round" transform="rotate(-38 200 200)"
      />
    </svg>
  );
}

export function Chevrons({ className }) {
  const p = { fill: 'none', strokeWidth: 9, strokeLinecap: 'round', strokeLinejoin: 'round' };
  return (
    <svg className={className} viewBox="0 0 120 56" aria-hidden="true" focusable="false">
      <path d="M18 14l14 14-14 14" stroke="currentColor" opacity=".35" {...p} />
      <path d="M48 14l14 14-14 14" stroke="currentColor" opacity=".65" {...p} />
      <path d="M78 14l14 14-14 14" stroke="currentColor" {...p} />
    </svg>
  );
}

import { CONFIG } from '../config.js';

export default function Logo({ className = '' }) {
  if (CONFIG.LOGO_URL) {
    return <img className={`logo-img ${className}`} src={CONFIG.LOGO_URL} alt={CONFIG.INSTITUICAO} />;
  }
  return (
    <span className={`logo-texto ${className}`} aria-label={CONFIG.INSTITUICAO}>
      <svg viewBox="0 0 40 40" width="30" height="30" aria-hidden="true">
        <circle cx="20" cy="20" r="14" fill="none" stroke="currentColor" strokeWidth="5" strokeDasharray="70 18" strokeLinecap="round" transform="rotate(-30 20 20)" />
        <path d="M16 15l6 5-6 5" fill="none" stroke="#54C5F1" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span>{CONFIG.INSTITUICAO}</span>
    </span>
  );
}

const base = {
  width: 22,
  height: 22,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
  focusable: false,
};
const ic = (children) => (props) => <svg {...base} {...props}>{children}</svg>;

export const IcVoltar = ic(<path d="M15 18l-6-6 6-6" />);
export const IcFechar = ic(<path d="M18 6L6 18M6 6l12 12" />);
export const IcBusca = ic(<><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></>);
export const IcCheck = ic(<path d="M20 6L9 17l-5-5" />);
export const IcSeta = ic(<path d="M6 9l6 6 6-6" />);
export const IcEditar = ic(<><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4 12.5-12.5z" /></>);
export const IcLixeira = ic(<path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v6M14 11v6" />);
export const IcBaixar = ic(<path d="M12 3v12M7 10l5 5 5-5M5 21h14" />);
export const IcWhats = ic(<path d="M21 11.5a8.4 8.4 0 01-12.4 7.4L3 20l1.2-5.3A8.4 8.4 0 1121 11.5z" />);
export const IcSair = ic(<path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />);
export const IcRelogio = ic(<><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>);
export const IcAlerta = ic(<path d="M12 9v4M12 17h.01M10.3 3.9L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z" />);
export const IcUsuarios = ic(<><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20a6.5 6.5 0 0113 0M16 4.5a3.5 3.5 0 010 7M21.5 20a6.5 6.5 0 00-4-6" /></>);

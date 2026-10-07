import { lazy, Suspense } from 'react';
import Teste from './pages/Teste.jsx';

const Admin = lazy(() => import('./pages/Admin.jsx'));

export default function App() {
  const ehAdmin = /^\/admin\/?$/i.test(window.location.pathname);
  if (ehAdmin) {
    return (
      <Suspense fallback={<div className="carregando">Carregando…</div>}>
        <Admin />
      </Suspense>
    );
  }
  return <Teste />;
}

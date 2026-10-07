// Camada de dados. Carrega sob demanda o backend certo (Firebase em produção, localStorage no modo demonstração).
import { firebaseConfigurado } from './firebase.js';

export const modoDemo = !firebaseConfigurado;

let _repo;
export function getRepo() {
  if (!_repo) {
    _repo = (modoDemo ? import('./db.local.js') : import('./db.firebase.js')).then((m) => m.default);
  }
  return _repo;
}

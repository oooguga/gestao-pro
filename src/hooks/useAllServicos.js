// ─── useAllServicos ────────────────────────────────────────────────────────────
// Hook compartilhado que lê todos os serviços e compras da lista unificada.
// Usado por Dashboard e outros componentes que precisam de visão geral dos dados.
import { useLocalStorage } from "./useLocalStorage";

export function useAllServicos() {
  const [servicos] = useLocalStorage("servicos_lista", []);
  const [compras]  = useLocalStorage("compras_lista",  []);

  return {
    todosServicos: servicos,
    todasCompras:  compras,
  };
}

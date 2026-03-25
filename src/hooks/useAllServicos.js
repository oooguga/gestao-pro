// ─── useAllServicos ────────────────────────────────────────────────────────────
// Hook compartilhado que busca todos os serviços e compras via API.
// Substitui a versão antiga que lia do localStorage (agora obsoleto).
import { useState, useEffect } from "react";
import { tercService }    from "../services/terc";
import { comprasService } from "../services/compras";

export function useAllServicos() {
  const [todosServicos, setTodosServicos] = useState([]);
  const [todasCompras,  setTodasCompras]  = useState([]);

  useEffect(() => {
    tercService.list()   .then(setTodosServicos).catch(() => {});
    comprasService.list().then(setTodasCompras) .catch(() => {});
  }, []);

  return { todosServicos, todasCompras, setTodosServicos, setTodasCompras };
}

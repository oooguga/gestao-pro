import { useState, useEffect, useCallback } from 'react';
import { configService, CONFIG_DEFAULTS } from '../services/config';

// ─── useConfig ────────────────────────────────────────────────────────────────
// Carrega todas as configs do servidor uma vez e expõe:
//   config       → objeto com todos os valores (com fallback para defaults)
//   loading      → true enquanto carrega
//   updateConfig → grava uma chave no servidor e atualiza estado local
//
// Exemplo de uso:
//   const { config, updateConfig } = useConfig();
//   config.mp_madeira  → ['Lâmina natural preta', ...]
//   config.mp_eletrica → ['Tomadas', ...]
//   await updateConfig('mp_madeira', [...novaLista])

export function useConfig() {
  const [config, setConfig]   = useState(CONFIG_DEFAULTS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    configService.getAll()
      .then((data) => setConfig((prev) => ({ ...prev, ...data })))
      .catch(() => { /* usa defaults locais */ })
      .finally(() => setLoading(false));
  }, []);

  const updateConfig = useCallback(async (chave, valor) => {
    await configService.set(chave, valor);
    setConfig((prev) => ({ ...prev, [chave]: valor }));
  }, []);

  return { config, loading, updateConfig };
}

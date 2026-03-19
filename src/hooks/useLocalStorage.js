import { useState, useEffect } from "react";

// Evento customizado para sincronizar mudanças externas no localStorage
const LS_EVENT = "gestao_ls_change";

/**
 * Hook que sincroniza um estado React com o localStorage do navegador.
 * Também escuta o evento "gestao_ls_change" para atualizar quando o valor
 * for alterado externamente (ex: via console ou migração automática).
 *
 * @param {string} key          - Chave no localStorage
 * @param {*}      initialValue - Valor padrão (usado se nada estiver salvo)
 */
export function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  // Persiste no localStorage sempre que o valor mudar
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(storedValue));
    } catch {}
  }, [key, storedValue]);

  // Escuta atualizações externas (migração, console, etc.)
  useEffect(() => {
    const handler = (e) => {
      if (e.detail?.key === key) {
        try {
          const item = localStorage.getItem(key);
          if (item !== null) setStoredValue(JSON.parse(item));
        } catch {}
      }
    };
    window.addEventListener(LS_EVENT, handler);
    return () => window.removeEventListener(LS_EVENT, handler);
  }, [key]);

  return [storedValue, setStoredValue];
}

/** Atualiza localStorage e notifica todos os hooks useLocalStorage da mesma aba */
export function setLocalStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(new CustomEvent(LS_EVENT, { detail: { key } }));
  } catch {}
}

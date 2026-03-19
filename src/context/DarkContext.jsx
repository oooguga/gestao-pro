import { createContext, useContext } from "react";

// Contexto que distribui o valor isDark para todos os componentes filhos.
// Uso: const isDark = useDark();
export const DarkContext = createContext(false);

export const useDark = () => useContext(DarkContext);

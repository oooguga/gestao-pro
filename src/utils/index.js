// ─── Utilitários gerais ───────────────────────────────────────────────────────

/**
 * Gera um ID único de 6 caracteres.
 * Para produção futura, usar crypto.randomUUID() ou um ID do banco de dados.
 */
export const generateId = () =>
  Math.random().toString(36).slice(2, 8).toUpperCase();

/**
 * Retorna a data de hoje no formato YYYY-MM-DD (padrão do input type="date").
 * Usa hora local para evitar problemas de fuso horário.
 */
export const today = () => {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm   = String(d.getMonth() + 1).padStart(2, "0");
  const dd   = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

/**
 * Retorna true se uma data (string YYYY-MM-DD) já passou.
 * Usa comparação de strings para evitar problemas de fuso horário
 * (YYYY-MM-DD é ordenável lexicograficamente).
 */
export const isOverdue = (dateStr) => !!dateStr && dateStr < today();

import { apiFetch } from './api';

export const tarefasService = {
  // Colunas com tarefas aninhadas
  listColunas:   ()           => apiFetch('/api/tarefas/colunas'),
  createColuna:  (body)       => apiFetch('/api/tarefas/colunas', { method: 'POST', body: JSON.stringify(body) }),
  updateColuna:  (id, patch)  => apiFetch(`/api/tarefas/colunas/${id}`, { method: 'PUT',  body: JSON.stringify(patch) }),
  deleteColuna:  (id)         => apiFetch(`/api/tarefas/colunas/${id}`, { method: 'DELETE' }),

  // Cartões
  createTarefa:  (body)       => apiFetch('/api/tarefas', { method: 'POST', body: JSON.stringify(body) }),
  updateTarefa:  (id, patch)  => apiFetch(`/api/tarefas/${id}`, { method: 'PUT',  body: JSON.stringify(patch) }),
  deleteTarefa:  (id)         => apiFetch(`/api/tarefas/${id}`, { method: 'DELETE' }),
};

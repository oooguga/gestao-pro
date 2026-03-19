import { apiFetch } from './api';

export const estoqueService = {
  list:           ()         => apiFetch('/api/estoque'),
  create:         (body)     => apiFetch('/api/estoque',          { method: 'POST',   body: JSON.stringify(body) }),
  update:         (id, body) => apiFetch(`/api/estoque/${id}`,    { method: 'PUT',    body: JSON.stringify(body) }),
  remove:         (id)       => apiFetch(`/api/estoque/${id}`,    { method: 'DELETE' }),
  registrarMov:   (id, body) => apiFetch(`/api/estoque/${id}/mov`,{ method: 'POST',   body: JSON.stringify(body) }),
  listMovimentos: (id)       => apiFetch(`/api/estoque/${id}/mov`),
};

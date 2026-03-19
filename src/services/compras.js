import { apiFetch } from './api';

export const comprasService = {
  list:   ()          => apiFetch('/api/compras'),
  create: (body)      => apiFetch('/api/compras',      { method: 'POST',   body: JSON.stringify(body) }),
  update: (id, body)  => apiFetch(`/api/compras/${id}`, { method: 'PUT',    body: JSON.stringify(body) }),
  remove: (id)        => apiFetch(`/api/compras/${id}`, { method: 'DELETE' }),
};

import { apiFetch } from './api';

export const pedidosService = {
  list:   ()          => apiFetch('/api/pedidos'),
  create: (body)      => apiFetch('/api/pedidos',      { method: 'POST',   body: JSON.stringify(body) }),
  update: (id, body)  => apiFetch(`/api/pedidos/${id}`, { method: 'PUT',    body: JSON.stringify(body) }),
  remove: (id)        => apiFetch(`/api/pedidos/${id}`, { method: 'DELETE' }),
};

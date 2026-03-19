import { apiFetch } from './api';

export const usuariosService = {
  list:   ()          => apiFetch('/api/usuarios'),
  create: (body)      => apiFetch('/api/usuarios',       { method: 'POST',   body: JSON.stringify(body) }),
  update: (id, body)  => apiFetch(`/api/usuarios/${id}`, { method: 'PUT',    body: JSON.stringify(body) }),
  remove: (id)        => apiFetch(`/api/usuarios/${id}`, { method: 'DELETE' }),
};

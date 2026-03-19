import { apiFetch } from './api';

export const tercService = {
  list:   ()          => apiFetch('/api/terc'),
  create: (body)      => apiFetch('/api/terc',      { method: 'POST',   body: JSON.stringify(body) }),
  update: (id, body)  => apiFetch(`/api/terc/${id}`, { method: 'PUT',    body: JSON.stringify(body) }),
  remove: (id)        => apiFetch(`/api/terc/${id}`, { method: 'DELETE' }),
};

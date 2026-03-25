import { apiFetch } from './api';

// ─── Valores padrão locais (usados se a API falhar / offline) ─────────────────
export const CONFIG_DEFAULTS = {
  mp_madeira:  ['Lâmina natural preta', 'Lâmina natural amadeirada', 'Melamínico preto', 'Melamínico amadeirado'],
  mp_eletrica: ['Tomadas', 'USB-A', 'Personalizado'],
  mp_couro:    ['Couro Natural', 'Couro Sintético', 'Personalizado'],
  compras_categorias: [
    { nome: 'Aço',     itens: ['Barra chata', 'Barra redonda', 'Chapa', 'Tubo'] },
    { nome: 'Madeira', itens: ['MDF', 'MDP', 'Compensado', 'Madeira maciça'] },
    { nome: 'Couro',   itens: ['Couro natural', 'Couro sintético'] },
  ],
  config_fornecedores_servicos: [],
  config_sheets_url: '',
  config_gas_url:    '',
};

export const configService = {
  // Carrega todas as configs de uma vez (usado no startup)
  getAll: () => apiFetch('/api/config'),

  // Lê uma chave específica
  get: (chave) => apiFetch(`/api/config/${chave}`).then((r) => r.valor),

  // Grava uma chave (admin/gerente)
  set: (chave, valor) =>
    apiFetch(`/api/config/${chave}`, {
      method: 'PUT',
      body: JSON.stringify({ valor }),
    }),
};

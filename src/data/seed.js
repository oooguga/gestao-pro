import { generateId } from "../utils";

// ─── Estado inicial das etapas de um produto ─────────────────────────────────
// Chamado ao criar um novo produto para garantir que todas as etapas existam.
// ATENÇÃO: os valores iniciais devem corresponder às opções em OPCOES (constants/index.js).
export const initEtapas = () => ({
  madeira:    { status: "Especificação Técnica" },
  eletrica:   { status: "Compra de Matéria-prima" },   // ← M maiúsculo (padronizado)
  ferragens:  { status: "Aguardando Projeto" },
  engenharia: { projeto: "Aguardando", compra_aco: "N/A" }, // ← "Aguardando" está em OPCOES.engProj
  cortes:     { ctl: "N/A", ccj: "N/A", ccl: "N/A" },
  couro:      { status: "N/A" },
  usinagem:   { status: "N/A" },
  imp3d:      { status: "N/A" },
  fabricacao: { checklist: false, soldagem: false, premontagem: false },
  pintura:    { status: "N/A", antenor: "N/A", rafael: "N/A" },
  assembly:   { montagem: "Aguardando", embalagem: "Aguardando" },
});

// ─── Dados de exemplo (seed) ──────────────────────────────────────────────────
// Estes dados são carregados apenas na primeira vez que o app inicia.
// Em produção, serão substituídos por dados vindos da API/banco de dados.
export const SEED_ORDERS = [
  {
    id: "PED-001",
    cliente: "Arper",
    entrega: "2026-03-25",
    produtos: [
      {
        id: generateId(),
        produto: "Mesa Reunião",
        codigo: "MR-001",
        qtd: 2,
        larg: 1800, prof: 900, alt: 750,
        aco: "Preto",
        aco_custom: "",
        madeira_cfg: "Sim",
        madeira_items: [{ mp: "Lâmina natural amadeirada", larg: 1600, comp: 700, qtd: 2 }],
        couro: "N/A",
        eletrica_cfg: "Sim",
        eletrica_items: [{ mp: "Tomadas", item: "Tomada 3P", qtd: 4, custom: "" }],
        obs: "Entrega urgente",
        etapas: {
          ...initEtapas(),
          fabricacao: { checklist: true, soldagem: true, premontagem: false },
          pintura:    { status: "Enviado", antenor: "Enviado", rafael: "N/A" },
          ferragens:  { status: "Em Produção" },
          assembly:   { montagem: "Aguardando", embalagem: "Aguardando" },
          engenharia: { projeto: "Em Processo", compra_aco: "Aguardando Projeto" },
          // ↑ "Em Processo" e "Aguardando Projeto" estão em OPCOES.engProj e OPCOES.compraAco
          cortes:     { ctl: "N/A", ccj: "Em Produção", ccl: "N/A" },
        },
      },
      {
        id: generateId(),
        produto: "Aparador",
        codigo: "AP-003",
        qtd: 1,
        larg: 1200, prof: 400, alt: 800,
        aco: "Preto",
        aco_custom: "",
        madeira_cfg: "Sim",
        madeira_items: [{ mp: "Melamínico preto", larg: 1100, comp: 350, qtd: 2 }],
        couro: "N/A",
        eletrica_cfg: "N/A",
        eletrica_items: [],
        obs: "",
        etapas: {
          ...initEtapas(),
          ferragens:  { status: "Concluído" },
          engenharia: { projeto: "Concluído", compra_aco: "Recebido" },
          // ↑ "Recebido" agora está em OPCOES.compraAco (último passo)
          cortes:     { ctl: "N/A", ccj: "N/A", ccl: "N/A" },
          fabricacao: { checklist: true, soldagem: false, premontagem: false },
        },
      },
    ],
  },
  {
    id: "PED-002",
    cliente: "Vitra",
    entrega: "2026-04-10",
    produtos: [
      {
        id: generateId(),
        produto: "Cadeira Lounge",
        codigo: "CL-002",
        qtd: 4,
        larg: 700, prof: 750, alt: 820,
        aco: "Branco",
        aco_custom: "",
        madeira_cfg: "N/A",
        madeira_items: [],
        couro: "Preto",
        eletrica_cfg: "N/A",
        eletrica_items: [],
        obs: "",
        etapas: {
          ...initEtapas(),
          couro:      { status: "Em Produção" },
          fabricacao: { checklist: true, soldagem: false, premontagem: false },
        },
      },
    ],
  },
  {
    id: "PED-003",
    cliente: "Arper",
    entrega: "2026-05-01",
    produtos: [
      {
        id: generateId(),
        produto: "Estante Modular",
        codigo: "EM-004",
        qtd: 3,
        larg: 900, prof: 350, alt: 1800,
        aco: "Branco",
        aco_custom: "",
        madeira_cfg: "Sim",
        madeira_items: [{ mp: "Lâmina natural amadeirada", larg: 800, comp: 300, qtd: 6 }],
        couro: "N/A",
        eletrica_cfg: "N/A",
        eletrica_items: [],
        obs: "",
        etapas: initEtapas(),
      },
    ],
  },
];

export const SEED_TERC = [
  {
    id: generateId(),
    pedido: "PED-001",
    produtos: "Mesa Reunião",
    fornecedor: "Joilaser",
    lote: "L-2024-01",
    solicitacao: "2026-03-01",
    previsao: "2026-03-20",
    status: "Em Produção",
  },
];

export const SEED_COMPRAS = [
  {
    id: generateId(),
    pedido: "PED-001",
    categoria: "Madeira",
    item: "Lâmina amadeirada 1600x700",
    qtd: 4,
    fornecedor: "MadeiraMadeira",
    solicitacao: "2026-03-02",
    previsao: "2026-03-15",
    status: "Recebido",
  },
  {
    id: generateId(),
    pedido: "PED-002",
    categoria: "Couro",
    item: "Couro Preto 2mm",
    qtd: 8,
    fornecedor: "Curtume SP",
    solicitacao: "2026-03-05",
    previsao: "2026-03-25",
    status: "Em Andamento",
  },
];

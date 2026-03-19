// ─── Status centralizados ────────────────────────────────────────────────────
// Em vez de usar strings soltas ("Concluído", "N/A") por todo o código,
// use estas constantes. Se precisar renomear um status, muda apenas aqui.
export const STATUS = {
  NA:          "N/A",
  AGUARDANDO:  "Aguardando",
  EM_PROCESSO: "Em Processo",
  EM_PRODUCAO: "Em Produção",
  CONCLUIDO:   "Concluído",
  RECEBIDO:    "Recebido",
  ENVIADO:     "Enviado",
  SOLICITADO:  "Solicitado",
};

// ─── Opções de cada etapa ─────────────────────────────────────────────────────
// ATENÇÃO: a ordem importa — StepNav navega prev/next por índice.
// O último item de cada lista é o estado "concluído" da etapa.
export const OPCOES = {
  madeira:   ["Especificação Técnica", "Compra de Matéria-prima", "Solicitação Enviada", "Concluído"],
  // ↑ "Compra de Matéria-prima" com M maiúsculo (padronizado)
  eletrica:  ["Compra de Matéria-prima", "Concluído"],
  ferragens: ["Aguardando Projeto", "Em Produção", "Concluído"],
  engProj:   ["N/A", "Aguardando", "Em Processo", "Concluído"],
  compraAco: ["N/A", "Aguardando Projeto", "Solicitado", "Recebido"],
  // ↑ último passo é "Recebido" (consistente com useProgress.js)
  corte:     ["N/A", "Aguardando Projeto", "Em Produção", "Recebido"],
  couro:     ["Aguardando Projeto", "Desenho Técnico Feito", "Solicitação Enviada", "Em Produção", "Recebido"],
  usinagem:  ["Aguardando Projeto", "Compra de Matéria-prima", "Em Produção", "Recebido"],
  imp3d:     ["Aguardando Projeto", "Em Produção", "Recebido"],
  pintura:   ["Enviado", "Recebido"],
  assembly:  ["Aguardando", "Concluído"],
};

// ─── Metadados dos grupos de progresso ───────────────────────────────────────
export const GROUP_META = [
  { key: "madeira",   label: "Madeira",   cor: "#d97706" },
  { key: "eletrica",  label: "Elétrica",  cor: "#ca8a04" },
  { key: "ferragens", label: "Ferragens", cor: "#6b7280" },
  { key: "producao",  label: "Produção",  cor: "#3b82f6" },
  { key: "couro",     label: "Couro",     cor: "#f97316" },
  { key: "pintura",   label: "Pintura",   cor: "#8b5cf6" },
  { key: "assembly",  label: "Assembly",  cor: "#06b6d4" },
];

// ─── Status de serviços terceirizados e compras ───────────────────────────────
export const STATUS_TERC    = ["Solicitado", "Em Produção", "Recebido"];
export const STATUS_COMPRAS = ["Solicitado", "Em Andamento", "Recebido"];

// ─── Matérias-primas ──────────────────────────────────────────────────────────
export const MP_MADEIRA  = ["Lâmina natural preta", "Lâmina natural amadeirada", "Melamínico preto", "Melamínico amadeirado"];
export const MP_ELETRICA = ["Tomadas", "USB-A", "Personalizado"];

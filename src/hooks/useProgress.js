import { useMemo } from "react";
import { GROUP_META } from "../constants";

// ─── calcProgress ─────────────────────────────────────────────────────────────
// Calcula o percentual de progresso global de um produto (0–100).
// Retorna 100 apenas quando embalagem está "Concluído".
export function calcProgress(product) {
  const { madeira_cfg, eletrica_cfg, etapas, couro } = product;
  const steps = [];

  if (madeira_cfg !== "N/A")                steps.push(etapas.madeira?.status === "Concluído");
  if (eletrica_cfg !== "N/A")               steps.push(etapas.eletrica?.status === "Concluído");
  if (etapas.ferragens?.status !== "N/A")   steps.push(etapas.ferragens?.status === "Concluído");
  if (etapas.engenharia?.projeto !== "N/A") steps.push(etapas.engenharia?.projeto === "Concluído");
  if (etapas.engenharia?.compra_aco !== "N/A") steps.push(etapas.engenharia?.compra_aco === "Recebido");
  if (etapas.cortes?.ctl !== "N/A")  steps.push(etapas.cortes?.ctl === "Recebido");
  if (etapas.cortes?.ccj !== "N/A")  steps.push(etapas.cortes?.ccj === "Recebido");
  if (etapas.cortes?.ccl !== "N/A")  steps.push(etapas.cortes?.ccl === "Recebido");
  if (couro !== "N/A")               steps.push(etapas.couro?.status === "Recebido");
  if (etapas.usinagem?.status !== "N/A") steps.push(etapas.usinagem?.status === "Recebido");
  if (etapas.imp3d?.status !== "N/A")    steps.push(etapas.imp3d?.status === "Recebido");

  ["checklist", "soldagem", "premontagem"].forEach((s) =>
    steps.push(!!etapas.fabricacao?.[s])
  );

  // Pintura: controlada por antenor e rafael (status é campo legado, sem controle na UI)
  if (etapas.pintura?.antenor !== "N/A") steps.push(etapas.pintura?.antenor === "Recebido");
  if (etapas.pintura?.rafael  !== "N/A") steps.push(etapas.pintura?.rafael  === "Recebido");
  if (etapas.assembly?.montagem !== "N/A")  steps.push(etapas.assembly?.montagem === "Concluído");
  if (etapas.assembly?.embalagem !== "N/A") steps.push(etapas.assembly?.embalagem === "Concluído");

  if (!steps.length) return 0;
  if (etapas.assembly?.embalagem === "Concluído") return 100;

  return Math.min(
    Math.round((steps.filter(Boolean).length / steps.length) * 100),
    99
  );
}

// ─── groupedProgress ──────────────────────────────────────────────────────────
// Retorna o progresso por grupo (Madeira, Elétrica, Ferragens, etc.) de 0 a 1.
// Usado pelo SegmentedBar para mostrar a barra colorida por setor.
export function groupedProgress(product) {
  const { madeira_cfg, eletrica_cfg, etapas, couro } = product;

  // Etapas de Produção (grupo interno)
  const producaoSteps = [
    { ativo: etapas.engenharia?.projeto !== "N/A",   done: etapas.engenharia?.projeto === "Concluído" },
    { ativo: etapas.engenharia?.compra_aco !== "N/A",done: etapas.engenharia?.compra_aco === "Recebido" },
    { ativo: etapas.cortes?.ctl !== "N/A",           done: etapas.cortes?.ctl === "Recebido" },
    { ativo: etapas.cortes?.ccj !== "N/A",           done: etapas.cortes?.ccj === "Recebido" },
    { ativo: etapas.cortes?.ccl !== "N/A",           done: etapas.cortes?.ccl === "Recebido" },
    { ativo: etapas.usinagem?.status !== "N/A",      done: etapas.usinagem?.status === "Recebido" },
    { ativo: etapas.imp3d?.status !== "N/A",         done: etapas.imp3d?.status === "Recebido" },
    { ativo: true, done: !!etapas.fabricacao?.checklist },
    { ativo: true, done: !!etapas.fabricacao?.soldagem },
    { ativo: true, done: !!etapas.fabricacao?.premontagem },
  ];
  const activeProd = producaoSteps.filter((s) => s.ativo);
  const producaoFill = activeProd.length
    ? activeProd.filter((s) => s.done).length / activeProd.length
    : 0;

  // Pintura: usa antenor e rafael como campos reais
  const pintAnt = etapas.pintura?.antenor;
  const pintRaf = etapas.pintura?.rafael;
  const pintAntAtivo = pintAnt && pintAnt !== "N/A";
  const pintRafAtivo = pintRaf && pintRaf !== "N/A";
  const pinturaAtivo = pintAntAtivo || pintRafAtivo;
  const calcPint = (v) => v === "Recebido" ? 1 : v === "Enviado" ? 0.5 : 0;
  const pintVals = [pintAntAtivo ? calcPint(pintAnt) : null, pintRafAtivo ? calcPint(pintRaf) : null].filter((v) => v !== null);
  const pinturaFill = pintVals.length ? pintVals.reduce((a, b) => a + b, 0) / pintVals.length : 0;

  const assemblyFill =
    ((etapas.assembly?.montagem === "Concluído" ? 1 : 0) +
     (etapas.assembly?.embalagem === "Concluído" ? 1 : 0)) / 2;

  return [
    { key: "madeira",   ativo: madeira_cfg !== "N/A",           fill: madeira_cfg !== "N/A"   ? (etapas.madeira?.status === "Concluído" ? 1 : 0)  : 0 },
    { key: "eletrica",  ativo: eletrica_cfg !== "N/A",          fill: eletrica_cfg !== "N/A"  ? (etapas.eletrica?.status === "Concluído" ? 1 : 0) : 0 },
    { key: "ferragens", ativo: etapas.ferragens?.status !== "N/A", fill: etapas.ferragens?.status === "Concluído" ? 1 : 0 },
    { key: "producao",  ativo: true,                            fill: producaoFill },
    { key: "couro",     ativo: couro !== "N/A",                 fill: couro !== "N/A" ? (etapas.couro?.status === "Recebido" ? 1 : 0) : 0 },
    { key: "pintura",   ativo: pinturaAtivo,                    fill: pinturaFill },
    { key: "assembly",  ativo: true,                            fill: assemblyFill },
  ];
}

// ─── Hook: useProductProgress ────────────────────────────────────────────────
// Wrapper com useMemo para evitar recalcular a cada render.
// Uso: const { progress, groups } = useProductProgress(product);
export function useProductProgress(product) {
  const progress = useMemo(() => calcProgress(product), [product]);
  const groups   = useMemo(() => groupedProgress(product), [product]);
  return { progress, groups };
}

// ─── Hook: useOrdersProgress ─────────────────────────────────────────────────
// Calcula progresso médio de uma lista de pedidos.
export function useOrdersProgress(orders) {
  return useMemo(() => {
    const allProducts = orders.flatMap((o) =>
      o.produtos.map((p) => ({ ...p, entrega: o.entrega, pedido_id: o.id, cliente: o.cliente }))
    );
    const avgProgress = allProducts.length
      ? Math.round(allProducts.reduce((acc, p) => acc + calcProgress(p), 0) / allProducts.length)
      : 0;
    return { allProducts, avgProgress };
  }, [orders]);
}

// ─── groupedProgressAvg ───────────────────────────────────────────────────────
// Média de progresso por grupo para um array de produtos.
// Usada no Dashboard para mostrar SegmentedBar por pedido.
export function groupedProgressAvg(products) {
  const allGroups = products.map((p) => groupedProgress(p));
  return GROUP_META.map((meta, gi) => {
    const active = allGroups.filter((gs) => gs[gi].ativo);
    if (!active.length) return { ...meta, ativo: false, fill: 0 };
    return {
      ...meta,
      ativo: true,
      fill: active.reduce((acc, gs) => acc + gs[gi].fill, 0) / active.length,
    };
  });
}

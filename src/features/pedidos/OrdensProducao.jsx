import { useState, useMemo, useEffect, Fragment } from "react";
import { useDark } from "../../context/DarkContext";
import theme from "../../theme";
import { OPCOES } from "../../constants";
import { calcProgress, groupedProgress } from "../../hooks/useProgress";
import { isOverdue } from "../../utils";
import ProgressBar from "../../components/ui/ProgressBar";
import SegmentedBar from "../../components/ui/SegmentedBar";
import StepNav from "../../components/ui/StepNav";
import EtapaCard from "../../components/ui/EtapaCard";
import TrashButton from "../../components/ui/TrashButton";
import { pedidosService } from "../../services/pedidos";

// ─── Hook responsivo ──────────────────────────────────────────────────────────
function useWindowWidth() {
  const [width, setWidth] = useState(window.innerWidth);
  useEffect(() => {
    const handler = () => setWidth(window.innerWidth);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return width;
}

// Helper: cobre null, undefined e "N/A"
const isNA = (v) => !v || v === "N/A";

// ─── Badge compacto de etapa ──────────────────────────────────────────────────
// Exibe apenas a fração "2/4" com cor indicativa.
// O texto completo do status fica no tooltip (title).
function StepBadge({ status, options }) {
  const isDark = useDark();

  if (isNA(status))
    return (
      <span style={{
        display: "inline-block", padding: "2px 6px", borderRadius: 4,
        fontSize: 11, fontWeight: 600,
        color: theme.txtMuted(isDark),
        background: isDark ? "#1e2130" : "#f0f1f5",
      }}>N/A</span>
    );

  const index    = options.indexOf(status);
  const total    = options.length;
  const progress = total <= 1 ? 1 : index / (total - 1);

  const color =
    index === 0           ? theme.txtSecondary(isDark)
    : index === total - 1 ? theme.green
    : progress > 0.5      ? theme.blue
    : theme.amber;

  const bg =
    index === 0           ? (isDark ? "#1e2130" : "#f0f1f5")
    : index === total - 1 ? (isDark ? "#0d2e22" : "#ecfdf5")
    : progress > 0.5      ? (isDark ? "#0d1f3d" : "#eff6ff")
    : (isDark ? "#2d1f0a" : "#fffbeb");

  return (
    <span
      title={status}
      style={{
        display:    "inline-block",
        padding:    "3px 7px",
        borderRadius: 6,
        background: bg,
        fontSize:   11,
        fontWeight: 800,
        color,
        whiteSpace: "nowrap",
        cursor:     "default",
      }}
    >
      {index + 1}/{total}
    </span>
  );
}

// ─── Painel expandido de etapas ───────────────────────────────────────────────
function EtapasPanel({ product, onUpdateStep }) {
  const isDark = useDark();
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))", gap: 14 }}>

      {!isNA(product.madeira_cfg) && (
        <EtapaCard title="Madeira">
          <div style={{ marginBottom: 10, display: "flex", flexDirection: "column", gap: 3 }}>
            {product.madeira_items.map((m, i) => (
              <span key={i} style={{ fontSize: 12, color: theme.txtSecondary(isDark) }}>
                {m.mp} — {m.larg}×{m.comp} ×{m.qtd}
              </span>
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 12, color: theme.txtSecondary(isDark), flexShrink: 0 }}>Status</span>
            <StepNav value={product.etapas.madeira.status} options={OPCOES.madeira} onChange={(v) => onUpdateStep(["madeira","status"],v)} />
          </div>
        </EtapaCard>
      )}

      {!isNA(product.eletrica_cfg) && (
        <EtapaCard title="Elétrica">
          <div style={{ marginBottom: 10, display: "flex", flexDirection: "column", gap: 3 }}>
            {product.eletrica_items.map((e, i) => (
              <span key={i} style={{ fontSize: 12, color: theme.txtSecondary(isDark) }}>
                {e.mp === "Personalizado" ? e.custom : e.mp} ×{e.qtd}
              </span>
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 12, color: theme.txtSecondary(isDark), flexShrink: 0 }}>Status</span>
            <StepNav value={product.etapas.eletrica.status} options={OPCOES.eletrica} onChange={(v) => onUpdateStep(["eletrica","status"],v)} />
          </div>
        </EtapaCard>
      )}

      <EtapaCard title="Ferragens">
        <StepNav value={product.etapas.ferragens.status} options={["N/A",...OPCOES.ferragens]} onChange={(v) => onUpdateStep(["ferragens","status"],v)} />
      </EtapaCard>

      <EtapaCard title="Engenharia — Projeto">
        <StepNav value={product.etapas.engenharia.projeto} options={OPCOES.engProj} onChange={(v) => onUpdateStep(["engenharia","projeto"],v)} />
      </EtapaCard>

      <EtapaCard title="Compra de Aço">
        <StepNav value={product.etapas.engenharia.compra_aco} options={OPCOES.compraAco} onChange={(v) => onUpdateStep(["engenharia","compra_aco"],v)} />
      </EtapaCard>

      <EtapaCard title="Cortes Terceirizados">
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {[["Tubos Laurentino","ctl"],["Chapas Joilaser","ccj"],["Chapas Laurentino","ccl"]].map(([label, key]) => (
            <div key={key}>
              <span style={{ fontSize: 10, fontWeight: 700, color: theme.txtMuted(isDark), textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 5 }}>{label}</span>
              <StepNav value={product.etapas.cortes?.[key] || "N/A"} options={OPCOES.corte} onChange={(v) => onUpdateStep(["cortes",key],v)} />
            </div>
          ))}
        </div>
      </EtapaCard>

      {!isNA(product.couro) && (
        <EtapaCard title="Couro">
          <p style={{ fontSize: 12, color: theme.txtSecondary(isDark), margin: "0 0 10px" }}>
            Material: <strong style={{ color: theme.txtPrimary(isDark) }}>{product.couro}</strong>
          </p>
          <StepNav value={product.etapas.couro.status} options={["N/A",...OPCOES.couro]} onChange={(v) => onUpdateStep(["couro","status"],v)} />
        </EtapaCard>
      )}

      <EtapaCard title="Usinagem">
        <StepNav value={product.etapas.usinagem.status} options={["N/A",...OPCOES.usinagem]} onChange={(v) => onUpdateStep(["usinagem","status"],v)} />
      </EtapaCard>

      <EtapaCard title="Impressão 3D">
        <StepNav value={product.etapas.imp3d.status} options={["N/A",...OPCOES.imp3d]} onChange={(v) => onUpdateStep(["imp3d","status"],v)} />
      </EtapaCard>

      <EtapaCard title="Fabricação">
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[["Checklist","checklist"],["Soldagem e Acabamento","soldagem"],["Pré-montagem","premontagem"]].map(([label, key]) => (
            <label key={key} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, cursor: "pointer", color: theme.txtPrimary(isDark) }}>
              <input type="checkbox" checked={!!product.etapas.fabricacao[key]} onChange={(e) => onUpdateStep(["fabricacao",key],e.target.checked)} style={{ accentColor: theme.accent, width: 16, height: 16 }} />
              {label}
            </label>
          ))}
        </div>
      </EtapaCard>

      <EtapaCard title="Pintura">
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {[["Antenor","antenor"],["Rafael","rafael"]].map(([label, key]) => (
            <div key={key}>
              <span style={{ fontSize: 10, fontWeight: 700, color: theme.txtMuted(isDark), textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 5 }}>{label}</span>
              <StepNav value={product.etapas.pintura[key]} options={["N/A",...OPCOES.pintura]} onChange={(v) => onUpdateStep(["pintura",key],v)} />
            </div>
          ))}
        </div>
      </EtapaCard>

      <EtapaCard title="Assembly">
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {[["Montagem","montagem"],["Embalagem","embalagem"]].map(([label, key]) => (
            <div key={key}>
              <span style={{ fontSize: 10, fontWeight: 700, color: theme.txtMuted(isDark), textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 5 }}>{label}</span>
              <StepNav value={product.etapas.assembly[key]} options={OPCOES.assembly} onChange={(v) => onUpdateStep(["assembly",key],v)} />
            </div>
          ))}
        </div>
      </EtapaCard>
    </div>
  );
}

// ─── Card mobile ──────────────────────────────────────────────────────────────
function ProductCard({ product, isExpanded, onToggle, onEdit, onDelete, onUpdateStep }) {
  const isDark  = useDark();
  const pct     = calcProgress(product);
  const groups  = groupedProgress(product);
  const isLate  = isOverdue(product.entrega) && pct < 100;
  const fabDone = ["checklist","soldagem","premontagem"].filter((k) => product.etapas.fabricacao[k]).length;

  const statusColor = pct === 100 ? theme.green : isLate ? theme.red : pct > 0 ? theme.blue : theme.txtMuted(isDark);
  const statusLabel = pct === 100 ? "Concluído" : isLate ? "Atrasado" : pct > 0 ? "Em Andamento" : "Não iniciado";

  return (
    <div style={{ background: theme.bgCard(isDark), border: `1px solid ${isLate ? theme.red+"66" : theme.border(isDark)}`, borderRadius: 12, overflow: "hidden" }}>
      <div onClick={onToggle} style={{ padding: "16px", cursor: "pointer", display: "flex", gap: 12, alignItems: "flex-start" }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={theme.txtMuted(isDark)} strokeWidth="2.5" strokeLinecap="round"
          style={{ marginTop: 3, flexShrink: 0, transition: "transform .2s", transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)" }}>
          <polyline points="9 18 15 12 9 6" />
        </svg>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 6 }}>
            <span style={{ fontWeight: 800, fontSize: 15, color: theme.txtPrimary(isDark) }}>{product.produto}</span>
            {product.codigo && <span style={{ fontSize: 11, color: theme.txtMuted(isDark), fontFamily: "monospace" }}>{product.codigo}</span>}
            <span style={{ fontSize: 11, fontWeight: 700, color: statusColor, background: `${statusColor}22`, padding: "2px 8px", borderRadius: 99 }}>{statusLabel}</span>
          </div>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 10 }}>
            {[
              ["Pedido", product.pedido_id, true],
              ["Cliente", product.cliente, false],
              ["Entrega", product.entrega, isLate],
              ["Qtd", `${product.qtd} un`, false],
              ["Fab.", `${fabDone}/3`, false],
            ].map(([k, v, highlight]) => (
              <span key={k} style={{ fontSize: 12, color: theme.txtSecondary(isDark) }}>
                {k}: <strong style={{ color: highlight ? theme.red : theme.txtPrimary(isDark), fontFamily: k === "Pedido" ? "monospace" : "inherit" }}>{v}{isLate && k === "Entrega" ? " ⚠" : ""}</strong>
              </span>
            ))}
          </div>
          <SegmentedBar groups={groups} />
          <div style={{ marginTop: 8 }}><ProgressBar pct={pct} /></div>
        </div>
        <div style={{ display: "flex", gap: 4, flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
          <button onClick={onEdit} title="Editar" style={{ background: "none", border: "none", cursor: "pointer", color: theme.blue, padding: 6, display: "flex", alignItems: "center", borderRadius: 6 }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </button>
          <TrashButton onClick={onDelete} size={15} />
        </div>
      </div>
      {isExpanded && (
        <div style={{ padding: "0 16px 16px", borderTop: `1px solid ${theme.border(isDark)}` }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: theme.accent, textTransform: "uppercase", letterSpacing: "0.08em", margin: "14px 0 12px" }}>Etapas de Fabricação</p>
          <EtapasPanel product={product} onUpdateStep={onUpdateStep} />
        </div>
      )}
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function OrdensProducao({ orders, setOrders, onEdit }) {
  const isDark   = useDark();
  const width    = useWindowWidth();
  const isMobile = width < 768;

  const [expandedKey,   setExpandedKey]   = useState(null);
  const [search,        setSearch]        = useState("");
  const [filterStatus,  setFilterStatus]  = useState("Todos");
  const [confirmDelete, setConfirmDelete] = useState(null);

  const allProducts = useMemo(
    () => orders.flatMap((o) => o.produtos.map((p) => ({ ...p, pedido_id: o.id, cliente: o.cliente, entrega: o.entrega }))),
    [orders]
  );

  const filteredProducts = useMemo(() => {
    const q = search.toLowerCase();
    return allProducts.filter((p) => {
      const matchSearch = !q || p.produto.toLowerCase().includes(q) || p.codigo.toLowerCase().includes(q) || p.cliente.toLowerCase().includes(q) || p.pedido_id.toLowerCase().includes(q);
      const pct = calcProgress(p);
      const matchStatus =
        filterStatus === "Todos" ||
        (filterStatus === "Concluído"    && pct === 100) ||
        (filterStatus === "Em Andamento" && pct < 100 && pct > 0) ||
        (filterStatus === "Não Iniciado" && pct === 0) ||
        (filterStatus === "Atrasado"     && isOverdue(p.entrega) && pct < 100);
      return matchSearch && matchStatus;
    });
  }, [allProducts, search, filterStatus]);

  const updateStep = (productId, orderId, path, value) => {
    setOrders((prev) => {
      const newOrders = prev.map((order) => {
        if (order.id !== orderId) return order;
        return {
          ...order,
          produtos: order.produtos.map((p) => {
            if (p.id !== productId) return p;
            const et = { ...p.etapas };
            if (path.length === 2) et[path[0]] = { ...et[path[0]], [path[1]]: value };
            else et[path[0]] = value;
            return { ...p, etapas: et };
          }),
        };
      });
      // Sincroniza com a API (optimistic update — UI não espera)
      const updated = newOrders.find((o) => o.id === orderId);
      if (updated) pedidosService.update(orderId, updated).catch(() => {});
      return newOrders;
    });
  };

  const deleteProduct = (orderId, productId) => {
    setOrders((prev) => {
      const newOrders = prev
        .map((o) => o.id !== orderId ? o : { ...o, produtos: o.produtos.filter((p) => p.id !== productId) })
        .filter((o) => o.produtos.length > 0);
      // Sincroniza com a API
      const updatedOrder = newOrders.find((o) => o.id === orderId);
      if (updatedOrder) {
        pedidosService.update(orderId, updatedOrder).catch(() => {});
      } else {
        pedidosService.remove(orderId).catch(() => {});
      }
      return newOrders;
    });
    setConfirmDelete(null);
    setExpandedKey(null);
  };

  const rk = (pid, oid) => `${oid}-${pid}`;

  // ─── Definição das colunas ──────────────────────────────────────────────────
  // Os pesos (w) são proporcionais — a tabela usa 100% da largura disponível.
  // Colunas de etapa têm peso menor pois exibem apenas a fração "2/4".
  const COLS = useMemo(() => [
    // Informações básicas
    { key: "pedido_id",  label: "Pedido",    w: 7,   group: null },
    { key: "produto",    label: "Produto",   w: 11,  group: null },
    { key: "cliente",    label: "Cliente",   w: 7,   group: null },
    { key: "entrega",    label: "Entrega",   w: 7,   group: null },
    { key: "qtd",        label: "Qtd",       w: 3,   group: null },
    // Etapas (peso 4 cada — exibem somente "2/4")
    { key: "madeira",    label: "Mad.",      w: 4,   group: { label: "Madeira",   color: "#d97706", bg: isDark ? "rgba(217,119,6,.18)"  : "#fef3c7" } },
    { key: "eletrica",   label: "Elét.",     w: 4,   group: { label: "Elétrica",  color: "#ca8a04", bg: isDark ? "rgba(202,138,4,.18)"  : "#fefce8" } },
    { key: "ferragens",  label: "Ferr.",     w: 4,   group: { label: "Ferragens", color: "#6b7280", bg: isDark ? "rgba(107,114,128,.18)": "#f3f4f6" } },
    { key: "eng_proj",   label: "Proj.",     w: 4,   group: { label: "Eng.",      color: "#3b82f6", bg: isDark ? "rgba(59,130,246,.18)" : "#eff6ff", span: 1 } },
    { key: "compra_aco", label: "Aço",       w: 4,   group: { label: "Compra Aço",color: "#6366f1", bg: isDark ? "rgba(99,102,241,.18)" : "#eef2ff" } },
    { key: "ctl",        label: "CTL",       w: 4,   group: { label: "Cortes",    color: "#8b5cf6", bg: isDark ? "rgba(139,92,246,.18)" : "#f5f3ff", span: 3 } },
    { key: "ccj",        label: "CCJ",       w: 4,   group: null },
    { key: "ccl",        label: "CCL",       w: 4,   group: null },
    { key: "usinagem",   label: "Usin.",     w: 4,   group: { label: "Produção",  color: "#06b6d4", bg: isDark ? "rgba(6,182,212,.18)"  : "#ecfeff", span: 5 } },
    { key: "imp3d",      label: "3D",        w: 4,   group: null },
    { key: "fabricacao", label: "Fab.",      w: 3,   group: null },
    { key: "pintura",    label: "Pint.",     w: 4,   group: null },
    { key: "assembly",   label: "Assy.",     w: 4,   group: null },
    { key: "couro",      label: "Couro",     w: 4,   group: { label: "Couro",     color: "#f97316", bg: isDark ? "rgba(249,115,22,.18)" : "#fff7ed" } },
    // Progresso e ações
    { key: "progresso",  label: "Progresso", w: 10,  group: null },
    { key: "acoes",      label: "",          w: 4,   group: null },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [isDark]);

  // Peso total (soma de todos os w) — usado para calcular % de cada coluna
  const totalWeight = useMemo(() => COLS.reduce((sum, col) => sum + col.w, 0), [COLS]);

  // Agrupa cabeçalhos coloridos (linha 1 do thead)
  const headerGroups = useMemo(() => {
    const groups = [];
    let i = 0;
    while (i < COLS.length) {
      const col = COLS[i];
      if (col.group?.span) {
        groups.push({ ...col.group, colSpan: col.group.span, colIndex: i });
        i += col.group.span;
      } else if (col.group) {
        groups.push({ ...col.group, colSpan: 1, colIndex: i });
        i++;
      } else {
        groups.push({ label: null, colSpan: 1, colIndex: i });
        i++;
      }
    }
    return groups;
  }, [COLS]);

  // ─── Estilos base das células ────────────────────────────────────────────────
  const thBase = {
    padding:       "7px 4px",
    fontSize:      10,
    fontWeight:    700,
    letterSpacing: "0.03em",
    color:         theme.txtSecondary(isDark),
    textAlign:     "center",
    whiteSpace:    "nowrap",
    overflow:      "hidden",
    borderBottom:  `1px solid ${theme.border(isDark)}`,
  };
  const tdBase = {
    padding:       "10px 4px",
    fontSize:      12,
    verticalAlign: "middle",
    textAlign:     "center",
    overflow:      "hidden",
  };

  // Bordas laterais de grupo (delimitam visualmente cada setor)
  const groupBorderL = (key) => {
    const starts = ["madeira","eletrica","ferragens","eng_proj","compra_aco","ctl","usinagem","couro"];
    return starts.includes(key) ? `1px solid ${theme.border(isDark)}` : "none";
  };
  const groupBorderR = (key) => {
    const ends = ["madeira","eletrica","ferragens","eng_proj","compra_aco","ccl","assembly","couro"];
    return ends.includes(key) ? `1px solid ${theme.border(isDark)}` : "none";
  };

  // ─── Renderização de células ─────────────────────────────────────────────────
  const renderCell = (key, product, pct, fabDone) => {
    const e     = product.etapas;
    const badge = (s, opts) => isNA(s)
      ? <span style={{ display:"inline-block", padding:"2px 6px", borderRadius:4, fontSize:11, fontWeight:600, color:theme.txtMuted(isDark), background: isDark?"#1e2130":"#f0f1f5" }}>N/A</span>
      : <StepBadge status={s} options={opts} />;

    switch (key) {
      case "pedido_id":
        return <span style={{ fontFamily:"monospace", fontSize:11, fontWeight:700, color:theme.txtSecondary(isDark) }}>{product.pedido_id}</span>;
      case "produto":
        return (
          <span style={{ fontWeight:800, fontSize:12, color:theme.txtPrimary(isDark), overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", display:"block" }}>
            {product.produto}
            {isOverdue(product.entrega) && pct < 100 ? <span style={{marginLeft:4,color:theme.red}}>⚠</span> : null}
          </span>
        );
      case "cliente":
        return <span style={{ color:theme.txtSecondary(isDark), overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", display:"block", fontSize:11 }}>{product.cliente}</span>;
      case "entrega":
        return <span style={{ color: isOverdue(product.entrega) && pct < 100 ? theme.red : theme.txtSecondary(isDark), fontWeight: isOverdue(product.entrega) && pct < 100 ? 700 : 400, fontSize:11 }}>{product.entrega}</span>;
      case "qtd":
        return <span style={{ fontWeight:800, fontSize:13, color:theme.accent }}>{product.qtd}</span>;
      case "madeira":    return badge(isNA(product.madeira_cfg) ? "N/A" : e.madeira?.status,    OPCOES.madeira);
      case "eletrica":   return badge(isNA(product.eletrica_cfg) ? "N/A" : e.eletrica?.status,  OPCOES.eletrica);
      case "ferragens":  return badge(e.ferragens?.status,   OPCOES.ferragens);
      case "eng_proj":   return badge(e.engenharia?.projeto, OPCOES.engProj);
      case "compra_aco": return badge(e.engenharia?.compra_aco, OPCOES.compraAco.filter(o => o !== "N/A"));
      case "ctl":        return badge(e.cortes?.ctl, OPCOES.corte.filter(o => o !== "N/A"));
      case "ccj":        return badge(e.cortes?.ccj, OPCOES.corte.filter(o => o !== "N/A"));
      case "ccl":        return badge(e.cortes?.ccl, OPCOES.corte.filter(o => o !== "N/A"));
      case "usinagem":   return badge(e.usinagem?.status, OPCOES.usinagem);
      case "imp3d":      return badge(e.imp3d?.status,    OPCOES.imp3d);
      case "fabricacao":
        return <span style={{ fontWeight:800, fontSize:13, color: fabDone === 3 ? theme.green : theme.amber }}>{fabDone}/3</span>;
      case "pintura":
        return badge(isNA(e.pintura?.status) ? "N/A" : e.pintura?.status, OPCOES.pintura);
      case "assembly":
        return badge(e.assembly?.embalagem === "Concluído" ? "Concluído" : e.assembly?.montagem, OPCOES.assembly);
      case "couro":
        return badge(isNA(product.couro) ? "N/A" : e.couro?.status, OPCOES.couro);
      case "progresso":
        return <ProgressBar pct={pct} />;
      case "acoes":
        return (
          <div style={{ display:"flex", gap:2, alignItems:"center", justifyContent:"center" }} onClick={(ev) => ev.stopPropagation()}>
            <button onClick={() => onEdit(product.pedido_id, product.id)} title="Editar"
              style={{ background:"none", border:"none", cursor:"pointer", color:theme.blue, padding:4, display:"flex", alignItems:"center", borderRadius:6 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            </button>
            <TrashButton onClick={() => setConfirmDelete({ orderId: product.pedido_id, productId: product.id })} size={14} />
          </div>
        );
      default: return null;
    }
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
      <h2 style={{ fontSize:22, fontWeight:800, color:theme.txtPrimary(isDark), margin:0 }}>Ordens de Produção</h2>

      {/* ─── Filtros ─────────────────────────────────────────────────────── */}
      <div style={{ display:"flex", gap:10, flexWrap:"wrap", alignItems:"center" }}>
        <div style={{ flex:"1 1 240px", position:"relative" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={theme.txtMuted(isDark)} strokeWidth="2" strokeLinecap="round"
            style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", pointerEvents:"none" }}>
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar produto, código, cliente, pedido..."
            style={{ width:"100%", boxSizing:"border-box", background:theme.bgCard(isDark), color:theme.txtPrimary(isDark), border:`1px solid ${theme.border(isDark)}`, borderRadius:8, padding:"10px 12px 10px 36px", fontSize:13, outline:"none" }} />
        </div>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
          style={{ background:theme.bgCard(isDark), color:theme.txtPrimary(isDark), border:`1px solid ${theme.border(isDark)}`, borderRadius:8, padding:"10px 14px", fontSize:13, fontWeight:600, outline:"none", cursor:"pointer", flexShrink:0 }}>
          {["Todos","Em Andamento","Não Iniciado","Concluído","Atrasado"].map((o) => <option key={o}>{o}</option>)}
        </select>
        <span style={{ fontSize:12, color:theme.txtMuted(isDark), flexShrink:0 }}>
          {filteredProducts.length} resultado{filteredProducts.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* ─── Modal de exclusão ──────────────────────────────────────────── */}
      {confirmDelete && (
        <div style={{ position:"fixed", inset:0, zIndex:100, background:"rgba(0,0,0,0.6)", display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}>
          <div style={{ background:theme.bgCard(isDark), border:`1px solid ${theme.red}66`, borderRadius:14, padding:"28px 32px", maxWidth:380, width:"100%", boxShadow:"0 8px 40px rgba(0,0,0,0.4)" }}>
            <p style={{ fontSize:16, fontWeight:700, color:theme.txtPrimary(isDark), margin:"0 0 8px" }}>Excluir produto?</p>
            <p style={{ fontSize:13, color:theme.txtSecondary(isDark), margin:"0 0 24px" }}>Esta ação não pode ser desfeita.</p>
            <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
              <button onClick={() => setConfirmDelete(null)} style={{ padding:"9px 20px", fontSize:13, fontWeight:600, borderRadius:8, border:`1px solid ${theme.border(isDark)}`, background:"transparent", color:theme.txtSecondary(isDark), cursor:"pointer" }}>Cancelar</button>
              <button onClick={() => deleteProduct(confirmDelete.orderId, confirmDelete.productId)} style={{ padding:"9px 20px", fontSize:13, fontWeight:700, borderRadius:8, border:"none", background:theme.red, color:"#fff", cursor:"pointer" }}>Excluir</button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MOBILE: cards ──────────────────────────────────────────────── */}
      {isMobile && (
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          {!filteredProducts.length && (
            <div style={{ background:theme.bgCard(isDark), border:`1px solid ${theme.border(isDark)}`, borderRadius:12, padding:"32px 20px", textAlign:"center", color:theme.txtMuted(isDark), fontSize:14 }}>
              Nenhum resultado encontrado.
            </div>
          )}
          {filteredProducts.map((product) => {
            const key = rk(product.id, product.pedido_id);
            return (
              <ProductCard key={key} product={product} isExpanded={expandedKey === key}
                onToggle={() => setExpandedKey(expandedKey === key ? null : key)}
                onEdit={() => onEdit(product.pedido_id, product.id)}
                onDelete={() => setConfirmDelete({ orderId: product.pedido_id, productId: product.id })}
                onUpdateStep={(path, value) => updateStep(product.id, product.pedido_id, path, value)} />
            );
          })}
        </div>
      )}

      {/* ─── DESKTOP: tabela responsiva (ocupa 100% da largura disponível) ─ */}
      {!isMobile && (
        <div style={{ background:theme.bgCard(isDark), border:`1px solid ${theme.border(isDark)}`, borderRadius:14, overflow:"hidden" }}>
          {/*
            tableLayout: "fixed" + width: "100%" = cada coluna ocupa exatamente
            a sua porcentagem do espaço disponível, sem scroll horizontal.
            Os pesos (w) em COLS determinam a proporção relativa de cada coluna.
          */}
          <table style={{ borderCollapse:"collapse", tableLayout:"fixed", width:"100%" }}>

            {/* Larguras proporcionais por coluna */}
            <colgroup>
              {COLS.map((col, ci) => (
                <col key={ci} style={{ width: `${(col.w / totalWeight * 100).toFixed(2)}%` }} />
              ))}
            </colgroup>

            <thead>
              {/* Linha 1: grupos coloridos (Madeira, Elétrica, etc.) */}
              <tr>
                {headerGroups.map((g, gi) =>
                  g.label ? (
                    <th key={gi} colSpan={g.colSpan} style={{ ...thBase, background:g.bg, color:g.color, borderLeft:`1px solid ${theme.border(isDark)}`, borderRight:`1px solid ${theme.border(isDark)}` }}>
                      {g.label}
                    </th>
                  ) : (
                    <th key={gi} style={{ ...thBase, background:"transparent", border:"none" }} />
                  )
                )}
              </tr>

              {/* Linha 2: labels individuais das colunas */}
              <tr style={{ background:theme.bgInput(isDark) }}>
                {COLS.map((col) => (
                  <th key={col.key} style={{ ...thBase, borderLeft:groupBorderL(col.key), borderRight:groupBorderR(col.key), background:"transparent" }}>
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {!filteredProducts.length && (
                <tr>
                  <td colSpan={COLS.length} style={{ padding:"36px 24px", textAlign:"center", color:theme.txtMuted(isDark), fontSize:14 }}>
                    Nenhum resultado encontrado.
                  </td>
                </tr>
              )}

              {filteredProducts.map((product) => {
                const key     = rk(product.id, product.pedido_id);
                const pct     = calcProgress(product);
                const isExp   = expandedKey === key;
                const isLate  = isOverdue(product.entrega) && pct < 100;
                const fabDone = ["checklist","soldagem","premontagem"].filter((k) => product.etapas.fabricacao[k]).length;
                const rowBg   = isExp ? (isDark ? "#23263a" : "#eceef6") : isLate ? theme.redBg(isDark) : "transparent";

                return (
                  <Fragment key={key}>
                    <tr
                      onClick={() => setExpandedKey(isExp ? null : key)}
                      style={{ cursor:"pointer", borderTop:`1px solid ${theme.border(isDark)}`, background:rowBg, borderLeft:isExp ? `3px solid ${theme.accent}` : "3px solid transparent", transition:"background .15s" }}
                      onMouseEnter={(e) => { if (!isExp && !isLate) e.currentTarget.style.background = theme.bgHover(isDark); }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = rowBg; }}
                    >
                      {COLS.map((col) => (
                        <td
                          key={col.key}
                          style={{
                            ...tdBase,
                            borderLeft:groupBorderL(col.key),
                            borderRight:groupBorderR(col.key),
                            textAlign: ["pedido_id","produto","cliente"].includes(col.key) ? "left" : "center",
                            paddingLeft: ["pedido_id","produto","cliente"].includes(col.key) ? 10 : 4,
                          }}
                          onClick={col.key === "acoes" ? (e) => e.stopPropagation() : undefined}
                        >
                          {renderCell(col.key, product, pct, fabDone)}
                        </td>
                      ))}
                    </tr>

                    {/* Linha expandida de etapas */}
                    {isExp && (
                      <tr>
                        <td colSpan={COLS.length} style={{ padding:"22px 28px", borderTop:`1px solid ${theme.border(isDark)}`, background: isDark ? "#0d0f19" : "#f5f6fa" }}>
                          <p style={{ fontSize:11, fontWeight:700, color:theme.accent, textTransform:"uppercase", letterSpacing:"0.08em", margin:"0 0 16px" }}>
                            Etapas — {product.produto}
                          </p>
                          <EtapasPanel product={product} onUpdateStep={(path, value) => updateStep(product.id, product.pedido_id, path, value)} />
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

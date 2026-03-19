import { useState, useMemo, Fragment } from "react";
import { useDark } from "../../context/DarkContext";
import theme from "../../theme";
import { calcProgress, groupedProgress, groupedProgressAvg } from "../../hooks/useProgress";
import { useAllServicos } from "../../hooks/useAllServicos";
import { isOverdue } from "../../utils";
import ProgressBar from "../../components/ui/ProgressBar";
import SegmentedBar from "../../components/ui/SegmentedBar";
import StepNav from "../../components/ui/StepNav";
import { useLocalStorage } from "../../hooks/useLocalStorage";

// ─── Card de KPI ──────────────────────────────────────────────────────────────
function KpiCard({ label, value, color, sub, extra }) {
  const isDark = useDark();
  return (
    <div style={{ background: theme.bgCard(isDark), border: `1px solid ${theme.border(isDark)}`, borderRadius: 12, padding: "18px 20px" }}>
      <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", color: theme.txtSecondary(isDark), textTransform: "uppercase", margin: "0 0 8px" }}>{label}</p>
      <p style={{ fontSize: 28, fontWeight: 800, color: color || theme.txtPrimary(isDark), margin: "0 0 4px", letterSpacing: "-0.02em" }}>{value}</p>
      {sub   && <p style={{ fontSize: 11, color: theme.txtMuted(isDark), margin: 0 }}>{sub}</p>}
      {extra}
    </div>
  );
}

// ─── Mini-tabela compacta de compras do pedido ────────────────────────────────
function ComprasDosPedido({ orderId, todasCompras }) {
  const isDark = useDark();

  // Atualização de status inline
  const [compras, setCompras] = useLocalStorage("compras_lista", []);
  const updateStatus = (id, v) => setCompras((p) => p.map((r) => r.id === id ? { ...r, status: v } : r));

  const rows = todasCompras.filter((c) => {
    const pedidos = Array.isArray(c.pedidos) ? c.pedidos : [c.pedido].filter(Boolean);
    return pedidos.includes(orderId);
  });

  if (!rows.length) {
    return <p style={{ margin: 0, fontSize: 12, color: theme.txtMuted(isDark) }}>Nenhuma compra registrada para este pedido.</p>;
  }

  const thS = { fontSize: 10, fontWeight: 700, letterSpacing: "0.05em", color: theme.txtMuted(isDark), textAlign: "left", padding: "6px 10px", borderBottom: `1px solid ${theme.border(isDark)}`, whiteSpace: "nowrap" };
  const tdS = { fontSize: 11, padding: "6px 10px", borderTop: `1px solid ${theme.border(isDark)}`, verticalAlign: "middle", color: theme.txtSecondary(isDark) };

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={thS}>Categoria</th>
            <th style={thS}>Item</th>
            <th style={thS}>Qtd</th>
            <th style={thS}>Fornecedor</th>
            <th style={thS}>Previsão</th>
            <th style={thS}>Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <td style={tdS}>{row.categoria || "—"}</td>
              <td style={{ ...tdS, fontWeight: 600, color: theme.txtPrimary(isDark) }}>{row.item || "—"}</td>
              <td style={tdS}>{row.qtd || "—"}</td>
              <td style={tdS}>{row.fornecedor || "—"}</td>
              <td style={{ ...tdS, whiteSpace: "nowrap" }}>{row.previsao || "—"}</td>
              <td style={{ ...tdS, minWidth: 110 }}>
                <StepNav
                  value={row.status}
                  options={["Solicitado", "Recebido"]}
                  onChange={(v) => updateStatus(row.id, v)}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Mini-tabela compacta de serviços do pedido ───────────────────────────────
function ServicosDosPedido({ orderId, todosServicos }) {
  const isDark = useDark();

  // Atualização de status inline — lista unificada (1 hook, sem violação de Rules of Hooks)
  const [, setServicos] = useLocalStorage("servicos_lista", []);

  const rows = todosServicos.filter((s) => {
    const pedidos = Array.isArray(s.pedidos) ? s.pedidos : [s.pedido].filter(Boolean);
    return pedidos.includes(orderId);
  });

  const updateStatus = (id, v) =>
    setServicos((p) => p.map((r) => r.id === id ? { ...r, status: v } : r));

  if (!rows.length) {
    return <p style={{ margin: 0, fontSize: 12, color: theme.txtMuted(isDark) }}>Nenhum serviço em aberto para este pedido.</p>;
  }

  const thS = { fontSize: 10, fontWeight: 700, letterSpacing: "0.05em", color: theme.txtMuted(isDark), textAlign: "left", padding: "6px 10px", borderBottom: `1px solid ${theme.border(isDark)}`, whiteSpace: "nowrap" };
  const tdS = { fontSize: 11, padding: "6px 10px", borderTop: `1px solid ${theme.border(isDark)}`, verticalAlign: "middle", color: theme.txtSecondary(isDark) };

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={thS}>Fornecedor</th>
            <th style={thS}>Lote</th>
            <th style={thS}>Previsão</th>
            <th style={thS}>Drive</th>
            <th style={thS}>Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <td style={{ ...tdS, fontWeight: 700, color: theme.accent }}>{row.fornecedor || "—"}</td>
              <td style={{ ...tdS, fontWeight: 600, color: theme.txtPrimary(isDark) }}>{row.lote || "—"}</td>
              <td style={{ ...tdS, whiteSpace: "nowrap" }}>{row.previsao || "—"}</td>
              <td style={tdS}>
                {row.linkDrive
                  ? <a href={row.linkDrive} target="_blank" rel="noopener noreferrer" style={{ color: theme.accent, fontSize: 16, textDecoration: "none" }}>🔗</a>
                  : "—"}
              </td>
              <td style={{ ...tdS, minWidth: 110 }}>
                <StepNav
                  value={row.status}
                  options={["Enviado", "Recebido"]}
                  onChange={(v) => updateStatus(row.id, v)}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Linha expandida com mini-tabs ────────────────────────────────────────────
function OrderExpandedRow({ order, now, todasCompras, todosServicos }) {
  const isDark = useDark();
  const [miniTab, setMiniTab] = useState("producao");

  const comprasCount  = todasCompras.filter((c) => {
    const pedidos = Array.isArray(c.pedidos) ? c.pedidos : [c.pedido].filter(Boolean);
    return pedidos.includes(order.id) && c.status !== "Recebido";
  }).length;

  const servicosCount = todosServicos.filter((s) => {
    const pedidos = Array.isArray(s.pedidos) ? s.pedidos : [s.pedido].filter(Boolean);
    return pedidos.includes(order.id) && s.status !== "Recebido";
  }).length;

  const miniTabBtn = (key, label, count) => {
    const active = miniTab === key;
    return (
      <button
        onClick={(e) => { e.stopPropagation(); setMiniTab(key); }}
        style={{
          padding: "4px 12px", fontSize: 11, fontWeight: 700, borderRadius: 6,
          border: `1px solid ${active ? theme.accent : theme.border(isDark)}`,
          background: active ? theme.accent : "transparent",
          color: active ? "#fff" : theme.txtSecondary(isDark),
          cursor: "pointer", display: "flex", alignItems: "center", gap: 5,
        }}
      >
        {label}
        {count > 0 && (
          <span style={{
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            minWidth: 16, height: 16, borderRadius: 8, padding: "0 4px",
            background: active ? "rgba(255,255,255,0.25)" : theme.orange,
            color: "#fff", fontSize: 9, fontWeight: 800,
          }}>
            {count}
          </span>
        )}
      </button>
    );
  };

  return (
    <tr>
      <td colSpan={8} style={{ padding: 0, borderTop: `1px solid ${theme.border(isDark)}`, background: isDark ? "#0d0f19" : "#f3f4f8" }}>
        <div style={{ padding: "16px 20px" }}>
          {/* Mini-tabs */}
          <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
            {miniTabBtn("producao", "Produção", 0)}
            {miniTabBtn("compras",  "Compras",  comprasCount)}
            {miniTabBtn("servicos", "Serviços", servicosCount)}
          </div>

          {/* Produção (produtos do pedido) */}
          {miniTab === "producao" && (
            <>
              <p style={{ margin: "0 0 12px", fontSize: 11, fontWeight: 700, letterSpacing: "0.07em", color: theme.accent, textTransform: "uppercase" }}>
                Produtos — {order.id}
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {order.produtos.map((product) => {
                  const pct    = calcProgress({ ...product, entrega: order.entrega });
                  const groups = order._groups?.[product.id] ?? [];
                  const late   = isOverdue(order.entrega) && pct < 100;
                  return (
                    <div
                      key={product.id}
                      style={{ background: theme.bgCard(isDark), border: `1px solid ${late ? theme.red + "44" : theme.border(isDark)}`, borderRadius: 10, padding: "12px 16px", display: "flex", alignItems: "center", gap: 16 }}
                    >
                      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 5, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                          <span style={{ fontWeight: 700, fontSize: 13, color: theme.txtPrimary(isDark) }}>{product.produto}</span>
                          {product.codigo && <span style={{ fontSize: 10, color: theme.txtMuted(isDark), fontFamily: "monospace" }}>{product.codigo}</span>}
                          {late && <span style={{ fontSize: 10, fontWeight: 700, color: theme.red }}>⚠ Atrasado</span>}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                          <span style={{ fontSize: 11, color: theme.txtSecondary(isDark) }}>Qtd: <strong style={{ color: theme.txtPrimary(isDark) }}>{product.qtd} un</strong></span>
                          {(product.larg || product.prof || product.alt) && (
                            <span style={{ fontSize: 11, color: theme.txtMuted(isDark), fontFamily: "monospace" }}>{product.larg}×{product.prof}×{product.alt} mm</span>
                          )}
                          <span style={{ fontSize: 11, color: theme.txtSecondary(isDark) }}>
                            Aço: <strong style={{ color: theme.txtPrimary(isDark) }}>{product.aco === "Personalizado" ? product.aco_custom || "Custom" : product.aco}</strong>
                          </span>
                          {product.madeira_cfg && product.madeira_cfg !== "N/A" && product.madeira_items?.length > 0 && (
                            <span style={{ fontSize: 11, color: theme.txtSecondary(isDark) }}>Madeira: <strong style={{ color: theme.txtPrimary(isDark) }}>{product.madeira_items.map((m) => m.mp).join(", ")}</strong></span>
                          )}
                          {product.couro && product.couro !== "N/A" && (
                            <span style={{ fontSize: 11, color: theme.txtSecondary(isDark) }}>Couro: <strong style={{ color: theme.txtPrimary(isDark) }}>{product.couro}</strong></span>
                          )}
                          <span style={{ fontSize: 11, color: theme.txtSecondary(isDark) }}>
                            Elétrica: <strong style={{ color: product.eletrica_cfg === "Sim" ? theme.accent : theme.txtMuted(isDark) }}>{product.eletrica_cfg === "Sim" ? "Sim" : "Não"}</strong>
                          </span>
                        </div>
                      </div>
                      <div style={{ width: "50%", flexShrink: 0 }}>
                        <SegmentedBar groups={groups} />
                        <div style={{ marginTop: 6 }}><ProgressBar pct={pct} /></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* Compras */}
          {miniTab === "compras" && (
            <ComprasDosPedido orderId={order.id} todasCompras={todasCompras} />
          )}

          {/* Serviços */}
          {miniTab === "servicos" && (
            <ServicosDosPedido orderId={order.id} todosServicos={todosServicos} />
          )}
        </div>
      </td>
    </tr>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function Dashboard({ orders, terc, compras }) {
  const isDark = useDark();
  const [clientFilter, setClientFilter] = useState("Todos");
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const { todosServicos, todasCompras } = useAllServicos();

  const now = useMemo(() => new Date(), []);

  const clients = useMemo(
    () => ["Todos", ...Array.from(new Set(orders.map((o) => o.cliente)))],
    [orders]
  );

  const filteredOrders = useMemo(
    () => (clientFilter === "Todos" ? orders : orders.filter((o) => o.cliente === clientFilter)),
    [orders, clientFilter]
  );

  const allProducts = useMemo(
    () => filteredOrders.flatMap((o) => o.produtos.map((p) => ({ ...p, pedido_id: o.id, entrega: o.entrega, cliente: o.cliente }))),
    [filteredOrders]
  );

  const kpis = useMemo(() => {
    const totalUnits   = allProducts.reduce((acc, p) => acc + p.qtd, 0);
    const inProgress   = allProducts.filter((p) => calcProgress(p) < 100).length;
    const overdue      = allProducts.filter((p) => isOverdue(p.entrega) && calcProgress(p) < 100).length;
    const onTime       = allProducts.filter((p) => !isOverdue(p.entrega) && calcProgress(p) < 100).length;
    const avgProgress  = allProducts.length
      ? Math.round(allProducts.reduce((acc, p) => acc + calcProgress(p), 0) / allProducts.length)
      : 0;
    // Novos KPIs: usa dados do hook useAllServicos
    const servicosAbertos = todosServicos.filter((s) => s.status !== "Recebido").length;
    const comprasAbertas  = todasCompras.filter((c) => c.status !== "Recebido").length;
    // Compatibilidade legada com terc
    const tercOpen     = terc?.filter((t) => t.status !== "Recebido").length ?? 0;
    return { totalUnits, inProgress, overdue, onTime, avgProgress, servicosAbertos, comprasAbertas, tercOpen };
  }, [allProducts, todosServicos, todasCompras, terc]);

  const enrichedOrders = useMemo(() =>
    filteredOrders.map((order) => {
      const products = order.produtos.map((p) => ({ ...p, entrega: order.entrega }));
      const avgPct = products.length
        ? Math.round(products.reduce((acc, p) => acc + calcProgress(p), 0) / products.length)
        : 0;
      const totalUnits = products.reduce((acc, p) => acc + p.qtd, 0);
      const isLate = isOverdue(order.entrega) && avgPct < 100;
      const isDone = avgPct === 100;
      const groupAvg = groupedProgressAvg(products);
      const groupsByProduct = {};
      products.forEach((p) => { groupsByProduct[p.id] = groupedProgress(p); });
      return { ...order, avgPct, totalUnits, isLate, isDone, groupAvg, _groups: groupsByProduct };
    }),
    [filteredOrders]
  );

  const thStyle = { padding: "10px 14px", fontSize: 11, fontWeight: 700, letterSpacing: "0.05em", color: theme.txtSecondary(isDark), textAlign: "left", borderBottom: `1px solid ${theme.border(isDark)}`, background: theme.bgInput(isDark), whiteSpace: "nowrap" };
  const tdStyle = { padding: "12px 14px", fontSize: 12, verticalAlign: "middle" };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Cabeçalho */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: theme.txtPrimary(isDark), margin: 0 }}>Dashboard</h2>
        <select
          value={clientFilter}
          onChange={(e) => setClientFilter(e.target.value)}
          style={{ background: theme.bgCard(isDark), color: theme.txtPrimary(isDark), border: `1px solid ${theme.border(isDark)}`, borderRadius: 8, padding: "6px 12px", fontSize: 12, fontWeight: 600, outline: "none", cursor: "pointer" }}
        >
          {clients.map((c) => <option key={c}>{c}</option>)}
        </select>
      </div>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 12 }}>
        <KpiCard label="Total de Pedidos"       value={filteredOrders.length} sub={`${allProducts.length} produtos`} />
        <KpiCard label="Unidades em Fabricação" value={kpis.totalUnits} color={theme.accent} sub={`${allProducts.length} SKUs ativos`} />
        <KpiCard label="Progresso Médio"        value={`${kpis.avgProgress}%`} color={theme.blue} extra={<div style={{ marginTop: 8 }}><ProgressBar pct={kpis.avgProgress} /></div>} />
        <KpiCard
          label="Serv. Terc. Abertos"
          value={kpis.servicosAbertos}
          color={theme.orange}
          extra={
            <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 3 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11 }}>
                <span style={{ color: theme.txtMuted(isDark) }}>Compras pendentes</span>
                <span style={{ color: theme.amber, fontWeight: 700 }}>{kpis.comprasAbertas}</span>
              </div>
            </div>
          }
        />
        <KpiCard label="Em Andamento" value={kpis.inProgress} color={theme.blue}  sub="produtos" />
        <KpiCard label="No Prazo"     value={kpis.onTime}     color={theme.green} sub="produtos" />
        <KpiCard label="Atrasados"    value={kpis.overdue}    color={theme.red}   sub="produtos" />
      </div>

      {/* Tabela de pedidos com expand */}
      <div style={{ background: theme.bgCard(isDark), border: `1px solid ${theme.border(isDark)}`, borderRadius: 12, overflow: "hidden" }}>
        <div style={{ padding: "14px 18px", borderBottom: `1px solid ${theme.border(isDark)}`, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: theme.txtPrimary(isDark) }}>Progresso por Pedido</p>
          <span style={{ fontSize: 11, color: theme.txtMuted(isDark) }}>{filteredOrders.length} pedido{filteredOrders.length !== 1 ? "s" : ""}</span>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 500 }}>
            <thead>
              <tr>
                {["", "Pedido", "Cliente", "Entrega", "Produtos", "Unidades", "Progresso Médio", "Status"].map((h) => (
                  <th key={h} style={thStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {enrichedOrders.map((order) => {
                const isExpanded = expandedOrderId === order.id;
                const { isLate, isDone, avgPct, totalUnits, groupAvg } = order;

                const statusLabel = isDone ? "Concluído" : isLate ? "Atrasado" : "Em Andamento";
                const statusColor = isDone ? theme.green : isLate ? theme.red : theme.blue;
                const statusBg    = isDone ? theme.greenBg(isDark) : isLate ? theme.redBg(isDark) : theme.blueBg(isDark);
                const rowBg       = isExpanded ? (isDark ? "#1e2130" : "#eef0f8") : isLate ? theme.redBg(isDark) : "transparent";

                return (
                  <Fragment key={order.id}>
                    <tr
                      onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                      style={{ cursor: "pointer", borderTop: `1px solid ${theme.border(isDark)}`, background: rowBg, borderLeft: isExpanded ? `3px solid ${theme.accent}` : "3px solid transparent", transition: "background .15s" }}
                      onMouseEnter={(e) => { if (!isExpanded && !isLate) e.currentTarget.style.background = theme.bgHover(isDark); }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = rowBg; }}
                    >
                      <td style={{ ...tdStyle, width: 32, textAlign: "center", color: theme.txtMuted(isDark), fontSize: 11 }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ transition: "transform .2s", transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)" }}>
                          <polyline points="9 18 15 12 9 6" />
                        </svg>
                      </td>
                      <td style={tdStyle}><span style={{ fontFamily: "monospace", fontWeight: 700, color: theme.txtPrimary(isDark) }}>{order.id}</span></td>
                      <td style={{ ...tdStyle, color: theme.txtSecondary(isDark) }}>{order.cliente}</td>
                      <td style={{ ...tdStyle, whiteSpace: "nowrap", color: isLate && !isDone ? theme.red : theme.txtSecondary(isDark), fontWeight: isLate && !isDone ? 700 : 400 }}>
                        {order.entrega}{isLate && !isDone && <span style={{ marginLeft: 4 }}>⚠</span>}
                      </td>
                      <td style={{ ...tdStyle, textAlign: "center", fontWeight: 600, color: theme.txtPrimary(isDark) }}>{order.produtos.length}</td>
                      <td style={{ ...tdStyle, textAlign: "center", fontWeight: 700, color: theme.accent }}>{totalUnits}</td>
                      <td style={{ ...tdStyle, minWidth: 220 }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                          <ProgressBar pct={avgPct} />
                          <SegmentedBar groups={groupAvg} />
                        </div>
                      </td>
                      <td style={tdStyle}>
                        <span style={{ display: "inline-block", padding: "3px 10px", borderRadius: 99, fontSize: 11, fontWeight: 700, background: statusBg, color: statusColor }}>
                          {statusLabel}
                        </span>
                      </td>
                    </tr>
                    {isExpanded && (
                      <OrderExpandedRow
                        order={order}
                        now={now}
                        todasCompras={todasCompras}
                        todosServicos={todosServicos}
                      />
                    )}
                  </Fragment>
                );
              })}
              {!enrichedOrders.length && (
                <tr><td colSpan={8} style={{ padding: 24, textAlign: "center", color: theme.txtMuted(isDark), fontSize: 13 }}>Nenhum pedido encontrado.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

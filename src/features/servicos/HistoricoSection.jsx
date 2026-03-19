// ─── HistoricoSection.jsx ─────────────────────────────────────────────────────
// tipo: "servicos" | "compras"
import { useDark } from "../../context/DarkContext";
import { useLocalStorage } from "../../hooks/useLocalStorage";
import theme from "../../theme";
import TrashButton from "../../components/ui/TrashButton";
import { joinArr, getRowItens, EstoqueBadge } from "./servicos.utils";

export function HistoricoSection({ tipo }) {
  const isDark = useDark();
  const [servRows, setServRows] = useLocalStorage("servicos_lista", []);
  const [compRows, setCompRows] = useLocalStorage("compras_lista", []);

  const hist = tipo === "servicos"
    ? servRows.filter((r) => r.status === "Recebido")
    : compRows.filter((r) => r.status === "Recebido");

  const reativar = (id) => {
    if (tipo === "servicos") {
      setServRows((p) => p.map((r) => r.id === id ? { ...r, status: "Enviado",    receivedAt: undefined } : r));
    } else {
      setCompRows((p) => p.map((r) => r.id === id ? { ...r, status: "Solicitado", receivedAt: undefined } : r));
    }
  };

  const excluir = (id) => {
    if (tipo === "servicos") setServRows((p) => p.filter((r) => r.id !== id));
    else                     setCompRows((p) => p.filter((r) => r.id !== id));
  };

  const thStyle = {
    padding: "10px 14px", fontSize: 11, fontWeight: 700, letterSpacing: "0.05em",
    color: theme.txtSecondary(isDark), textAlign: "left",
    borderBottom: `1px solid ${theme.border(isDark)}`,
    background: theme.bgInput(isDark), whiteSpace: "nowrap",
  };
  const tdStyle = {
    padding: "10px 14px", fontSize: 12, color: theme.txtSecondary(isDark),
    borderTop: `1px solid ${theme.border(isDark)}`, verticalAlign: "middle",
  };
  const reativarBtnStyle = {
    fontSize: 13, background: "none", border: "none", cursor: "pointer",
    padding: "2px 4px", borderRadius: 4,
  };

  return (
    <div style={{ background: theme.bgCard(isDark), border: `1px solid ${theme.border(isDark)}`, borderRadius: 12, overflow: "hidden" }}>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: tipo === "servicos" ? 620 : 560 }}>
          <thead>
            <tr>
              <th style={thStyle}>Recebido em</th>
              {tipo === "servicos" ? (
                <>
                  <th style={thStyle}>Pedido(s)</th>
                  <th style={thStyle}>Lote</th>
                  <th style={thStyle}>Fornecedor</th>
                  <th style={thStyle}>Orçamento</th>
                </>
              ) : (
                <>
                  <th style={thStyle}>Pedido / Estoque</th>
                  <th style={thStyle}>Itens</th>
                  <th style={thStyle}>Fornecedor</th>
                </>
              )}
              <th style={{ ...thStyle, width: 80 }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {hist.map((row) => {
              const itens = tipo === "compras" ? getRowItens(row) : null;
              return (
                <tr
                  key={row.id}
                  onMouseEnter={(e) => (e.currentTarget.style.background = theme.bgHover(isDark))}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <td style={{ ...tdStyle, fontFamily: "monospace", fontSize: 11, color: theme.green, fontWeight: 700 }}>
                    {row.receivedAt ?? "—"}
                  </td>

                  {tipo === "servicos" ? (
                    <>
                      <td style={tdStyle}>
                        <span style={{ fontFamily: "monospace", fontWeight: 700, color: theme.accent }}>
                          {joinArr(row.pedidos)}
                        </span>
                      </td>
                      <td style={{ ...tdStyle, fontWeight: 600, color: theme.txtPrimary(isDark) }}>{row.lote || "—"}</td>
                      <td style={tdStyle}>{row.fornecedor || "—"}</td>
                      <td style={{ ...tdStyle, fontFamily: "monospace", fontSize: 11 }}>{row.orcamento || "—"}</td>
                    </>
                  ) : (
                    <>
                      <td style={tdStyle}>
                        {row.estoque || !row.pedidos?.length ? (
                          <EstoqueBadge />
                        ) : (
                          <span style={{ fontFamily: "monospace", fontWeight: 700, color: theme.accent, whiteSpace: "nowrap" }}>
                            {joinArr(row.pedidos)}
                          </span>
                        )}
                      </td>
                      <td style={{ ...tdStyle, verticalAlign: "top" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                          {itens.map((it) => (
                            <div key={it.id} style={{ display: "flex", alignItems: "center", gap: 6, lineHeight: 1 }}>
                              {it.categoria && (
                                <span style={{ fontSize: 10, fontWeight: 700, color: theme.accent, background: `${theme.accent}15`, padding: "1px 6px", borderRadius: 99, whiteSpace: "nowrap" }}>
                                  {it.categoria}
                                </span>
                              )}
                              <span style={{ fontWeight: 600, color: theme.txtPrimary(isDark) }}>{it.item}</span>
                              <span style={{ fontSize: 11, color: theme.txtMuted(isDark), whiteSpace: "nowrap" }}>× {it.qtd}</span>
                            </div>
                          ))}
                          {!itens.length && <span style={{ color: theme.txtMuted(isDark) }}>—</span>}
                        </div>
                      </td>
                      <td style={tdStyle}>{row.fornecedor || "—"}</td>
                    </>
                  )}

                  <td style={tdStyle}>
                    <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                      <button title="Reativar" onClick={() => reativar(row.id)} style={reativarBtnStyle}>🔄</button>
                      <TrashButton onClick={() => excluir(row.id)} />
                    </div>
                  </td>
                </tr>
              );
            })}
            {!hist.length && (
              <tr>
                <td colSpan={tipo === "servicos" ? 6 : 5} style={{ padding: 28, textAlign: "center", color: theme.txtMuted(isDark), fontSize: 13 }}>
                  {tipo === "servicos" ? "Nenhum serviço finalizado ainda." : "Nenhuma compra finalizada ainda."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

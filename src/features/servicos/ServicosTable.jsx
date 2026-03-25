// ─── ServicosTable.jsx ────────────────────────────────────────────────────────
// ServicosTable: tabela de serviços em aberto com filtros e checklist.
// ServicoSection: navegação por abas (Serviços | ⚙ Fornecedores | 📋 Histórico).
// Estado de rows levantado para ServicoSection → API via tercService.
import { useState, useMemo, useEffect } from "react";
import { useDark } from "../../context/DarkContext";
import { useLocalStorage } from "../../hooks/useLocalStorage";
import theme from "../../theme";
import { today } from "../../utils";
import StepNav from "../../components/ui/StepNav";
import TrashButton from "../../components/ui/TrashButton";
import { DEFAULT_FORNECEDORES, DEFAULT_SHEETS_URL, joinArr, parseSheetsUrl } from "./servicos.utils";
import { ServiceModal, ConferenciaModal, FornecedoresConfig } from "./ServicosModais";
import { HistoricoSection } from "./HistoricoSection";
import { tercService } from "../../services/terc";

// ─── ServicosTable ────────────────────────────────────────────────────────────
// Recebe rows e handlers do pai (ServicoSection) — sem estado local de rows.
function ServicosTable({ orders, fornecedores, sheetsUrl, rows, addRow, deleteRow, updateStatus, updateRow }) {
  const isDark = useDark();
  const [showModal, setShowModal]           = useState(false);
  const [conferenciaRow, setConferenciaRow] = useState(null);

  // Filtros
  const [fPedido,     setFPedido]     = useState("");
  const [fProduto,    setFProduto]    = useState("");
  const [fLote,       setFLote]       = useState("");
  const [fFornecedor, setFFornecedor] = useState("");
  const hasFilter = fPedido || fProduto || fLote || fFornecedor;

  const openRows = useMemo(() => rows.filter((r) => r.status !== "Recebido"), [rows]);

  const filtered = useMemo(() => openRows.filter((r) => {
    if (fPedido     && !r.pedidos?.some((p) => p.toLowerCase().includes(fPedido.toLowerCase()))) return false;
    if (fProduto    && !r.codigos?.some((c) => c.toLowerCase().includes(fProduto.toLowerCase()))) return false;
    if (fLote       && !r.lote?.toLowerCase().includes(fLote.toLowerCase())) return false;
    if (fFornecedor && r.fornecedor !== fFornecedor) return false;
    return true;
  }), [openRows, fPedido, fProduto, fLote, fFornecedor]);

  // Qualquer fornecedor com sheetGid configurado pode abrir conferência
  const temPlanilha = (row) => {
    const forn = fornecedores.find((f) => f.nome === row.fornecedor);
    return !!forn?.sheetGid;
  };

  const filterInput = {
    padding: "6px 10px", fontSize: 12, borderRadius: 8,
    background: theme.bgInput(isDark), border: `1px solid ${theme.border(isDark)}`,
    color: theme.txtPrimary(isDark), outline: "none", minWidth: 120,
  };
  const thStyle = { padding: "10px 14px", fontSize: 11, fontWeight: 700, letterSpacing: "0.05em", color: theme.txtSecondary(isDark), textAlign: "left", borderBottom: `1px solid ${theme.border(isDark)}`, background: theme.bgInput(isDark), whiteSpace: "nowrap" };
  const tdStyle = { padding: "10px 14px", fontSize: 12, color: theme.txtSecondary(isDark), borderTop: `1px solid ${theme.border(isDark)}`, verticalAlign: "middle" };

  return (
    <>
      {showModal && (
        <ServiceModal orders={orders} fornecedores={fornecedores} onClose={() => setShowModal(false)} onSave={addRow} />
      )}
      {conferenciaRow && (
        <ConferenciaModal
          row={conferenciaRow}
          sheetsUrl={sheetsUrl}
          sheetGid={fornecedores.find((f) => f.nome === conferenciaRow.fornecedor)?.sheetGid || ""}
          onUpdate={(patch) => { updateRow(conferenciaRow.id, patch); setConferenciaRow((r) => ({ ...r, ...patch })); }}
          onClose={() => setConferenciaRow(null)}
        />
      )}

      {/* Barra de filtros */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginBottom: 4 }}>
        <input style={filterInput} placeholder="🔍 Pedido..." value={fPedido} onChange={(e) => setFPedido(e.target.value)} />
        <input style={filterInput} placeholder="🔍 Produto / Cód..." value={fProduto} onChange={(e) => setFProduto(e.target.value)} />
        <input style={filterInput} placeholder="🔍 Lote..." value={fLote} onChange={(e) => setFLote(e.target.value)} />
        <select style={{ ...filterInput, cursor: "pointer" }} value={fFornecedor} onChange={(e) => setFFornecedor(e.target.value)}>
          <option value="">Todos os fornecedores</option>
          {fornecedores.map((f) => <option key={f.id} value={f.nome}>{f.nome}</option>)}
        </select>
        {hasFilter && (
          <button onClick={() => { setFPedido(""); setFProduto(""); setFLote(""); setFFornecedor(""); }}
            style={{ fontSize: 11, color: theme.txtMuted(isDark), background: "none", border: "none", cursor: "pointer", padding: "4px 8px" }}>
            ✕ Limpar
          </button>
        )}
        {hasFilter && <span style={{ fontSize: 11, color: theme.txtMuted(isDark) }}>{filtered.length} de {openRows.length} em aberto</span>}
      </div>

      {/* Tabela */}
      <div style={{ background: theme.bgCard(isDark), border: `1px solid ${theme.border(isDark)}`, borderRadius: 12, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 740 }}>
            <thead>
              <tr>
                <th style={thStyle}>Pedido(s)</th>
                <th style={thStyle}>Cód.</th>
                <th style={thStyle}>Lote</th>
                <th style={thStyle}>Fornecedor</th>
                <th style={thStyle}>Orçamento</th>
                <th style={thStyle}>Criado</th>
                <th style={thStyle}>Previsão</th>
                <th style={thStyle}>Drive</th>
                <th style={thStyle}>Status</th>
                <th style={{ ...thStyle, width: 48 }}>Conf.</th>
                <th style={{ ...thStyle, width: 36 }}></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => (
                <tr key={row.id}
                  style={{ background: "transparent" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = theme.bgHover(isDark))}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <td style={tdStyle}><span style={{ fontFamily: "monospace", fontWeight: 700, color: theme.accent }}>{joinArr(row.pedidos)}</span></td>
                  <td style={tdStyle}><span style={{ fontFamily: "monospace", fontSize: 11, color: theme.txtPrimary(isDark) }}>{Array.isArray(row.codigos) ? row.codigos.map((v) => v.split("/")[1] || v).join(", ") || "—" : row.codigos || "—"}</span></td>
                  <td style={{ ...tdStyle, fontWeight: 600, color: theme.txtPrimary(isDark) }}>{row.lote || "—"}</td>
                  <td style={tdStyle}>{row.fornecedor || "—"}</td>
                  <td style={{ ...tdStyle, fontFamily: "monospace", fontSize: 11 }}>{row.orcamento || "—"}</td>
                  <td style={{ ...tdStyle, whiteSpace: "nowrap", fontSize: 11, color: theme.txtMuted(isDark) }}>{row.createdAt || row.created_at?.slice(0, 10) || "—"}</td>
                  <td style={{ ...tdStyle, whiteSpace: "nowrap" }}>{row.previsao || "—"}</td>
                  <td style={tdStyle}>
                    {row.linkDrive
                      ? <a href={row.linkDrive} target="_blank" rel="noopener noreferrer" title={row.linkDrive} style={{ color: theme.accent, fontSize: 18, textDecoration: "none" }}>🔗</a>
                      : <span style={{ color: theme.txtMuted(isDark) }}>—</span>}
                  </td>
                  <td style={{ ...tdStyle, minWidth: 120 }}>
                    <StepNav value={row.status} options={["Enviado", "Recebido"]} onChange={(v) => updateStatus(row.id, v)} />
                  </td>
                  <td style={tdStyle}>
                    {temPlanilha(row) ? (
                      <button
                        onClick={() => setConferenciaRow(row)}
                        title="Gerar conferência de recebimento"
                        style={{ background: "none", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 17, padding: "2px 4px" }}>
                        📥
                      </button>
                    ) : (
                      <span style={{ color: theme.txtMuted(isDark), fontSize: 13, padding: "2px 4px" }}>—</span>
                    )}
                  </td>
                  <td style={tdStyle}><TrashButton onClick={() => deleteRow(row.id)} /></td>
                </tr>
              ))}
              {!filtered.length && (
                <tr>
                  <td colSpan={11} style={{ padding: 28, textAlign: "center", color: theme.txtMuted(isDark), fontSize: 13 }}>
                    {openRows.length ? "Nenhum serviço encontrado com os filtros aplicados." : "Nenhum serviço em aberto."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div style={{ padding: "10px 14px", borderTop: `1px solid ${theme.border(isDark)}` }}>
          <button onClick={() => setShowModal(true)} style={{ fontSize: 12, fontWeight: 600, color: theme.accent, background: "none", border: "none", cursor: "pointer", padding: 0 }}>
            + Novo serviço
          </button>
        </div>
      </div>
    </>
  );
}

// ─── ServicoSection ───────────────────────────────────────────────────────────
// 3 abas: [Serviços | ⚙ Fornecedores | 📋 Histórico]
// Estado de rows gerenciado aqui via tercService (API).
export function ServicoSection({ orders }) {
  const isDark = useDark();
  const [activeTab, setActiveTab]       = useState("servicos");
  const [fornecedores, setFornecedores] = useLocalStorage("config_fornecedores_servicos", DEFAULT_FORNECEDORES);
  const [sheetsUrl, setSheetsUrl]       = useLocalStorage("config_sheets_url", DEFAULT_SHEETS_URL);
  const [gasUrl, setGasUrl]             = useLocalStorage("config_gas_url", "");

  // ─── Estado de rows via API ─────────────────────────────────────────────────
  const [rows, setRows]     = useState([]);
  const [loadingTerc, setLoadingTerc] = useState(true);

  useEffect(() => {
    tercService.list()
      .then(setRows).catch(() => {}).finally(() => setLoadingTerc(false));
  }, []);

  const addRow = async (row) => {
    try {
      const created = await tercService.create(row);
      setRows((p) => [created, ...p]);
    } catch {}
  };

  const deleteRow = async (id) => {
    try {
      await tercService.remove(id);
      setRows((p) => p.filter((r) => r.id !== id));
    } catch {}
  };

  const updateStatus = async (id, v) => {
    try {
      const patch = { status: v, ...(v === "Recebido" ? { received_at: today() } : {}) };
      const updated = await tercService.update(id, patch);
      setRows((p) => p.map((r) => r.id === id ? updated : r));
    } catch {}
  };

  const updateRow = async (id, patch) => {
    try {
      const updated = await tercService.update(id, patch);
      setRows((p) => p.map((r) => r.id === id ? updated : r));
    } catch {}
  };

  const reativarServ = async (id) => {
    await updateStatus(id, "Enviado");
  };

  // ─── Migração de fornecedores ───────────────────────────────────────────────
  const fornecedoresNorm = useMemo(() => {
    if (!fornecedores.length) return [];
    if (typeof fornecedores[0] === "string") {
      return fornecedores.map((nome, i) => ({ id: `migrated-${i}`, nome, endereco: "", prazoMedio: 7, contato: "", email: "" }));
    }
    return fornecedores;
  }, [fornecedores]);

  useEffect(() => {
    const { isPublished } = parseSheetsUrl(sheetsUrl);
    if (!sheetsUrl || !isPublished) setSheetsUrl(DEFAULT_SHEETS_URL);

    const isGidInvalid = (gid) => !gid || !/^\d+$/.test(String(gid).trim());
    const needsGid = fornecedoresNorm.some((f) => {
      const def = DEFAULT_FORNECEDORES.find((d) => d.nome === f.nome);
      return def?.sheetGid && isGidInvalid(f.sheetGid);
    });
    if (needsGid) {
      setFornecedores(fornecedoresNorm.map((f) => {
        const def = DEFAULT_FORNECEDORES.find((d) => d.nome === f.nome);
        return def?.sheetGid && isGidInvalid(f.sheetGid) ? { ...f, sheetGid: def.sheetGid } : f;
      }));
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const tabBtnStyle = (active) => ({
    padding: "6px 14px", fontSize: 12, fontWeight: 600, borderRadius: 8,
    border: `1px solid ${active ? theme.accent : theme.border(isDark)}`,
    background: active ? theme.accent : "transparent",
    color: active ? "#fff" : theme.txtSecondary(isDark),
    cursor: "pointer", transition: "all .15s",
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", gap: 6 }}>
        <button onClick={() => setActiveTab("servicos")}     style={tabBtnStyle(activeTab === "servicos")}>Serviços</button>
        <button onClick={() => setActiveTab("fornecedores")} style={tabBtnStyle(activeTab === "fornecedores")}>⚙ Fornecedores</button>
        <button onClick={() => setActiveTab("historico")}    style={tabBtnStyle(activeTab === "historico")}>📋 Histórico</button>
      </div>
      {activeTab === "servicos" && (
        loadingTerc
          ? <div style={{ fontSize: 13, color: theme.txtMuted(isDark), padding: "20px 0" }}>Carregando serviços…</div>
          : <ServicosTable
              orders={orders}
              fornecedores={fornecedoresNorm}
              sheetsUrl={sheetsUrl}
              rows={rows}
              addRow={addRow}
              deleteRow={deleteRow}
              updateStatus={updateStatus}
              updateRow={updateRow}
            />
      )}
      {activeTab === "fornecedores" && (
        <FornecedoresConfig fornecedores={fornecedoresNorm} setFornecedores={setFornecedores} gasUrl={gasUrl} />
      )}
      {activeTab === "historico" && (
        <HistoricoSection
          tipo="servicos"
          servRows={rows}
          onReativarServ={reativarServ}
          onExcluirServ={deleteRow}
        />
      )}
    </div>
  );
}

// ─── ComprasSection.jsx ───────────────────────────────────────────────────────
// CategoriaCard, CategoriaModal, CategoriasConfig, ComprasList, ComprasSection.
import { useState, useEffect, useMemo } from "react";
import { useDark } from "../../context/DarkContext";
import { useLocalStorage } from "../../hooks/useLocalStorage";
import theme from "../../theme";
import { generateId, today } from "../../utils";
import Modal from "../../components/ui/Modal";
import DInput from "../../components/ui/DInput";
import StepNav from "../../components/ui/StepNav";
import { FieldLabel } from "../../components/ui/Labels";
import TrashButton from "../../components/ui/TrashButton";
import { DEFAULT_CATEGORIAS, nameToColor, getInitials, AddCard, joinArr, SectionLabel, getRowItens, EstoqueBadge } from "./servicos.utils";
import { ComprasModal } from "./ComprasModal";
import { HistoricoSection } from "./HistoricoSection";
import { comprasService } from "../../services/compras";
import { estoqueService } from "../../services/estoque";

// ─── CategoriaCard ────────────────────────────────────────────────────────────
function CategoriaCard({ cat, onClick }) {
  const isDark = useDark();
  const [hov, setHov] = useState(false);
  const color = nameToColor(cat.nome);
  const initials = getInitials(cat.nome);
  return (
    <div onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ width: 128, height: 148, borderRadius: 12, cursor: "pointer", flexShrink: 0, background: theme.bgCard(isDark), border: `1px solid ${hov ? color : theme.border(isDark)}`, boxShadow: hov ? `0 4px 14px ${color}40` : "none", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 7, padding: "12px 8px", position: "relative", transition: "all .15s", userSelect: "none" }}>
      <span style={{ position: "absolute", top: 7, right: 9, fontSize: 13, color: hov ? color : theme.txtMuted(isDark), transition: "color .15s" }}>✏</span>
      <div style={{ position: "absolute", top: 7, left: 9, display: "flex", gap: 3 }}>
        {cat.link        && <span title="Tem link"      style={{ fontSize: 11 }}>🔗</span>}
        {cat.contato     && <span title="Tem contato"   style={{ fontSize: 11 }}>📞</span>}
        {cat.fornecedorNome && <span title={cat.fornecedorNome} style={{ fontSize: 11 }}>🏭</span>}
      </div>
      <div style={{ width: 62, height: 62, borderRadius: 10, background: color, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 21, fontWeight: 700, color: "#fff" }}>{initials}</div>
      <span style={{ fontSize: 12, fontWeight: 700, color: theme.txtPrimary(isDark), textAlign: "center", lineHeight: 1.3, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{cat.nome}</span>
      <span style={{ fontSize: 10, color: theme.txtMuted(isDark) }}>{cat.itens.length} {cat.itens.length === 1 ? "item" : "itens"}</span>
    </div>
  );
}

// ─── CategoriaModal ───────────────────────────────────────────────────────────
function CategoriaModal({ cat, onSave, onDelete, onClose }) {
  const isDark = useDark();
  const isNew = !cat;

  const [form, setForm] = useState({
    nome:           cat?.nome           ?? "",
    itens:          cat?.itens          ? [...cat.itens] : [],
    newItem:        "",
    fornecedorNome: cat?.fornecedorNome ?? "",
    endereco:       cat?.endereco       ?? "",
    contato:        cat?.contato        ?? "",
    email:          cat?.email          ?? "",
    link:           cat?.link           ?? "",
  });
  const setF = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const addItem = () => {
    const v = form.newItem.trim();
    if (!v || form.itens.includes(v)) return;
    setForm((p) => ({ ...p, itens: [...p.itens, v], newItem: "" }));
  };
  const removeItem = (item) => setF("itens", form.itens.filter((i) => i !== item));

  const handleSave = () => {
    if (!form.nome.trim()) return;
    onSave({
      id: cat?.id || generateId(),
      nome:           form.nome.trim(),
      itens:          form.itens,
      fornecedorNome: form.fornecedorNome.trim(),
      endereco:       form.endereco.trim(),
      contato:        form.contato.trim(),
      email:          form.email.trim(),
      link:           form.link.trim(),
    });
    onClose();
  };

  const color = nameToColor(form.nome);
  const btnBase = { padding: "8px 18px", fontSize: 13, fontWeight: 600, borderRadius: 8, cursor: "pointer" };
  const sep = { borderTop: `1px solid ${theme.border(isDark)}`, margin: "14px 0" };

  return (
    <Modal title={isNew ? "Nova Categoria" : "Editar Categoria"} onClose={onClose} maxWidth={560}>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div><FieldLabel>Nome da categoria *</FieldLabel><DInput value={form.nome} onChange={(e) => setF("nome", e.target.value)} placeholder="Ex: Elétrica, Hardware..." /></div>

        <div>
          <FieldLabel>Produtos / Itens pré-cadastrados</FieldLabel>
          <div style={{ fontSize: 11, color: theme.txtMuted(isDark), marginBottom: 6, lineHeight: 1.5 }}>Esses itens ficam como sugestões rápidas ao lançar uma compra desta categoria.</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 4 }}>
            <div onClick={() => document.getElementById("new-item-input")?.focus()} style={{ height: 68, borderRadius: 8, border: `2px dashed ${theme.border(isDark)}`, padding: "0 14px", display: "flex", alignItems: "center", gap: 6, cursor: "text" }}>
              <input id="new-item-input" value={form.newItem} onChange={(e) => setF("newItem", e.target.value)} onKeyDown={(e) => e.key === "Enter" && addItem()} placeholder="+ Novo item..." style={{ background: "transparent", border: "none", outline: "none", color: theme.txtMuted(isDark), fontSize: 12, width: 120 }} />
            </div>
            {form.itens.map((item) => (
              <div key={item} style={{ height: 68, borderRadius: 8, padding: "0 12px", background: theme.bgInput(isDark), border: `1px solid ${theme.border(isDark)}`, display: "flex", alignItems: "center", gap: 8, position: "relative" }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: theme.txtPrimary(isDark) }}>{item}</span>
                <button onClick={() => removeItem(item)} style={{ background: "none", border: "none", cursor: "pointer", color: theme.txtMuted(isDark), fontSize: 15, padding: 0, lineHeight: 1 }}>×</button>
              </div>
            ))}
            {!form.itens.length && form.newItem === "" && <span style={{ fontSize: 12, color: theme.txtMuted(isDark), alignSelf: "center" }}>Nenhum item ainda — digite acima e pressione Enter</span>}
          </div>
        </div>

        <div style={sep} />

        <div>
          <SectionLabel>Dados do Fornecedor (opcional)</SectionLabel>
          <div style={{ fontSize: 11, color: theme.txtMuted(isDark), marginBottom: 10, lineHeight: 1.5 }}>Preencha apenas o que for relevante. Ex: Mercado Livre → só o link; fornecedor de chapas → nome + contato + endereço.</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div><FieldLabel>Nome do fornecedor</FieldLabel><DInput value={form.fornecedorNome} onChange={(e) => setF("fornecedorNome", e.target.value)} placeholder="Ex: Aço Paulista Ltda" /></div>
              <div><FieldLabel>Contato (telefone/WhatsApp)</FieldLabel><DInput value={form.contato} onChange={(e) => setF("contato", e.target.value)} placeholder="(11) 9 9999-9999" /></div>
            </div>
            <div><FieldLabel>Endereço</FieldLabel><DInput value={form.endereco} onChange={(e) => setF("endereco", e.target.value)} placeholder="Rua, número — Cidade/UF" /></div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div><FieldLabel>E-mail</FieldLabel><DInput type="email" value={form.email} onChange={(e) => setF("email", e.target.value)} placeholder="fornecedor@email.com" /></div>
              <div><FieldLabel>Site / Link</FieldLabel><DInput type="url" value={form.link} onChange={(e) => setF("link", e.target.value)} placeholder="https://..." /></div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 20 }}>
        {!isNew ? (
          <button onClick={() => { onDelete(cat.id); onClose(); }} style={{ ...btnBase, border: `1px solid ${theme.red}`, background: "transparent", color: theme.red }}>Excluir</button>
        ) : <div />}
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onClose} style={{ ...btnBase, border: `1px solid ${theme.border(isDark)}`, background: "transparent", color: theme.txtSecondary(isDark) }}>Cancelar</button>
          <button onClick={handleSave} style={{ ...btnBase, border: "none", background: color, color: "#fff", fontWeight: 700 }}>Salvar</button>
        </div>
      </div>
    </Modal>
  );
}

// ─── CategoriasConfig ─────────────────────────────────────────────────────────
function CategoriasConfig({ categorias, setCategorias }) {
  const [editTarget, setEditTarget] = useState(null);
  const handleSave = (data) => {
    if (editTarget === "new") setCategorias([...categorias, data]);
    else setCategorias(categorias.map((c) => (c.id === data.id ? data : c)));
    setEditTarget(null);
  };
  const handleDelete = (id) => { setCategorias(categorias.filter((c) => c.id !== id)); setEditTarget(null); };
  return (
    <>
      {editTarget !== null && <CategoriaModal cat={editTarget === "new" ? null : editTarget} onSave={handleSave} onDelete={handleDelete} onClose={() => setEditTarget(null)} />}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
        <AddCard label="Nova categoria" onClick={() => setEditTarget("new")} />
        {categorias.map((cat) => <CategoriaCard key={cat.id} cat={cat} onClick={() => setEditTarget(cat)} />)}
      </div>
    </>
  );
}

// ─── ComprasList ──────────────────────────────────────────────────────────────
function ComprasList({ rows, addRow, deleteRow, updateStatus, loading, orders, categorias }) {
  const isDark = useDark();
  const [showModal, setShowModal]   = useState(false);
  const [filtroTipo, setFiltroTipo] = useState("todos");

  const rowsFiltradas = useMemo(() => rows.filter((r) => {
    if (r.status === "Recebido") return false;
    if (filtroTipo === "pedido")  return !r.estoque && r.pedidos?.length > 0;
    if (filtroTipo === "estoque") return r.estoque  || !r.pedidos?.length;
    return true;
  }), [rows, filtroTipo]);

  const thStyle = { padding: "10px 14px", fontSize: 11, fontWeight: 700, letterSpacing: "0.05em", color: theme.txtSecondary(isDark), textAlign: "left", borderBottom: `1px solid ${theme.border(isDark)}`, background: theme.bgInput(isDark), whiteSpace: "nowrap" };
  const tdStyle = { padding: "10px 14px", fontSize: 12, color: theme.txtSecondary(isDark), borderTop: `1px solid ${theme.border(isDark)}`, verticalAlign: "top" };

  return (
    <>
      {showModal && (
        <ComprasModal
          orders={orders}
          categorias={categorias}
          onClose={() => setShowModal(false)}
          onSave={(row) => { addRow(row); setShowModal(false); }}
        />
      )}
      <div style={{ background: theme.bgCard(isDark), border: `1px solid ${theme.border(isDark)}`, borderRadius: 12, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 560 }}>
            <thead>
              <tr>
                <th style={thStyle}>Pedido(s)</th>
                <th style={thStyle}>Itens</th>
                <th style={thStyle}>Fornecedor</th>
                <th style={thStyle}>Criado</th>
                <th style={thStyle}>Previsão</th>
                <th style={thStyle}>Status</th>
                <th style={{ ...thStyle, width: 36 }}></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} style={{ padding: 28, textAlign: "center", color: theme.txtMuted(isDark), fontSize: 13 }}>Carregando…</td></tr>
              ) : rowsFiltradas.map((row) => {
                const itens = getRowItens(row);
                return (
                  <tr key={row.id}
                    onMouseEnter={(e) => (e.currentTarget.style.background = theme.bgHover(isDark))}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <td style={{ ...tdStyle, verticalAlign: "middle" }}>
                      {row.estoque || !row.pedidos?.length ? (
                        <EstoqueBadge />
                      ) : (
                        <span style={{ fontFamily: "monospace", fontWeight: 700, color: theme.accent, whiteSpace: "nowrap" }}>{joinArr(row.pedidos)}</span>
                      )}
                    </td>
                    <td style={tdStyle}>
                      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        {itens.map((it) => (
                          <div key={it.id} style={{ display: "flex", alignItems: "center", gap: 6, lineHeight: 1 }}>
                            {it.categoria && <span style={{ fontSize: 10, fontWeight: 700, color: theme.accent, background: `${theme.accent}15`, padding: "1px 6px", borderRadius: 99, whiteSpace: "nowrap" }}>{it.categoria}</span>}
                            <span style={{ fontWeight: 600, color: theme.txtPrimary(isDark) }}>{it.item}</span>
                            <span style={{ fontSize: 11, color: theme.txtMuted(isDark), whiteSpace: "nowrap" }}>× {it.qtd}</span>
                          </div>
                        ))}
                        {!itens.length && <span style={{ color: theme.txtMuted(isDark) }}>—</span>}
                      </div>
                    </td>
                    <td style={{ ...tdStyle, verticalAlign: "middle" }}>{row.fornecedor || "—"}</td>
                    <td style={{ ...tdStyle, whiteSpace: "nowrap", fontSize: 11, color: theme.txtMuted(isDark), verticalAlign: "middle" }}>{row.solicitacao || "—"}</td>
                    <td style={{ ...tdStyle, whiteSpace: "nowrap", verticalAlign: "middle" }}>{row.previsao || "—"}</td>
                    <td style={{ ...tdStyle, minWidth: 120, verticalAlign: "middle" }}>
                      <StepNav value={row.status} options={["Solicitado", "Recebido"]} onChange={(v) => updateStatus(row.id, v)} />
                    </td>
                    <td style={{ ...tdStyle, verticalAlign: "middle" }}><TrashButton onClick={() => deleteRow(row.id)} /></td>
                  </tr>
                );
              })}
              {!loading && !rowsFiltradas.length && (
                <tr><td colSpan={7} style={{ padding: 28, textAlign: "center", color: theme.txtMuted(isDark), fontSize: 13 }}>{rows.filter(r => r.status !== "Recebido").length === 0 ? "Nenhuma compra registrada." : "Nenhuma compra nesta categoria."}</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div style={{ padding: "10px 14px", borderTop: `1px solid ${theme.border(isDark)}`, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <button onClick={() => setShowModal(true)} style={{ fontSize: 12, fontWeight: 600, color: theme.accent, background: "none", border: "none", cursor: "pointer", padding: 0 }}>+ Nova compra</button>
          <div style={{ display: "flex", gap: 6, marginLeft: "auto" }}>
            {[{ key: "todos", label: "Todos" }, { key: "pedido", label: "Por pedido" }, { key: "estoque", label: "📦 Estoque" }].map(({ key, label }) => (
              <button key={key} onClick={() => setFiltroTipo(key)}
                style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 99, cursor: "pointer", border: `1px solid ${filtroTipo === key ? theme.accent : theme.border(isDark)}`, background: filtroTipo === key ? theme.accent : "transparent", color: filtroTipo === key ? "#fff" : theme.txtMuted(isDark), transition: "all .15s" }}>
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

// ─── ComprasSection ───────────────────────────────────────────────────────────
// 3 abas: [Compras | ⚙ Categorias | 📋 Histórico]
export function ComprasSection({ orders, categorias, setCategorias }) {
  const isDark = useDark();
  const [activeTab, setActiveTab] = useState("compras");

  // ── Estado de compras (API) ──────────────────────────────────────────────
  const [rows, setRows]       = useState([]);
  const [apiLoading, setApiLoading] = useState(true);

  useEffect(() => {
    comprasService.list()
      .then((data) => setRows(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setApiLoading(false));
  }, []);

  // ── CRUD ────────────────────────────────────────────────────────────────
  const addRow = async (row) => {
    try {
      const created = await comprasService.create(row);
      setRows((p) => [created, ...p]);

      // Auto-salva itens novos como sugestão na categoria correspondente
      // Assim, itens comprados ficam disponíveis como sugestão nas próximas compras
      const itens = getRowItens(row);
      if (itens.length > 0 && categorias.length > 0) {
        let changed = false;
        const updatedCats = categorias.map((cat) => {
          const novos = itens
            .filter((it) => it.categoria === cat.nome && it.item && !cat.itens.includes(it.item))
            .map((it) => it.item);
          if (novos.length === 0) return cat;
          changed = true;
          return { ...cat, itens: [...cat.itens, ...novos] };
        });
        if (changed) setCategorias(updatedCats);
      }
    } catch { /* silent */ }
  };

  const deleteRow = async (id) => {
    setRows((p) => p.filter((r) => r.id !== id)); // optimistic
    try {
      await comprasService.remove(id);
    } catch {
      // revert — re-fetch
      comprasService.list().then((data) => setRows(Array.isArray(data) ? data : []));
    }
  };

  const updateStatus = async (id, v) => {
    const row = rows.find((r) => r.id === id);
    if (!row) return;

    const patch = { ...row, status: v, ...(v === "Recebido" ? { received_at: today() } : {}) };
    setRows((p) => p.map((r) => r.id === id ? patch : r)); // optimistic

    try {
      const updated = await comprasService.update(id, patch);
      setRows((p) => p.map((r) => r.id === id ? updated : r));

      // Ao receber → lança entrada no estoque SOMENTE se destino for "Para Estoque"
      // Compras "Por Pedido" não entram no estoque — foram compradas para um pedido específico
      if (v === "Recebido" && row.estoque) {
        const itens = getRowItens(row);
        if (itens.length > 0) {
          try {
            const estoqueItems = await estoqueService.list();
            for (const it of itens) {
              if (!it.item) continue;
              const match = Array.isArray(estoqueItems)
                ? estoqueItems.find((e) => e.nome.toLowerCase() === it.item.toLowerCase())
                : null;
              if (match) {
                await estoqueService.registrarMov(match.id, {
                  tipo: "entrada",
                  quantidade: Number(it.qtd) || 1,
                  motivo: "Compra recebida",
                });
              } else {
                await estoqueService.create({
                  nome: it.item,
                  unidade: "unid",
                  qtd_atual: Number(it.qtd) || 1,
                  qtd_minima: 0,
                  categoria: it.categoria || null,
                  observacao: null,
                });
              }
            }
          } catch { /* silent — não bloqueia o fluxo */ }
        }
      }
    } catch {
      setRows((p) => p.map((r) => r.id === id ? row : r)); // revert
    }
  };

  const reativarComp = async (id) => {
    const row = rows.find((r) => r.id === id);
    if (!row) return;
    const patch = { ...row, status: "Solicitado", received_at: null };
    setRows((p) => p.map((r) => r.id === id ? patch : r));
    try {
      const updated = await comprasService.update(id, patch);
      setRows((p) => p.map((r) => r.id === id ? updated : r));
    } catch {
      setRows((p) => p.map((r) => r.id === id ? row : r));
    }
  };

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
        <button onClick={() => setActiveTab("compras")}    style={tabBtnStyle(activeTab === "compras")}>Compras</button>
        <button onClick={() => setActiveTab("categorias")} style={tabBtnStyle(activeTab === "categorias")}>⚙ Categorias</button>
        <button onClick={() => setActiveTab("historico")}  style={tabBtnStyle(activeTab === "historico")}>📋 Histórico</button>
      </div>
      {activeTab === "compras"    && (
        <ComprasList
          rows={rows}
          addRow={addRow}
          deleteRow={deleteRow}
          updateStatus={updateStatus}
          loading={apiLoading}
          orders={orders}
          categorias={categorias}
        />
      )}
      {activeTab === "categorias" && <CategoriasConfig categorias={categorias} setCategorias={setCategorias} />}
      {activeTab === "historico"  && (
        <HistoricoSection
          tipo="compras"
          compRows={rows}
          onReativar={reativarComp}
          onExcluir={deleteRow}
        />
      )}
    </div>
  );
}

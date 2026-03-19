import { useState, useEffect } from "react";
import { useDark } from "../../context/DarkContext";
import { useAuth } from "../../context/AuthContext";
import theme from "../../theme";
import { estoqueService } from "../../services/estoque";

const UNIDADES = ["unid", "kg", "m", "m²", "L", "par", "rolo", "cx"];
const EMPTY_FORM = { nome: "", unidade: "kg", qtd_atual: "", qtd_minima: "", observacao: "" };
const EMPTY_MOV  = { tipo: "entrada", quantidade: "", motivo: "" };

function useWindowWidth() {
  const [w, setW] = useState(window.innerWidth);
  useEffect(() => {
    const h = () => setW(window.innerWidth);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);
  return w;
}

function fmt(n) { return Number(n ?? 0).toLocaleString("pt-BR", { maximumFractionDigits: 2 }); }
function fmtDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString("pt-BR") + " " + d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

export default function EstoqueSection() {
  const isDark = useDark();
  const { user } = useAuth();
  const width = useWindowWidth();
  const isMobile = width < 640;

  const canEdit   = user?.role === "admin" || user?.role === "gerente";
  const canDelete = user?.role === "admin";

  const [items,         setItems]         = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [form,          setForm]          = useState(EMPTY_FORM);
  const [formError,     setFormError]     = useState("");
  const [formLoading,   setFormLoading]   = useState(false);
  const [editTarget,    setEditTarget]    = useState(null);
  const [editError,     setEditError]     = useState("");
  const [editLoading,   setEditLoading]   = useState(false);
  const [movTarget,     setMovTarget]     = useState(null);
  const [movForm,       setMovForm]       = useState(EMPTY_MOV);
  const [movError,      setMovError]      = useState("");
  const [movLoading,    setMovLoading]    = useState(false);
  const [historico,     setHistorico]     = useState(null);
  const [histLoading,   setHistLoading]   = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);

  useEffect(() => {
    estoqueService.list()
      .then(setItems)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const baixo = items.filter((i) => Number(i.qtd_atual) < Number(i.qtd_minima));

  // ── Criar ───────────────────────────────────────────────────────────────────
  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.nome.trim()) { setFormError("Nome é obrigatório."); return; }
    setFormLoading(true); setFormError("");
    try {
      const created = await estoqueService.create({
        nome: form.nome.trim(),
        unidade: form.unidade,
        qtd_atual: Number(form.qtd_atual) || 0,
        qtd_minima: Number(form.qtd_minima) || 0,
        observacao: form.observacao || null,
      });
      setItems((p) => [...p, created].sort((a, b) => a.nome.localeCompare(b.nome)));
      setForm(EMPTY_FORM);
    } catch (err) { setFormError(err.message || "Erro ao criar insumo."); }
    finally { setFormLoading(false); }
  };

  // ── Editar ──────────────────────────────────────────────────────────────────
  const handleEdit = async (e) => {
    e.preventDefault();
    if (!editTarget.nome.trim()) { setEditError("Nome é obrigatório."); return; }
    setEditLoading(true); setEditError("");
    try {
      const updated = await estoqueService.update(editTarget.id, {
        nome: editTarget.nome.trim(),
        unidade: editTarget.unidade,
        qtd_minima: Number(editTarget.qtd_minima) || 0,
        observacao: editTarget.observacao || null,
      });
      setItems((p) => p.map((i) => i.id === updated.id ? updated : i).sort((a, b) => a.nome.localeCompare(b.nome)));
      setEditTarget(null);
    } catch (err) { setEditError(err.message || "Erro ao atualizar."); }
    finally { setEditLoading(false); }
  };

  // ── Excluir ─────────────────────────────────────────────────────────────────
  const handleDelete = async (id) => {
    try {
      await estoqueService.remove(id);
      setItems((p) => p.filter((i) => i.id !== id));
    } catch {}
    setConfirmDelete(null);
  };

  // ── Movimentação ────────────────────────────────────────────────────────────
  const handleMov = async (e) => {
    e.preventDefault();
    if (!movForm.quantidade || Number(movForm.quantidade) <= 0) { setMovError("Informe uma quantidade válida."); return; }
    setMovLoading(true); setMovError("");
    try {
      const updated = await estoqueService.registrarMov(movTarget.id, {
        tipo: movForm.tipo,
        quantidade: Number(movForm.quantidade),
        motivo: movForm.motivo || null,
      });
      setItems((p) => p.map((i) => i.id === updated.id ? updated : i));
      setMovTarget(null);
      setMovForm(EMPTY_MOV);
    } catch (err) { setMovError(err.message || "Erro ao registrar movimentação."); }
    finally { setMovLoading(false); }
  };

  // ── Histórico ───────────────────────────────────────────────────────────────
  const openHistorico = async (item) => {
    setHistorico({ item, movs: [] });
    setHistLoading(true);
    try {
      const movs = await estoqueService.listMovimentos(item.id);
      setHistorico({ item, movs });
    } catch {}
    finally { setHistLoading(false); }
  };

  // ── Estilos ─────────────────────────────────────────────────────────────────
  const inputSt = {
    padding: "8px 11px", fontSize: 13, borderRadius: 8,
    background: theme.bgInput(isDark), border: `1px solid ${theme.border(isDark)}`,
    color: theme.txtPrimary(isDark), outline: "none", boxSizing: "border-box",
  };
  const selectSt = { ...inputSt, cursor: "pointer" };
  const btnPrimary = {
    padding: "8px 18px", borderRadius: 8, border: "none",
    background: theme.accent, color: theme.accentText,
    fontWeight: 700, fontSize: 13, cursor: "pointer", whiteSpace: "nowrap",
  };
  const btnGhost = {
    padding: "5px 10px", borderRadius: 6, border: `1px solid ${theme.border(isDark)}`,
    background: "transparent", cursor: "pointer", fontSize: 12, fontWeight: 600,
  };

  const isBaixo = (item) => Number(item.qtd_atual) < Number(item.qtd_minima);

  // ── Linha de tabela (desktop) ───────────────────────────────────────────────
  function ItemRow({ item }) {
    const alerta = isBaixo(item);
    return (
      <tr style={{ borderBottom: `1px solid ${theme.border(isDark)}`, background: alerta ? theme.redBg(isDark) : "transparent" }}>
        <td style={{ padding: "10px 12px", color: theme.txtPrimary(isDark), fontWeight: 600 }}>
          {item.nome}
          {item.observacao && <div style={{ fontSize: 11, color: theme.txtMuted(isDark), fontWeight: 400 }}>{item.observacao}</div>}
        </td>
        <td style={{ padding: "10px 12px", color: theme.txtSecondary(isDark), fontSize: 12 }}>{item.unidade}</td>
        <td style={{ padding: "10px 12px", fontWeight: 700, color: alerta ? theme.red : theme.txtPrimary(isDark) }}>
          {alerta && "⚠ "}{fmt(item.qtd_atual)}
        </td>
        <td style={{ padding: "10px 12px", color: theme.txtSecondary(isDark) }}>{fmt(item.qtd_minima)}</td>
        <td style={{ padding: "10px 12px" }}>
          {alerta
            ? <span style={{ fontSize: 11, fontWeight: 700, color: theme.red, background: theme.redBg(isDark), border: `1px solid ${theme.red}44`, borderRadius: 5, padding: "2px 7px" }}>⚠ Baixo</span>
            : <span style={{ fontSize: 11, fontWeight: 700, color: theme.green, background: theme.greenBg(isDark), border: `1px solid ${theme.green}44`, borderRadius: 5, padding: "2px 7px" }}>✓ OK</span>
          }
        </td>
        <td style={{ padding: "10px 12px", whiteSpace: "nowrap" }}>
          <div style={{ display: "flex", gap: 6 }}>
            {canEdit && <button onClick={() => { setMovTarget(item); setMovForm(EMPTY_MOV); setMovError(""); }} style={{ ...btnGhost, color: theme.accent }}>+ Mov.</button>}
            {canEdit && <button onClick={() => { setEditTarget({ ...item }); setEditError(""); }} style={{ ...btnGhost, color: theme.blue }}>✏</button>}
            {canDelete && <button onClick={() => setConfirmDelete(item.id)} style={{ ...btnGhost, color: theme.red }}>🗑</button>}
            <button onClick={() => openHistorico(item)} style={{ ...btnGhost, color: theme.txtSecondary(isDark) }}>📋</button>
          </div>
        </td>
      </tr>
    );
  }

  // ── Card (mobile) ───────────────────────────────────────────────────────────
  function ItemCard({ item }) {
    const alerta = isBaixo(item);
    return (
      <div style={{
        borderRadius: 12, padding: "14px 16px",
        background: alerta ? theme.redBg(isDark) : theme.bgCard(isDark),
        border: `1px solid ${alerta ? theme.red + "66" : theme.border(isDark)}`,
        display: "flex", flexDirection: "column", gap: 10,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: theme.txtPrimary(isDark) }}>{item.nome}</div>
            {item.observacao && <div style={{ fontSize: 11, color: theme.txtMuted(isDark), marginTop: 2 }}>{item.observacao}</div>}
          </div>
          <div style={{ display: "flex", gap: 5, flexShrink: 0 }}>
            <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 5, background: theme.bgInput(isDark), color: theme.txtSecondary(isDark) }}>{item.unidade}</span>
            {alerta
              ? <span style={{ fontSize: 11, fontWeight: 700, color: theme.red, background: theme.redBg(isDark), border: `1px solid ${theme.red}44`, borderRadius: 5, padding: "2px 7px" }}>⚠ Baixo</span>
              : <span style={{ fontSize: 11, fontWeight: 700, color: theme.green, background: theme.greenBg(isDark), border: `1px solid ${theme.green}44`, borderRadius: 5, padding: "2px 7px" }}>✓ OK</span>
            }
          </div>
        </div>
        <div style={{ display: "flex", gap: 20 }}>
          <div>
            <div style={{ fontSize: 11, color: theme.txtMuted(isDark) }}>Atual</div>
            <div style={{ fontSize: 22, fontWeight: 800, lineHeight: 1, color: alerta ? theme.red : theme.txtPrimary(isDark) }}>{fmt(item.qtd_atual)}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: theme.txtMuted(isDark) }}>Mínimo</div>
            <div style={{ fontSize: 22, fontWeight: 800, lineHeight: 1, color: theme.txtSecondary(isDark) }}>{fmt(item.qtd_minima)}</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {canEdit && <button onClick={() => { setMovTarget(item); setMovForm(EMPTY_MOV); setMovError(""); }} style={{ ...btnPrimary, padding: "7px 14px", fontSize: 12 }}>+ Movimentação</button>}
          {canEdit && <button onClick={() => { setEditTarget({ ...item }); setEditError(""); }} style={{ ...btnGhost, color: theme.blue }}>✏ Editar</button>}
          {canDelete && <button onClick={() => setConfirmDelete(item.id)} style={{ ...btnGhost, color: theme.red }}>🗑</button>}
          <button onClick={() => openHistorico(item)} style={{ ...btnGhost, color: theme.txtSecondary(isDark) }}>📋 Histórico</button>
        </div>
      </div>
    );
  }

  // ── Render principal ─────────────────────────────────────────────────────────
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ fontSize: 28, lineHeight: 1 }}>📦</span>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: theme.txtPrimary(isDark) }}>Estoque de Materiais</div>
          <div style={{ fontSize: 12, color: theme.txtMuted(isDark), marginTop: 1 }}>Controle de insumos e movimentações</div>
        </div>
      </div>

      {/* Alerta de estoque baixo */}
      {baixo.length > 0 && (
        <div style={{ padding: "10px 14px", borderRadius: 8, background: theme.redBg(isDark), border: `1px solid ${theme.red}44`, display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 16 }}>⚠</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: theme.red }}>
            {baixo.length} insumo{baixo.length > 1 ? "s" : ""} abaixo do mínimo:{" "}
            <span style={{ fontWeight: 500 }}>{baixo.map((i) => i.nome).join(", ")}</span>
          </span>
        </div>
      )}

      {/* Lista de insumos */}
      {loading ? (
        <div style={{ fontSize: 13, color: theme.txtMuted(isDark), padding: "12px 0" }}>Carregando...</div>
      ) : items.length === 0 ? (
        <div style={{ fontSize: 13, color: theme.txtMuted(isDark), padding: "12px 0" }}>Nenhum insumo cadastrado.</div>
      ) : isMobile ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {items.map((item) => <ItemCard key={item.id} item={item} />)}
        </div>
      ) : (
        <div style={{ borderRadius: 10, border: `1px solid ${theme.border(isDark)}`, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead style={{ background: theme.bgInput(isDark) }}>
              <tr>
                {["Nome", "Und.", "Atual", "Mínimo", "Status", ""].map((h) => (
                  <th key={h} style={{ textAlign: "left", padding: "8px 12px", fontSize: 11, fontWeight: 700, color: theme.txtMuted(isDark), whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((item) => <ItemRow key={item.id} item={item} />)}
            </tbody>
          </table>
        </div>
      )}

      {/* Formulário de criação */}
      {canEdit && (
        <div style={{ padding: 16, background: theme.bgCard(isDark), border: `1px solid ${theme.border(isDark)}`, borderRadius: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: theme.txtSecondary(isDark), marginBottom: 12 }}>+ Novo Insumo</div>
          <form onSubmit={handleCreate}>
            <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
              <input value={form.nome} onChange={(e) => setForm((p) => ({ ...p, nome: e.target.value }))} placeholder="Nome do insumo" style={{ ...inputSt, flex: "2 1 160px" }} />
              <select value={form.unidade} onChange={(e) => setForm((p) => ({ ...p, unidade: e.target.value }))} style={{ ...selectSt, flex: "0 0 90px" }}>
                {UNIDADES.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
              <input type="number" min="0" step="any" value={form.qtd_atual} onChange={(e) => setForm((p) => ({ ...p, qtd_atual: e.target.value }))} placeholder="Qtd inicial" style={{ ...inputSt, flex: "1 1 100px" }} />
              <input type="number" min="0" step="any" value={form.qtd_minima} onChange={(e) => setForm((p) => ({ ...p, qtd_minima: e.target.value }))} placeholder="Qtd mínima" style={{ ...inputSt, flex: "1 1 100px" }} />
              <input value={form.observacao} onChange={(e) => setForm((p) => ({ ...p, observacao: e.target.value }))} placeholder="Observação (opcional)" style={{ ...inputSt, flex: "2 1 160px" }} />
            </div>
            {formError && <div style={{ fontSize: 12, color: theme.red, fontWeight: 600, marginBottom: 8 }}>{formError}</div>}
            <button type="submit" disabled={formLoading} style={{ ...btnPrimary, opacity: formLoading ? 0.7 : 1 }}>
              {formLoading ? "Salvando..." : "Adicionar Insumo"}
            </button>
          </form>
        </div>
      )}

      {/* Modal: Confirmar exclusão */}
      {confirmDelete && (
        <div style={{ position: "fixed", inset: 0, zIndex: 60, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.55)", padding: 16 }}>
          <div style={{ background: theme.bgCard(isDark), border: `1px solid ${theme.border(isDark)}`, borderRadius: 12, padding: 28, maxWidth: 340, width: "100%", textAlign: "center" }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: theme.txtPrimary(isDark), marginBottom: 10 }}>Confirmar exclusão</div>
            <div style={{ fontSize: 13, color: theme.txtSecondary(isDark), marginBottom: 20 }}>
              Tem certeza? Todas as movimentações do insumo também serão removidas.
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
              <button onClick={() => setConfirmDelete(null)} style={{ ...btnGhost, color: theme.txtSecondary(isDark) }}>Cancelar</button>
              <button onClick={() => handleDelete(confirmDelete)} style={{ ...btnPrimary, background: theme.red, color: "#fff" }}>Excluir</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Editar insumo */}
      {editTarget && (
        <div style={{ position: "fixed", inset: 0, zIndex: 60, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.55)", padding: 16 }}>
          <div style={{ background: theme.bgCard(isDark), border: `1px solid ${theme.border(isDark)}`, borderRadius: 12, padding: 24, maxWidth: 420, width: "100%" }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: theme.txtPrimary(isDark), marginBottom: 16 }}>Editar Insumo</div>
            <form onSubmit={handleEdit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, color: theme.txtMuted(isDark), display: "block", marginBottom: 4 }}>Nome</label>
                <input value={editTarget.nome} onChange={(e) => setEditTarget((p) => ({ ...p, nome: e.target.value }))} style={{ ...inputSt, width: "100%" }} />
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 12, color: theme.txtMuted(isDark), display: "block", marginBottom: 4 }}>Unidade</label>
                  <select value={editTarget.unidade} onChange={(e) => setEditTarget((p) => ({ ...p, unidade: e.target.value }))} style={{ ...selectSt, width: "100%" }}>
                    {UNIDADES.map((u) => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 12, color: theme.txtMuted(isDark), display: "block", marginBottom: 4 }}>Qtd Mínima</label>
                  <input type="number" min="0" step="any" value={editTarget.qtd_minima} onChange={(e) => setEditTarget((p) => ({ ...p, qtd_minima: e.target.value }))} style={{ ...inputSt, width: "100%" }} />
                </div>
              </div>
              <div>
                <label style={{ fontSize: 12, color: theme.txtMuted(isDark), display: "block", marginBottom: 4 }}>Observação</label>
                <input value={editTarget.observacao ?? ""} onChange={(e) => setEditTarget((p) => ({ ...p, observacao: e.target.value }))} placeholder="Opcional" style={{ ...inputSt, width: "100%" }} />
              </div>
              <div style={{ fontSize: 11, color: theme.txtMuted(isDark) }}>
                * Para ajustar a quantidade atual, use &quot;+ Movimentação&quot;.
              </div>
              {editError && <div style={{ fontSize: 12, color: theme.red, fontWeight: 600 }}>{editError}</div>}
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 4 }}>
                <button type="button" onClick={() => setEditTarget(null)} style={{ ...btnGhost, color: theme.txtSecondary(isDark) }}>Cancelar</button>
                <button type="submit" disabled={editLoading} style={{ ...btnPrimary, opacity: editLoading ? 0.7 : 1 }}>
                  {editLoading ? "Salvando..." : "Salvar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Registrar movimentação */}
      {movTarget && !historico && (
        <div style={{ position: "fixed", inset: 0, zIndex: 60, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.55)", padding: 16 }}>
          <div style={{ background: theme.bgCard(isDark), border: `1px solid ${theme.border(isDark)}`, borderRadius: 12, padding: 24, maxWidth: 380, width: "100%" }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: theme.txtPrimary(isDark), marginBottom: 4 }}>Movimentação</div>
            <div style={{ fontSize: 12, color: theme.txtMuted(isDark), marginBottom: 16 }}>
              {movTarget.nome} · atual: <strong>{fmt(movTarget.qtd_atual)} {movTarget.unidade}</strong>
            </div>
            <form onSubmit={handleMov} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "flex", gap: 0, borderRadius: 8, overflow: "hidden", border: `1px solid ${theme.border(isDark)}` }}>
                {["entrada", "saida"].map((t) => (
                  <button key={t} type="button" onClick={() => setMovForm((p) => ({ ...p, tipo: t }))}
                    style={{ flex: 1, padding: "9px 0", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 700,
                      background: movForm.tipo === t ? (t === "entrada" ? theme.green : theme.red) : theme.bgInput(isDark),
                      color: movForm.tipo === t ? "#fff" : theme.txtSecondary(isDark),
                    }}>
                    {t === "entrada" ? "▲ Entrada" : "▼ Saída"}
                  </button>
                ))}
              </div>
              <div>
                <label style={{ fontSize: 12, color: theme.txtMuted(isDark), display: "block", marginBottom: 4 }}>Quantidade ({movTarget.unidade})</label>
                <input type="number" min="0.01" step="any" value={movForm.quantidade}
                  onChange={(e) => setMovForm((p) => ({ ...p, quantidade: e.target.value }))}
                  placeholder="0" style={{ ...inputSt, width: "100%" }} autoFocus />
              </div>
              <div>
                <label style={{ fontSize: 12, color: theme.txtMuted(isDark), display: "block", marginBottom: 4 }}>Motivo <span style={{ fontStyle: "italic" }}>(opcional)</span></label>
                <input value={movForm.motivo} onChange={(e) => setMovForm((p) => ({ ...p, motivo: e.target.value }))}
                  placeholder="Ex: Compra, Produção PED-001…" style={{ ...inputSt, width: "100%" }} />
              </div>
              {movError && <div style={{ fontSize: 12, color: theme.red, fontWeight: 600 }}>{movError}</div>}
              <div style={{ display: "flex", gap: 8, justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
                <button type="button" onClick={() => openHistorico(movTarget)}
                  style={{ fontSize: 12, color: theme.accent, background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                  📋 Ver histórico
                </button>
                <div style={{ display: "flex", gap: 8 }}>
                  <button type="button" onClick={() => setMovTarget(null)} style={{ ...btnGhost, color: theme.txtSecondary(isDark) }}>Cancelar</button>
                  <button type="submit" disabled={movLoading} style={{ ...btnPrimary, opacity: movLoading ? 0.7 : 1 }}>
                    {movLoading ? "Registrando..." : "Registrar"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Histórico */}
      {historico && (
        <div style={{ position: "fixed", inset: 0, zIndex: 70, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.6)", padding: 16 }}>
          <div style={{ background: theme.bgCard(isDark), border: `1px solid ${theme.border(isDark)}`, borderRadius: 12, padding: 24, maxWidth: 480, width: "100%", maxHeight: "80vh", display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: theme.txtPrimary(isDark) }}>Histórico — {historico.item.nome}</div>
                <div style={{ fontSize: 12, color: theme.txtMuted(isDark) }}>Últimas 50 movimentações</div>
              </div>
              <button onClick={() => setHistorico(null)} style={{ background: "none", border: "none", cursor: "pointer", color: theme.txtSecondary(isDark), fontSize: 22, lineHeight: 1, padding: 4 }}>×</button>
            </div>
            <div style={{ overflowY: "auto", flex: 1 }}>
              {histLoading ? (
                <div style={{ fontSize: 13, color: theme.txtMuted(isDark) }}>Carregando...</div>
              ) : historico.movs.length === 0 ? (
                <div style={{ fontSize: 13, color: theme.txtMuted(isDark) }}>Nenhuma movimentação registrada.</div>
              ) : (
                historico.movs.map((m) => (
                  <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "9px 0", borderBottom: `1px solid ${theme.border(isDark)}` }}>
                    <span style={{ fontSize: 16, lineHeight: 1, flexShrink: 0, color: m.tipo === "entrada" ? theme.green : theme.red }}>
                      {m.tipo === "entrada" ? "▲" : "▼"}
                    </span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: m.tipo === "entrada" ? theme.green : theme.red }}>
                        {m.tipo === "entrada" ? "+" : "-"}{fmt(m.quantidade)} {historico.item.unidade}
                      </div>
                      {m.motivo && <div style={{ fontSize: 11, color: theme.txtMuted(isDark) }}>{m.motivo}</div>}
                    </div>
                    <div style={{ fontSize: 11, color: theme.txtMuted(isDark), flexShrink: 0, textAlign: "right" }}>
                      {fmtDate(m.created_at)}
                    </div>
                  </div>
                ))
              )}
            </div>
            <button onClick={() => setHistorico(null)} style={{ ...btnGhost, color: theme.txtSecondary(isDark), marginTop: 16, alignSelf: "flex-end" }}>Fechar</button>
          </div>
        </div>
      )}

    </div>
  );
}

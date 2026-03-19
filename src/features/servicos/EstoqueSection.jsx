// ─── EstoqueSection.jsx ───────────────────────────────────────────────────────
// Controle de insumos e movimentações de estoque.
// Padrão visual idêntico a ServicosTable / ComprasList.
// Categorias compartilhadas com Compras via localStorage("compras_categorias").
import { useState, useEffect } from "react";
import { useDark } from "../../context/DarkContext";
import { useAuth } from "../../context/AuthContext";
import { useLocalStorage } from "../../hooks/useLocalStorage";
import theme from "../../theme";
import { estoqueService } from "../../services/estoque";
import Modal from "../../components/ui/Modal";
import { DEFAULT_CATEGORIAS } from "./servicos.utils";

const UNIDADES = ["unid", "kg", "m", "m²", "L", "par", "rolo", "cx"];
const EMPTY_FORM = { nome: "", unidade: "kg", qtd_atual: "", qtd_minima: "", categoria: "", observacao: "" };
const EMPTY_MOV  = { tipo: "entrada", quantidade: "", motivo: "" };

function fmt(n) {
  return Number(n ?? 0).toLocaleString("pt-BR", { maximumFractionDigits: 2 });
}
function fmtDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString("pt-BR") + " " + d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}
const isBaixo = (item) => Number(item.qtd_atual) < Number(item.qtd_minima);

// ─── Modal: Novo / Editar insumo ──────────────────────────────────────────────
function InsumoModal({ target, categorias, onSave, onClose }) {
  const isDark = useDark();
  const isNew = !target;
  const [form, setForm] = useState(
    target
      ? { nome: target.nome, unidade: target.unidade, qtd_minima: String(target.qtd_minima ?? ""), categoria: target.categoria ?? "", observacao: target.observacao ?? "" }
      : EMPTY_FORM
  );
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);
  const setF = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const handleSave = async () => {
    if (!form.nome.trim()) { setError("Nome é obrigatório."); return; }
    setLoading(true); setError("");
    try {
      if (isNew) {
        const created = await estoqueService.create({
          nome:       form.nome.trim(),
          unidade:    form.unidade,
          qtd_atual:  Number(form.qtd_atual) || 0,
          qtd_minima: Number(form.qtd_minima) || 0,
          categoria:  form.categoria || null,
          observacao: form.observacao || null,
        });
        onSave("create", created);
      } else {
        const updated = await estoqueService.update(target.id, {
          nome:       form.nome.trim(),
          unidade:    form.unidade,
          qtd_minima: Number(form.qtd_minima) || 0,
          categoria:  form.categoria || null,
          observacao: form.observacao || null,
        });
        onSave("update", updated);
      }
      onClose();
    } catch (err) { setError(err.message || "Erro ao salvar."); }
    finally { setLoading(false); }
  };

  const inputSt = {
    width: "100%", padding: "8px 11px", fontSize: 13, borderRadius: 8, boxSizing: "border-box",
    background: theme.bgInput(isDark), border: `1px solid ${theme.border(isDark)}`,
    color: theme.txtPrimary(isDark), outline: "none",
  };
  const labelSt = { fontSize: 12, color: theme.txtMuted(isDark), display: "block", marginBottom: 4 };
  const btnBase = { padding: "8px 18px", fontSize: 13, fontWeight: 700, borderRadius: 8, cursor: "pointer" };

  return (
    <Modal title={isNew ? "Novo Insumo" : "Editar Insumo"} onClose={onClose} maxWidth={440}>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div>
          <label style={labelSt}>Nome *</label>
          <input value={form.nome} onChange={(e) => setF("nome", e.target.value)} placeholder="Ex: Chapa AC, Tinta PU…" style={inputSt} autoFocus />
        </div>

        {/* Categoria compartilhada com Compras */}
        <div>
          <label style={labelSt}>Categoria</label>
          <select value={form.categoria} onChange={(e) => setF("categoria", e.target.value)} style={{ ...inputSt, cursor: "pointer" }}>
            <option value="">— Sem categoria —</option>
            {categorias.map((c) => <option key={c.id} value={c.nome}>{c.nome}</option>)}
          </select>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div>
            <label style={labelSt}>Unidade</label>
            <select value={form.unidade} onChange={(e) => setF("unidade", e.target.value)} style={{ ...inputSt, cursor: "pointer" }}>
              {UNIDADES.map((u) => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
          <div>
            <label style={labelSt}>Qtd Mínima</label>
            <input type="number" min="0" step="any" value={form.qtd_minima} onChange={(e) => setF("qtd_minima", e.target.value)} placeholder="0" style={inputSt} />
          </div>
        </div>
        {isNew && (
          <div>
            <label style={labelSt}>Qtd Inicial</label>
            <input type="number" min="0" step="any" value={form.qtd_atual} onChange={(e) => setF("qtd_atual", e.target.value)} placeholder="0" style={inputSt} />
          </div>
        )}
        {!isNew && (
          <div style={{ fontSize: 11, color: theme.txtMuted(isDark), background: theme.bgInput(isDark), padding: "8px 12px", borderRadius: 8 }}>
            💡 Para ajustar a quantidade atual use &quot;+ Mov.&quot; na tabela.
          </div>
        )}
        <div>
          <label style={labelSt}>Observação <span style={{ fontStyle: "italic" }}>(opcional)</span></label>
          <input value={form.observacao} onChange={(e) => setF("observacao", e.target.value)} placeholder="Fornecedor, especificação…" style={inputSt} />
        </div>
        {error && <div style={{ fontSize: 12, color: theme.red, fontWeight: 600 }}>{error}</div>}
      </div>
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20 }}>
        <button onClick={onClose} style={{ ...btnBase, border: `1px solid ${theme.border(isDark)}`, background: "transparent", color: theme.txtSecondary(isDark) }}>Cancelar</button>
        <button onClick={handleSave} disabled={loading} style={{ ...btnBase, border: "none", background: theme.accent, color: theme.accentText, opacity: loading ? 0.7 : 1 }}>
          {loading ? "Salvando…" : "Salvar"}
        </button>
      </div>
    </Modal>
  );
}

// ─── Modal: Movimentação ──────────────────────────────────────────────────────
function MovModal({ item, onDone, onHistorico, onClose }) {
  const isDark = useDark();
  const [form, setForm]   = useState(EMPTY_MOV);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const setF = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.quantidade || Number(form.quantidade) <= 0) { setError("Informe uma quantidade válida."); return; }
    setLoading(true); setError("");
    try {
      const updated = await estoqueService.registrarMov(item.id, {
        tipo: form.tipo,
        quantidade: Number(form.quantidade),
        motivo: form.motivo || null,
      });
      onDone(updated);
      onClose();
    } catch (err) { setError(err.message || "Erro ao registrar."); }
    finally { setLoading(false); }
  };

  const inputSt = {
    width: "100%", padding: "8px 11px", fontSize: 13, borderRadius: 8, boxSizing: "border-box",
    background: theme.bgInput(isDark), border: `1px solid ${theme.border(isDark)}`,
    color: theme.txtPrimary(isDark), outline: "none",
  };
  const labelSt = { fontSize: 12, color: theme.txtMuted(isDark), display: "block", marginBottom: 4 };
  const btnBase = { padding: "8px 18px", fontSize: 13, fontWeight: 700, borderRadius: 8, cursor: "pointer" };

  return (
    <Modal title="Movimentação" onClose={onClose} maxWidth={380}>
      <div style={{ fontSize: 12, color: theme.txtMuted(isDark), marginBottom: 16 }}>
        {item.nome} · atual: <strong style={{ color: isBaixo(item) ? theme.red : theme.txtPrimary(isDark) }}>{fmt(item.qtd_atual)} {item.unidade}</strong>
      </div>
      <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {/* Tipo */}
        <div style={{ display: "flex", borderRadius: 8, overflow: "hidden", border: `1px solid ${theme.border(isDark)}` }}>
          {["entrada", "saida"].map((t) => (
            <button key={t} type="button" onClick={() => setF("tipo", t)}
              style={{ flex: 1, padding: "9px 0", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 700,
                background: form.tipo === t ? (t === "entrada" ? theme.green : theme.red) : theme.bgInput(isDark),
                color: form.tipo === t ? "#fff" : theme.txtSecondary(isDark),
              }}>
              {t === "entrada" ? "▲ Entrada" : "▼ Saída"}
            </button>
          ))}
        </div>
        <div>
          <label style={labelSt}>Quantidade ({item.unidade})</label>
          <input type="number" min="0.01" step="any" value={form.quantidade} onChange={(e) => setF("quantidade", e.target.value)} placeholder="0" style={inputSt} autoFocus />
        </div>
        <div>
          <label style={labelSt}>Motivo <span style={{ fontStyle: "italic" }}>(opcional)</span></label>
          <input value={form.motivo} onChange={(e) => setF("motivo", e.target.value)} placeholder="Ex: Compra, Produção PED-001…" style={inputSt} />
        </div>
        {error && <div style={{ fontSize: 12, color: theme.red, fontWeight: 600 }}>{error}</div>}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
          <button type="button" onClick={onHistorico}
            style={{ fontSize: 12, color: theme.accent, background: "none", border: "none", cursor: "pointer", padding: 0 }}>
            📋 Ver histórico
          </button>
          <div style={{ display: "flex", gap: 8 }}>
            <button type="button" onClick={onClose} style={{ ...btnBase, border: `1px solid ${theme.border(isDark)}`, background: "transparent", color: theme.txtSecondary(isDark) }}>Cancelar</button>
            <button type="submit" disabled={loading} style={{ ...btnBase, border: "none", background: theme.accent, color: theme.accentText, opacity: loading ? 0.7 : 1 }}>
              {loading ? "Registrando…" : "Registrar"}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
}

// ─── Modal: Histórico ─────────────────────────────────────────────────────────
function HistoricoModal({ item, onClose }) {
  const isDark = useDark();
  const [movs, setMovs]       = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    estoqueService.listMovimentos(item.id)
      .then(setMovs).catch(() => {}).finally(() => setLoading(false));
  }, [item.id]);

  return (
    <Modal title={`Histórico — ${item.nome}`} onClose={onClose} maxWidth={480}>
      <div style={{ fontSize: 12, color: theme.txtMuted(isDark), marginBottom: 12 }}>Últimas 50 movimentações</div>
      <div style={{ maxHeight: 380, overflowY: "auto" }}>
        {loading ? (
          <div style={{ fontSize: 13, color: theme.txtMuted(isDark) }}>Carregando…</div>
        ) : movs.length === 0 ? (
          <div style={{ fontSize: 13, color: theme.txtMuted(isDark) }}>Nenhuma movimentação registrada.</div>
        ) : (
          movs.map((m) => (
            <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "9px 0", borderBottom: `1px solid ${theme.border(isDark)}` }}>
              <span style={{ fontSize: 15, lineHeight: 1, flexShrink: 0, color: m.tipo === "entrada" ? theme.green : theme.red }}>
                {m.tipo === "entrada" ? "▲" : "▼"}
              </span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: m.tipo === "entrada" ? theme.green : theme.red }}>
                  {m.tipo === "entrada" ? "+" : "−"}{fmt(m.quantidade)} {item.unidade}
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
    </Modal>
  );
}

// ─── Modal: Confirmar exclusão ────────────────────────────────────────────────
function ConfirmDeleteModal({ item, onConfirm, onClose }) {
  const isDark = useDark();
  const [loading, setLoading] = useState(false);
  const btnBase = { padding: "8px 18px", fontSize: 13, fontWeight: 700, borderRadius: 8, cursor: "pointer" };
  return (
    <Modal title="Confirmar exclusão" onClose={onClose} maxWidth={340}>
      <div style={{ fontSize: 13, color: theme.txtSecondary(isDark), marginBottom: 20, textAlign: "center" }}>
        Remover <strong>{item.nome}</strong>? Todas as movimentações serão apagadas.
      </div>
      <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
        <button onClick={onClose} style={{ ...btnBase, border: `1px solid ${theme.border(isDark)}`, background: "transparent", color: theme.txtSecondary(isDark) }}>Cancelar</button>
        <button
          disabled={loading}
          onClick={async () => {
            setLoading(true);
            try { await estoqueService.remove(item.id); onConfirm(item.id); onClose(); }
            catch {}
            finally { setLoading(false); }
          }}
          style={{ ...btnBase, border: "none", background: theme.red, color: "#fff", opacity: loading ? 0.7 : 1 }}>
          {loading ? "Excluindo…" : "Excluir"}
        </button>
      </div>
    </Modal>
  );
}

// ─── EstoqueSection ───────────────────────────────────────────────────────────
export default function EstoqueSection() {
  const isDark = useDark();
  const { user } = useAuth();

  // Categorias compartilhadas com Compras (mesma chave localStorage)
  const [categorias] = useLocalStorage("compras_categorias", DEFAULT_CATEGORIAS);

  const canEdit   = user?.role === "admin" || user?.role === "gerente";
  const canDelete = user?.role === "admin";

  const [items,   setItems]   = useState([]);
  const [loading, setLoading] = useState(true);

  const [showCreate,  setShowCreate]  = useState(false);
  const [editTarget,  setEditTarget]  = useState(null);
  const [movTarget,   setMovTarget]   = useState(null);
  const [histTarget,  setHistTarget]  = useState(null);
  const [delTarget,   setDelTarget]   = useState(null);

  useEffect(() => {
    estoqueService.list()
      .then(setItems).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const onSaveInsumo = (op, data) => {
    if (op === "create") setItems((p) => [...p, data].sort((a, b) => a.nome.localeCompare(b.nome)));
    if (op === "update") setItems((p) => p.map((i) => i.id === data.id ? data : i).sort((a, b) => a.nome.localeCompare(b.nome)));
  };
  const onMovDone = (updated) => setItems((p) => p.map((i) => i.id === updated.id ? updated : i));
  const onDelete  = (id)      => setItems((p) => p.filter((i) => i.id !== id));

  const baixo = items.filter(isBaixo);

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
  const btnGhost = {
    padding: "4px 9px", borderRadius: 6, border: `1px solid ${theme.border(isDark)}`,
    background: "transparent", cursor: "pointer", fontSize: 11, fontWeight: 600,
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

      {/* Modais */}
      {showCreate  && <InsumoModal target={null}      categorias={categorias} onSave={onSaveInsumo} onClose={() => setShowCreate(false)} />}
      {editTarget  && <InsumoModal target={editTarget} categorias={categorias} onSave={onSaveInsumo} onClose={() => setEditTarget(null)} />}
      {movTarget   && !histTarget && (
        <MovModal
          item={movTarget}
          onDone={onMovDone}
          onHistorico={() => setHistTarget(movTarget)}
          onClose={() => setMovTarget(null)}
        />
      )}
      {histTarget  && <HistoricoModal item={histTarget} onClose={() => setHistTarget(null)} />}
      {delTarget   && <ConfirmDeleteModal item={delTarget} onConfirm={onDelete} onClose={() => setDelTarget(null)} />}

      {/* Cabeçalho da seção */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: theme.txtPrimary(isDark) }}>Estoque de Materiais</div>
          <div style={{ fontSize: 12, color: theme.txtMuted(isDark), marginTop: 2 }}>Insumos, quantidades e movimentações</div>
        </div>
        {canEdit && (
          <button
            onClick={() => setShowCreate(true)}
            title="Novo insumo"
            style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              width: 34, height: 34, borderRadius: 8, flexShrink: 0,
              border: `1px solid ${theme.accent}`, background: `${theme.accent}15`,
              color: theme.accent, cursor: "pointer", fontSize: 22, lineHeight: 1, fontWeight: 700,
            }}>
            +
          </button>
        )}
      </div>

      {/* Banner de alertas */}
      {baixo.length > 0 && (
        <div style={{ padding: "9px 14px", borderRadius: 8, background: theme.redBg(isDark), border: `1px solid ${theme.red}44`, display: "flex", alignItems: "center", gap: 8 }}>
          <span>⚠</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: theme.red }}>
            {baixo.length} insumo{baixo.length > 1 ? "s" : ""} abaixo do mínimo:{" "}
            <span style={{ fontWeight: 500 }}>{baixo.map((i) => i.nome).join(", ")}</span>
          </span>
        </div>
      )}

      {/* Tabela */}
      <div style={{ background: theme.bgCard(isDark), border: `1px solid ${theme.border(isDark)}`, borderRadius: 12, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 520 }}>
            <thead>
              <tr>
                <th style={thStyle}>Nome</th>
                <th style={thStyle}>Und.</th>
                <th style={thStyle}>Atual</th>
                <th style={thStyle}>Mínimo</th>
                <th style={thStyle}>Status</th>
                <th style={{ ...thStyle, width: 36 }}></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} style={{ padding: 28, textAlign: "center", color: theme.txtMuted(isDark), fontSize: 13 }}>Carregando…</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={6} style={{ padding: 28, textAlign: "center", color: theme.txtMuted(isDark), fontSize: 13 }}>Nenhum insumo cadastrado. Clique em + para adicionar.</td></tr>
              ) : (
                items.map((item) => {
                  const alerta = isBaixo(item);
                  return (
                    <tr key={item.id}
                      style={{ background: alerta ? theme.redBg(isDark) : "transparent" }}
                      onMouseEnter={(e) => { if (!alerta) e.currentTarget.style.background = theme.bgHover(isDark); }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = alerta ? theme.redBg(isDark) : "transparent"; }}
                    >
                      <td style={{ ...tdStyle, fontWeight: 600, color: theme.txtPrimary(isDark) }}>
                        <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 5 }}>
                          {item.categoria && (
                            <span style={{ fontSize: 10, fontWeight: 700, color: theme.accent, background: `${theme.accent}15`, padding: "1px 6px", borderRadius: 99, whiteSpace: "nowrap", flexShrink: 0 }}>
                              {item.categoria}
                            </span>
                          )}
                          <span>{item.nome}</span>
                        </div>
                        {item.observacao && <div style={{ fontSize: 11, color: theme.txtMuted(isDark), fontWeight: 400, marginTop: 1 }}>{item.observacao}</div>}
                      </td>
                      <td style={{ ...tdStyle, fontSize: 11, color: theme.txtMuted(isDark) }}>{item.unidade}</td>
                      <td style={{ ...tdStyle, fontWeight: 700, color: alerta ? theme.red : theme.txtPrimary(isDark), fontFamily: "monospace" }}>
                        {alerta && "⚠ "}{fmt(item.qtd_atual)}
                      </td>
                      <td style={{ ...tdStyle, fontFamily: "monospace" }}>{fmt(item.qtd_minima)}</td>
                      <td style={tdStyle}>
                        {alerta
                          ? <span style={{ fontSize: 11, fontWeight: 700, color: theme.red, background: theme.redBg(isDark), border: `1px solid ${theme.red}44`, borderRadius: 5, padding: "2px 7px" }}>⚠ Baixo</span>
                          : <span style={{ fontSize: 11, fontWeight: 700, color: theme.green, background: theme.greenBg(isDark), border: `1px solid ${theme.green}44`, borderRadius: 5, padding: "2px 7px" }}>✓ OK</span>
                        }
                      </td>
                      <td style={tdStyle}>
                        <div style={{ display: "flex", gap: 5 }}>
                          {canEdit  && <button onClick={() => setMovTarget(item)}   title="Registrar movimentação" style={{ ...btnGhost, color: theme.accent }}>+ Mov.</button>}
                          {canEdit  && <button onClick={() => setEditTarget(item)}  title="Editar insumo"          style={{ ...btnGhost, color: theme.blue }}>✏</button>}
                          {canDelete && <button onClick={() => setDelTarget(item)}  title="Excluir insumo"         style={{ ...btnGhost, color: theme.red }}>🗑</button>}
                          <button onClick={() => setHistTarget(item)} title="Ver histórico" style={{ ...btnGhost, color: theme.txtSecondary(isDark) }}>📋</button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Rodapé da tabela */}
        {canEdit && (
          <div style={{ padding: "10px 14px", borderTop: `1px solid ${theme.border(isDark)}`, display: "flex", alignItems: "center", gap: 12 }}>
            <button onClick={() => setShowCreate(true)} style={{ fontSize: 12, fontWeight: 600, color: theme.accent, background: "none", border: "none", cursor: "pointer", padding: 0 }}>
              + Novo insumo
            </button>
            {items.length > 0 && (
              <span style={{ fontSize: 11, color: theme.txtMuted(isDark), marginLeft: "auto" }}>
                {items.length} insumo{items.length !== 1 ? "s" : ""}{baixo.length > 0 ? ` · ${baixo.length} abaixo do mínimo` : ""}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

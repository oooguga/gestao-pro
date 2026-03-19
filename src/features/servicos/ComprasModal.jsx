// ─── ComprasModal.jsx ─────────────────────────────────────────────────────────
// ItemAutocomplete: input com dropdown filtrado conforme digitação.
// ComprasModal: modal de criação de nova compra (multi-item, por pedido ou estoque).
import { useState, useRef, useEffect } from "react";
import { useDark } from "../../context/DarkContext";
import theme from "../../theme";
import { generateId, today } from "../../utils";
import Modal from "../../components/ui/Modal";
import DInput from "../../components/ui/DInput";
import DSel from "../../components/ui/DSel";
import { FieldLabel } from "../../components/ui/Labels";
import { DEFAULT_CATEGORIAS, SectionLabel } from "./servicos.utils";
import { OrderDropdown } from "./ServicosModais";

// ─── ItemAutocomplete ─────────────────────────────────────────────────────────
function ItemAutocomplete({ value, onChange, sugestoes = [] }) {
  const isDark = useDark();
  const [open, setOpen] = useState(false);
  const ref = useRef();

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = sugestoes.filter((s) =>
    s.toLowerCase().includes(value.toLowerCase()) && s.toLowerCase() !== value.toLowerCase()
  );
  const showDropdown = open && filtered.length > 0;

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <input
        type="text" placeholder="Digite ou selecione abaixo..." value={value}
        onChange={(e) => { onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        style={{
          width: "100%", padding: "7px 10px", boxSizing: "border-box",
          background: theme.bgInput(isDark),
          border: `1px solid ${showDropdown ? theme.accent : theme.border(isDark)}`,
          borderRadius: showDropdown ? "8px 8px 0 0" : 8,
          color: theme.txtPrimary(isDark), fontSize: 13, outline: "none", transition: "border .1s",
        }}
      />
      {showDropdown && (
        <div style={{ position: "absolute", top: "100%", left: 0, right: 0, zIndex: 300, background: theme.bgCard(isDark), border: `1px solid ${theme.accent}`, borderTop: "none", borderRadius: "0 0 8px 8px", boxShadow: "0 6px 18px rgba(0,0,0,0.22)", maxHeight: 180, overflowY: "auto" }}>
          {filtered.map((s) => (
            <div key={s}
              onMouseDown={(e) => { e.preventDefault(); onChange(s); setOpen(false); }}
              style={{ padding: "8px 12px", fontSize: 13, cursor: "pointer", color: theme.txtPrimary(isDark), transition: "background .1s" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = theme.bgHover(isDark))}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              {(() => {
                const idx = s.toLowerCase().indexOf(value.toLowerCase());
                if (!value || idx === -1) return s;
                return <>{s.slice(0, idx)}<strong style={{ color: theme.accent }}>{s.slice(idx, idx + value.length)}</strong>{s.slice(idx + value.length)}</>;
              })()}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── ComprasModal ─────────────────────────────────────────────────────────────
// categorias e setCategorias são passados como props (compartilhados com EstoqueSection)
export function ComprasModal({ orders, onClose, onSave, categorias: categoriasProp, setCategorias: setCategoriasProp }) {
  const isDark = useDark();

  // Usa props se fornecidos; caso contrário usa DEFAULT_CATEGORIAS como fallback
  const categorias    = categoriasProp    ?? DEFAULT_CATEGORIAS;
  const setCategorias = setCategoriasProp ?? (() => {});

  const firstCat = categorias[0];

  // Overlay "Nova Categoria" rápida
  const [showCatAdd, setShowCatAdd]   = useState(false);
  const [newCatNome, setNewCatNome]   = useState("");
  const [newCatItens, setNewCatItens] = useState([]);
  const [newCatInput, setNewCatInput] = useState("");

  const addNewCat = () => {
    if (!newCatNome.trim()) return;
    const nova = { id: generateId(), nome: newCatNome.trim(), itens: newCatItens };
    setCategorias((prev) => [...prev, nova]);
    setForm((f) => ({ ...f, itens: f.itens.map((it) => (!it.categoria ? { ...it, categoria: nova.nome } : it)) }));
    setShowCatAdd(false); setNewCatNome(""); setNewCatItens([]); setNewCatInput("");
  };

  const createItem = () => ({ id: generateId(), categoria: firstCat?.nome || "", item: "", qtd: 1 });

  const [form, setForm] = useState({
    id: generateId(), pedidos: [], estoque: false, fornecedor: "",
    solicitacao: today(), previsao: "", obs: "", status: "Solicitado", itens: [createItem()],
  });
  const [error, setError] = useState("");
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const addItem    = () => setForm((f) => ({ ...f, itens: [...f.itens, createItem()] }));
  const removeItem = (id) => setForm((f) => ({ ...f, itens: f.itens.filter((it) => it.id !== id) }));
  const updateItem = (id, k, v) => setForm((f) => ({ ...f, itens: f.itens.map((it) => it.id === id ? { ...it, [k]: v } : it) }));

  const handleSave = () => {
    if (!form.estoque && !form.pedidos.length) { setError("Selecione pelo menos um pedido ou marque 'Para estoque'."); return; }
    if (!form.itens.length || form.itens.some((it) => !it.item.trim())) { setError("Preencha o nome de todos os itens."); return; }
    setError(""); onSave(form);
  };

  const sep = { borderTop: `1px solid ${theme.border(isDark)}`, margin: "16px 0" };

  return (
    <>
      {/* Overlay Nova Categoria */}
      {showCatAdd && (
        <div style={{ position: "fixed", inset: 0, zIndex: 400, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, background: "rgba(0,0,0,0.55)" }}>
          <div style={{ background: theme.bgCard(isDark), border: `1px solid ${theme.border(isDark)}`, borderRadius: 14, padding: 22, width: "100%", maxWidth: 380, boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: theme.txtPrimary(isDark), marginBottom: 16 }}>Nova Categoria</div>
            <div style={{ marginBottom: 12 }}><FieldLabel>Nome *</FieldLabel><DInput value={newCatNome} onChange={(e) => setNewCatNome(e.target.value)} placeholder="Ex: Parafusos" /></div>
            <div style={{ marginBottom: 14 }}>
              <FieldLabel>Itens (opcional)</FieldLabel>
              {newCatItens.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
                  {newCatItens.map((item, idx) => (
                    <span key={idx} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, background: `${theme.accent}15`, color: theme.txtPrimary(isDark), padding: "3px 8px", borderRadius: 99, border: `1px solid ${theme.accent}33` }}>
                      {item}
                      <button onClick={() => setNewCatItens((p) => p.filter((_, i) => i !== idx))} style={{ background: "none", border: "none", cursor: "pointer", color: theme.red, fontSize: 13, lineHeight: 1, padding: 0, marginLeft: 2 }}>×</button>
                    </span>
                  ))}
                </div>
              )}
              <div style={{ display: "flex", gap: 6 }}>
                <input type="text" value={newCatInput} onChange={(e) => setNewCatInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && newCatInput.trim()) { setNewCatItens((p) => [...p, newCatInput.trim()]); setNewCatInput(""); } }}
                  placeholder="Digitar item + Enter..."
                  style={{ flex: 1, padding: "7px 10px", background: theme.bgInput(isDark), border: `1px solid ${theme.border(isDark)}`, borderRadius: 8, color: theme.txtPrimary(isDark), fontSize: 13, outline: "none" }} />
                <button onClick={() => { if (newCatInput.trim()) { setNewCatItens((p) => [...p, newCatInput.trim()]); setNewCatInput(""); } }}
                  style={{ padding: "7px 12px", fontSize: 12, fontWeight: 600, borderRadius: 8, border: "none", background: `${theme.accent}20`, color: theme.accent, cursor: "pointer" }}>+ Add</button>
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button onClick={() => { setShowCatAdd(false); setNewCatNome(""); setNewCatItens([]); setNewCatInput(""); }} style={{ padding: "8px 16px", fontSize: 12, fontWeight: 600, borderRadius: 8, border: `1px solid ${theme.border(isDark)}`, background: "transparent", color: theme.txtSecondary(isDark), cursor: "pointer" }}>Cancelar</button>
              <button onClick={addNewCat} style={{ padding: "8px 18px", fontSize: 12, fontWeight: 700, borderRadius: 8, border: "none", background: theme.accent, color: "#fff", cursor: "pointer" }}>Salvar</button>
            </div>
          </div>
        </div>
      )}

      <Modal title="Nova Compra" onClose={onClose} maxWidth={640}>
        {error && <div style={{ background: theme.redBg(isDark), border: `1px solid ${theme.red}33`, borderRadius: 8, padding: "8px 12px", fontSize: 12, color: theme.red, marginBottom: 14 }}>{error}</div>}

        {/* 1. Destino */}
        <div>
          <SectionLabel>Destino</SectionLabel>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {/* Card Por Pedido */}
            <div onClick={() => set("estoque", false)} style={{ cursor: "pointer", padding: "14px 16px", borderRadius: 12, userSelect: "none", border: `${!form.estoque ? "2px" : "1px"} solid ${!form.estoque ? theme.accent : theme.border(isDark)}`, background: !form.estoque ? `${theme.accent}0e` : theme.bgInput(isDark), transition: "border .15s, background .15s", display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ display: "flex", gap: 9, alignItems: "center" }}>
                  <span style={{ fontSize: 22, lineHeight: 1 }}>📋</span>
                  <div><div style={{ fontSize: 13, fontWeight: 700, color: theme.txtPrimary(isDark) }}>Por Pedido</div><div style={{ fontSize: 11, color: theme.txtMuted(isDark), marginTop: 2 }}>Vinculado a pedido(s)</div></div>
                </div>
                {!form.estoque && <div style={{ width: 18, height: 18, borderRadius: 99, background: theme.accent, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><svg width="10" height="8" viewBox="0 0 10 8" fill="none"><polyline points="1 4 3.5 6.5 9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg></div>}
              </div>
              {!form.estoque && <div onClick={(e) => e.stopPropagation()}><FieldLabel>Id do Pedido *</FieldLabel><OrderDropdown orders={orders} value={form.pedidos} onChange={(v) => set("pedidos", v)} /></div>}
            </div>

            {/* Card Para Estoque */}
            <div onClick={() => { set("estoque", true); set("pedidos", []); }} style={{ cursor: "pointer", padding: "14px 16px", borderRadius: 12, userSelect: "none", border: `${form.estoque ? "2px" : "1px"} solid ${form.estoque ? theme.accent : theme.border(isDark)}`, background: form.estoque ? `${theme.accent}0e` : theme.bgInput(isDark), transition: "border .15s, background .15s", display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ display: "flex", gap: 9, alignItems: "center" }}>
                  <span style={{ fontSize: 22, lineHeight: 1 }}>📦</span>
                  <div><div style={{ fontSize: 13, fontWeight: 700, color: theme.txtPrimary(isDark) }}>Para Estoque</div><div style={{ fontSize: 11, color: theme.txtMuted(isDark), marginTop: 2 }}>Sem pedido específico</div></div>
                </div>
                {form.estoque && <div style={{ width: 18, height: 18, borderRadius: 99, background: theme.accent, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><svg width="10" height="8" viewBox="0 0 10 8" fill="none"><polyline points="1 4 3.5 6.5 9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg></div>}
              </div>
              {form.estoque && <div style={{ fontSize: 12, color: theme.txtSecondary(isDark), lineHeight: 1.6, padding: "8px 10px", background: `${theme.accent}0a`, borderRadius: 8, border: `1px solid ${theme.accent}22` }}>Registrada no estoque geral da fábrica, sem vínculo com um pedido de produção.</div>}
            </div>
          </div>
        </div>

        <div style={sep} />

        {/* 2. Fornecedor */}
        <div>
          <SectionLabel>Fornecedor</SectionLabel>
          <DInput value={form.fornecedor} onChange={(e) => set("fornecedor", e.target.value)} placeholder="Ex: Mercado Livre" />
        </div>

        <div style={sep} />

        {/* 3. Detalhes */}
        <div>
          <SectionLabel>Detalhes</SectionLabel>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div><FieldLabel>Solicitação</FieldLabel><DInput type="date" value={form.solicitacao} onChange={(e) => set("solicitacao", e.target.value)} /></div>
            <div><FieldLabel>Previsão</FieldLabel><DInput type="date" value={form.previsao} onChange={(e) => set("previsao", e.target.value)} /></div>
          </div>
        </div>

        <div style={sep} />

        {/* 4. Itens */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: theme.txtMuted(isDark) }}>Itens da Compra</div>
            <button onClick={() => setShowCatAdd(true)} style={{ fontSize: 11, fontWeight: 600, color: theme.accent, background: `${theme.accent}12`, border: `1px solid ${theme.accent}33`, borderRadius: 6, padding: "3px 10px", cursor: "pointer" }}>+ Nova categoria</button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {form.itens.map((it, idx) => {
              const catObj    = categorias.find((c) => c.nome === it.categoria);
              const sugestoes = catObj?.itens || [];
              const catForn   = catObj?.fornecedorNome || catObj?.contato || catObj?.link ? catObj : null;
              return (
                <div key={it.id} style={{ border: `1px solid ${theme.border(isDark)}`, borderRadius: 10, background: theme.bgCard(isDark) }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: `linear-gradient(135deg, ${theme.accent}14 0%, ${theme.accent}04 100%)`, borderBottom: `1px solid ${theme.border(isDark)}` }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 20, height: 20, borderRadius: 99, background: theme.accent, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, color: "#fff", flexShrink: 0 }}>{idx + 1}</div>
                      <span style={{ fontSize: 12, fontWeight: 600, color: it.item ? theme.txtPrimary(isDark) : theme.txtMuted(isDark) }}>{it.item || `Item ${idx + 1}`}</span>
                    </div>
                    {form.itens.length > 1 && <button onClick={() => removeItem(it.id)} style={{ background: "none", border: "none", cursor: "pointer", color: theme.red, fontSize: 11, fontWeight: 700, padding: "2px 6px", borderRadius: 5 }}>✕</button>}
                  </div>

                  {catForn && (
                    <div style={{ padding: "5px 12px", background: `${theme.accent}08`, borderBottom: `1px solid ${theme.border(isDark)}`, display: "flex", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
                      {catForn.fornecedorNome && <span style={{ fontSize: 11, color: theme.txtSecondary(isDark) }}>🏭 <strong>{catForn.fornecedorNome}</strong></span>}
                      {catForn.contato        && <span style={{ fontSize: 11, color: theme.txtSecondary(isDark) }}>📞 {catForn.contato}</span>}
                      {catForn.email          && <a href={`mailto:${catForn.email}`} style={{ fontSize: 11, color: theme.accent, textDecoration: "none" }}>✉️ {catForn.email}</a>}
                      {catForn.link           && <a href={catForn.link} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: theme.accent, textDecoration: "none" }}>🔗 Abrir link</a>}
                    </div>
                  )}

                  <div style={{ padding: "10px 12px", display: "flex", flexDirection: "column", gap: 10 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr auto", gap: 10, alignItems: "end" }}>
                      <div>
                        <FieldLabel>Categoria</FieldLabel>
                        {categorias.length > 0
                          ? <DSel value={it.categoria} options={categorias.map((c) => c.nome)} onChange={(v) => { updateItem(it.id, "categoria", v); updateItem(it.id, "item", ""); }} />
                          : <span style={{ fontSize: 11, color: theme.red }}>Sem categorias</span>}
                      </div>
                      <div>
                        <FieldLabel>Item *</FieldLabel>
                        <ItemAutocomplete value={it.item} onChange={(v) => updateItem(it.id, "item", v)} sugestoes={sugestoes} />
                      </div>
                      <div>
                        <FieldLabel>Qtd</FieldLabel>
                        <div style={{ display: "flex", border: `1px solid ${theme.border(isDark)}`, borderRadius: 8, overflow: "hidden", width: 90 }}>
                          <button onClick={() => updateItem(it.id, "qtd", Math.max(1, it.qtd - 1))} style={{ width: 28, height: 32, background: theme.bgInput(isDark), border: "none", borderRight: `1px solid ${theme.border(isDark)}`, cursor: "pointer", color: theme.txtSecondary(isDark), fontSize: 15, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>−</button>
                          <input type="number" min={1} value={it.qtd} onChange={(e) => updateItem(it.id, "qtd", Math.max(1, +e.target.value || 1))} style={{ flex: 1, width: 0, textAlign: "center", padding: 0, height: 32, background: theme.bgInput(isDark), border: "none", color: theme.txtPrimary(isDark), fontSize: 13, fontWeight: 600, outline: "none" }} />
                          <button onClick={() => updateItem(it.id, "qtd", it.qtd + 1)} style={{ width: 28, height: 32, background: theme.bgInput(isDark), border: "none", borderLeft: `1px solid ${theme.border(isDark)}`, cursor: "pointer", color: theme.accent, fontSize: 15, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
                        </div>
                      </div>
                    </div>

                    {sugestoes.length > 0 && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                        <span style={{ fontSize: 10, color: theme.txtMuted(isDark), alignSelf: "center", marginRight: 2, fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase" }}>Pré-cad.:</span>
                        {sugestoes.map((s) => {
                          const active = it.item === s;
                          return (
                            <button key={s} onClick={() => updateItem(it.id, "item", active ? "" : s)}
                              style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 99, cursor: "pointer", border: `1px solid ${active ? theme.accent : theme.border(isDark)}`, background: active ? theme.accent : theme.bgInput(isDark), color: active ? "#fff" : theme.txtSecondary(isDark), transition: "all .12s" }}>
                              {s}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <button onClick={addItem} style={{ marginTop: 10, fontSize: 12, fontWeight: 600, color: theme.accent, background: `${theme.accent}0e`, border: `1px dashed ${theme.accent}55`, borderRadius: 8, cursor: "pointer", padding: "8px 16px", width: "100%" }}>
            + Adicionar item
          </button>
        </div>

        <div style={{ marginTop: 16 }}>
          <FieldLabel>Obs</FieldLabel>
          <DInput value={form.obs} onChange={(e) => set("obs", e.target.value)} />
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20 }}>
          <button onClick={onClose} style={{ padding: "9px 18px", fontSize: 13, fontWeight: 600, borderRadius: 8, border: `1px solid ${theme.border(isDark)}`, background: "transparent", color: theme.txtSecondary(isDark), cursor: "pointer" }}>Cancelar</button>
          <button onClick={handleSave} style={{ padding: "9px 26px", fontSize: 13, fontWeight: 700, borderRadius: 8, border: "none", background: theme.accent, color: "#fff", cursor: "pointer", boxShadow: `0 4px 14px ${theme.accent}50` }}>Salvar Compra</button>
        </div>
      </Modal>
    </>
  );
}

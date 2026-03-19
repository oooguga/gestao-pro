import { useState } from "react";
import { useDark } from "../../context/DarkContext";
import theme from "../../theme";
import { OPCOES, MP_MADEIRA, MP_ELETRICA } from "../../constants";
import { generateId } from "../../utils";
import { initEtapas } from "../../data/seed";
import Card from "../../components/ui/Card";
import DInput from "../../components/ui/DInput";
import DSel from "../../components/ui/DSel";
import { SectionLabel, FieldLabel } from "../../components/ui/Labels";
import TrashButton from "../../components/ui/TrashButton";

// Cria um produto vazio para o formulário
const createEmptyProduct = () => ({
  id: generateId(),
  produto: "",
  codigo: "",
  qtd: 1,
  larg: "", prof: "", alt: "",
  aco: "Preto",
  aco_custom: "",
  madeira_cfg: "N/A",
  madeira_items: [],
  couro: "N/A",
  eletrica_cfg: "N/A",
  eletrica_items: [],
  obs: "",
  etapas: initEtapas(),
});

export default function NovoPedido({ onSave, editOrder, onCancelEdit }) {
  const isDark = useDark();
  const isEditing = !!editOrder;

  const [form, setForm] = useState(
    editOrder
      ? { id: editOrder.id, cliente: editOrder.cliente, entrega: editOrder.entrega }
      : { id: `PED-${generateId()}`, cliente: "", entrega: "" }
  );
  const [products, setProducts] = useState(
    editOrder ? editOrder.produtos : [createEmptyProduct()]
  );
  const [error, setError] = useState("");
  const [confirmClear, setConfirmClear] = useState(false);

  // ─── Helpers de produto ───────────────────────────────────────────────────
  const updateProduct = (index, key, value) =>
    setProducts((prev) => prev.map((p, i) => (i === index ? { ...p, [key]: value } : p)));

  // ─── Madeira ──────────────────────────────────────────────────────────────
  const setMadeiraCfg = (index, value) =>
    setProducts((prev) =>
      prev.map((p, i) =>
        i !== index ? p : {
          ...p,
          madeira_cfg: value,
          madeira_items:
            value === "Sim" && p.madeira_items.length === 0
              ? [{ mp: MP_MADEIRA[0], larg: "", comp: "", qtd: 1 }]
              : p.madeira_items,
        }
      )
    );

  const addMadeiraItem = (index) =>
    setProducts((prev) =>
      prev.map((p, i) =>
        i === index
          ? { ...p, madeira_items: [...p.madeira_items, { mp: MP_MADEIRA[0], larg: "", comp: "", qtd: 1 }] }
          : p
      )
    );

  const updateMadeiraItem = (productIndex, itemIndex, key, value) =>
    setProducts((prev) =>
      prev.map((p, i) =>
        i !== productIndex ? p : {
          ...p,
          madeira_items: p.madeira_items.map((m, j) => (j === itemIndex ? { ...m, [key]: value } : m)),
        }
      )
    );

  const removeMadeiraItem = (productIndex, itemIndex) =>
    setProducts((prev) =>
      prev.map((p, i) =>
        i !== productIndex ? p : { ...p, madeira_items: p.madeira_items.filter((_, j) => j !== itemIndex) }
      )
    );

  // ─── Elétrica ─────────────────────────────────────────────────────────────
  const setEletricaCfg = (index, value) =>
    setProducts((prev) =>
      prev.map((p, i) =>
        i !== index ? p : {
          ...p,
          eletrica_cfg: value,
          eletrica_items:
            value === "Sim" && p.eletrica_items.length === 0
              ? [{ mp: MP_ELETRICA[0], item: "", qtd: 1, custom: "" }]
              : p.eletrica_items,
        }
      )
    );

  const addEletricaItem = (index) =>
    setProducts((prev) =>
      prev.map((p, i) =>
        i === index
          ? { ...p, eletrica_items: [...p.eletrica_items, { mp: MP_ELETRICA[0], item: "", qtd: 1, custom: "" }] }
          : p
      )
    );

  const updateEletricaItem = (productIndex, itemIndex, key, value) =>
    setProducts((prev) =>
      prev.map((p, i) =>
        i !== productIndex ? p : {
          ...p,
          eletrica_items: p.eletrica_items.map((e, j) => (j === itemIndex ? { ...e, [key]: value } : e)),
        }
      )
    );

  const removeEletricaItem = (productIndex, itemIndex) =>
    setProducts((prev) =>
      prev.map((p, i) =>
        i !== productIndex ? p : { ...p, eletrica_items: p.eletrica_items.filter((_, j) => j !== itemIndex) }
      )
    );

  // ─── Salvar ───────────────────────────────────────────────────────────────
  const handleSave = () => {
    if (!form.cliente || !form.entrega)
      return setError("Preencha o Cliente e a Data de Entrega.");
    if (!products.length || products.some((p) => !p.produto.trim()))
      return setError("Cadastre ao menos um produto com nome.");

    onSave({ ...form, produtos: products });
    setForm({ id: `PED-${generateId()}`, cliente: "", entrega: "" });
    setProducts([createEmptyProduct()]);
    setError("");
  };

  const clearAll = () => {
    setForm({ id: `PED-${generateId()}`, cliente: "", entrega: "" });
    setProducts([createEmptyProduct()]);
    setError("");
    setConfirmClear(false);
  };

  // ─── Estilos compartilhados ───────────────────────────────────────────────
  const subSectionStyle = {
    background: theme.bgInput(isDark),
    borderRadius: 8,
    padding: "12px 14px",
    border: `1px solid ${theme.border(isDark)}`,
    borderLeft: `3px solid ${theme.accent}55`,
    marginBottom: 12,
  };

  const subItemCardStyle = {
    background: theme.bgCard(isDark),
    borderRadius: 8,
    padding: "10px 12px",
    border: `1px solid ${theme.border(isDark)}`,
  };

  return (
    <div style={{ maxWidth: 700, margin: "0 auto", display: "flex", flexDirection: "column", gap: 16 }}>

      {/* ─── Cabeçalho ─── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {isEditing && (
            <button
              onClick={onCancelEdit}
              style={{ background: "none", border: "none", cursor: "pointer", color: theme.txtSecondary(isDark), padding: 4, display: "flex", alignItems: "center" }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
          )}
          <h2 style={{ fontSize: 20, fontWeight: 700, color: theme.txtPrimary(isDark), margin: 0 }}>
            {isEditing ? "Editar Pedido" : "Novo Pedido"}
          </h2>
        </div>

        {/* Botão Limpar */}
        <div style={{ position: "relative" }}>
          <button
            onClick={() => setConfirmClear(true)}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 12px", borderRadius: 8, border: `1px solid ${theme.red}55`, background: theme.redBg(isDark), color: theme.red, cursor: "pointer", fontSize: 12, fontWeight: 600 }}
          >
            Limpar
          </button>
          {confirmClear && (
            <div style={{ position: "absolute", right: 0, top: "calc(100% + 8px)", background: theme.bgCard(isDark), border: `1px solid ${theme.red}66`, borderRadius: 10, padding: "14px 16px", zIndex: 50, minWidth: 220, boxShadow: "0 8px 24px rgba(0,0,0,0.25)" }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: theme.txtPrimary(isDark), margin: "0 0 6px" }}>Apagar todos os dados?</p>
              <p style={{ fontSize: 11, color: theme.txtSecondary(isDark), margin: "0 0 14px" }}>Esta ação não pode ser desfeita.</p>
              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                <button onClick={() => setConfirmClear(false)} style={{ padding: "6px 14px", fontSize: 12, fontWeight: 600, borderRadius: 7, border: `1px solid ${theme.border(isDark)}`, background: "transparent", color: theme.txtSecondary(isDark), cursor: "pointer" }}>Cancelar</button>
                <button onClick={clearAll} style={{ padding: "6px 14px", fontSize: 12, fontWeight: 700, borderRadius: 7, border: "none", background: theme.red, color: "#fff", cursor: "pointer" }}>Apagar</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ─── Erro ─── */}
      {error && (
        <div style={{ background: theme.redBg(isDark), border: `1px solid ${theme.red}33`, borderRadius: 8, padding: "10px 14px", fontSize: 12, color: theme.red }}>
          {error}
        </div>
      )}

      {/* ─── Dados do Pedido ─── */}
      <Card style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "12px 20px", borderBottom: `1px solid ${theme.border(isDark)}`, background: `linear-gradient(135deg, ${theme.accent}12 0%, ${theme.accent}04 100%)` }}>
          <SectionLabel>Dados do Pedido</SectionLabel>
        </div>
        <div style={{ padding: "16px 20px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>
            {[["ID do Pedido *", "id"], ["Cliente *", "cliente"], ["Data de Entrega *", "entrega"]].map(([label, key]) => (
              <div key={key}>
                <FieldLabel>{label}</FieldLabel>
                <DInput
                  type={key === "entrega" ? "date" : "text"}
                  value={form[key]}
                  onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                />
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* ─── Produtos ─── */}
      {products.map((product, i) => (
        <Card key={product.id} style={{ padding: 0, overflow: "hidden" }}>

          {/* Header do produto */}
          <div style={{
            padding: "12px 20px",
            borderBottom: `1px solid ${theme.border(isDark)}`,
            background: `linear-gradient(135deg, ${theme.accent}14 0%, ${theme.accent}04 100%)`,
            display: "flex", justifyContent: "space-between", alignItems: "center",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 24, height: 24, borderRadius: 99, background: theme.accent, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: theme.accentText, flexShrink: 0 }}>
                {i + 1}
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, color: product.produto ? theme.txtPrimary(isDark) : theme.txtMuted(isDark) }}>
                {product.produto || `Produto ${i + 1}`}
              </span>
            </div>
            {products.length > 1 && (
              <button
                onClick={() => setProducts((ps) => ps.filter((_, j) => j !== i))}
                style={{ fontSize: 11, color: theme.red, background: `${theme.red}12`, border: `1px solid ${theme.red}33`, borderRadius: 6, cursor: "pointer", fontWeight: 600, padding: "3px 10px" }}
              >
                ✕ Remover
              </button>
            )}
          </div>

          {/* Conteúdo do produto */}
          <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 0 }}>

            {/* Identificação */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginBottom: 14 }}>
              <div><FieldLabel>Produto *</FieldLabel><DInput value={product.produto} onChange={(e) => updateProduct(i, "produto", e.target.value)} /></div>
              <div><FieldLabel>Código</FieldLabel><DInput value={product.codigo} onChange={(e) => updateProduct(i, "codigo", e.target.value)} /></div>
              <div>
                <FieldLabel>Quantidade</FieldLabel>
                <div style={{ display: "flex", border: `1px solid ${theme.border(isDark)}`, borderRadius: 8, overflow: "hidden" }}>
                  <button
                    onClick={() => updateProduct(i, "qtd", Math.max(1, product.qtd - 1))}
                    style={{ width: 32, height: 34, background: theme.bgInput(isDark), border: "none", borderRight: `1px solid ${theme.border(isDark)}`, cursor: "pointer", color: theme.txtSecondary(isDark), fontSize: 16, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}
                  >−</button>
                  <input
                    type="number" min={1} value={product.qtd}
                    onChange={(e) => updateProduct(i, "qtd", Math.max(1, +e.target.value || 1))}
                    style={{ flex: 1, textAlign: "center", padding: 0, height: 34, background: theme.bgInput(isDark), border: "none", color: theme.txtPrimary(isDark), fontSize: 13, fontWeight: 600, outline: "none" }}
                  />
                  <button
                    onClick={() => updateProduct(i, "qtd", product.qtd + 1)}
                    style={{ width: 32, height: 34, background: theme.bgInput(isDark), border: "none", borderLeft: `1px solid ${theme.border(isDark)}`, cursor: "pointer", color: theme.accent, fontSize: 16, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}
                  >+</button>
                </div>
              </div>
            </div>

            {/* Dimensões */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 12, marginBottom: 16 }}>
              {[["Largura (mm)", "larg"], ["Profundidade (mm)", "prof"], ["Altura (mm)", "alt"]].map(([label, key]) => (
                <div key={key}><FieldLabel>{label}</FieldLabel><DInput type="number" value={product[key]} onChange={(e) => updateProduct(i, key, e.target.value)} /></div>
              ))}
            </div>

            {/* Aço e Couro */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 0 }}>
              <div style={subSectionStyle}>
                <FieldLabel>Aço</FieldLabel>
                <DSel value={product.aco} options={["Preto", "Branco", "Personalizado"]} onChange={(v) => updateProduct(i, "aco", v)} />
                {product.aco === "Personalizado" && (
                  <DInput style={{ marginTop: 8 }} value={product.aco_custom} onChange={(e) => updateProduct(i, "aco_custom", e.target.value)} placeholder="Cor personalizada" />
                )}
              </div>
              <div style={subSectionStyle}>
                <FieldLabel>Couro</FieldLabel>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <DSel value={product.couro} options={["N/A", "Preto", "Marrom"]} onChange={(v) => updateProduct(i, "couro", v)} />
                  <button
                    type="button"
                    title="Adicionar nova opção"
                    style={{ flexShrink: 0, width: 24, height: 24, borderRadius: "50%", border: `1px dashed ${theme.accent}`, background: `${theme.accent}12`, color: theme.accent, cursor: "default", fontSize: 14, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", opacity: 0.7 }}
                  >+</button>
                </div>
              </div>
            </div>

            {/* Madeira */}
            <div style={subSectionStyle}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: product.madeira_cfg === "Sim" ? 12 : 0 }}>
                <FieldLabel>Madeira</FieldLabel>
                <DSel value={product.madeira_cfg} options={["N/A", "Sim"]} onChange={(v) => setMadeiraCfg(i, v)} />
              </div>
              {product.madeira_cfg === "Sim" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {product.madeira_items.map((item, mi) => (
                    <div key={mi} style={subItemCardStyle}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                        <span style={{ fontSize: 11, fontWeight: 600, color: theme.accent }}>Item {mi + 1}</span>
                        {mi > 0 && <TrashButton onClick={() => removeMadeiraItem(i, mi)} />}
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))", gap: 8 }}>
                        <div style={{ gridColumn: "1 / -1" }}>
                          <FieldLabel>Matéria-prima</FieldLabel>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <DSel value={item.mp} options={MP_MADEIRA} onChange={(v) => updateMadeiraItem(i, mi, "mp", v)} />
                            <button
                              type="button"
                              title="Adicionar nova opção"
                              style={{ flexShrink: 0, width: 24, height: 24, borderRadius: "50%", border: `1px dashed ${theme.accent}`, background: `${theme.accent}12`, color: theme.accent, cursor: "default", fontSize: 14, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", opacity: 0.7 }}
                            >+</button>
                          </div>
                        </div>
                        <div><FieldLabel>Largura (mm)</FieldLabel><DInput type="number" value={item.larg} onChange={(e) => updateMadeiraItem(i, mi, "larg", e.target.value)} /></div>
                        <div><FieldLabel>Comprimento (mm)</FieldLabel><DInput type="number" value={item.comp} onChange={(e) => updateMadeiraItem(i, mi, "comp", e.target.value)} /></div>
                        <div><FieldLabel>Qtd</FieldLabel>
                          <div style={{ display: "flex", border: `1px solid ${theme.border(isDark)}`, borderRadius: 8, overflow: "hidden" }}>
                            <button onClick={() => updateMadeiraItem(i, mi, "qtd", Math.max(1, item.qtd - 1))} style={{ width: 28, height: 32, background: theme.bgInput(isDark), border: "none", borderRight: `1px solid ${theme.border(isDark)}`, cursor: "pointer", color: theme.txtSecondary(isDark), fontSize: 14, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>−</button>
                            <input type="number" min={1} value={item.qtd} onChange={(e) => updateMadeiraItem(i, mi, "qtd", Math.max(1, +e.target.value || 1))} style={{ flex: 1, textAlign: "center", padding: 0, height: 32, background: theme.bgInput(isDark), border: "none", color: theme.txtPrimary(isDark), fontSize: 13, fontWeight: 600, outline: "none" }} />
                            <button onClick={() => updateMadeiraItem(i, mi, "qtd", item.qtd + 1)} style={{ width: 28, height: 32, background: theme.bgInput(isDark), border: "none", borderLeft: `1px solid ${theme.border(isDark)}`, cursor: "pointer", color: theme.accent, fontSize: 14, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  <button onClick={() => addMadeiraItem(i)} style={{ fontSize: 12, color: theme.accent, background: `${theme.accent}0e`, border: `1px dashed ${theme.accent}55`, borderRadius: 7, cursor: "pointer", fontWeight: 600, padding: "6px 14px", alignSelf: "flex-start" }}>
                    + item de madeira
                  </button>
                </div>
              )}
            </div>

            {/* Elétrica */}
            <div style={subSectionStyle}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: product.eletrica_cfg === "Sim" ? 12 : 0 }}>
                <FieldLabel>Elétrica</FieldLabel>
                <DSel value={product.eletrica_cfg} options={["N/A", "Sim"]} onChange={(v) => setEletricaCfg(i, v)} />
              </div>
              {product.eletrica_cfg === "Sim" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {product.eletrica_items.map((item, ei) => (
                    <div key={ei} style={subItemCardStyle}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                        <span style={{ fontSize: 11, fontWeight: 600, color: theme.accent }}>Item {ei + 1}</span>
                        {ei > 0 && <TrashButton onClick={() => removeEletricaItem(i, ei)} />}
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 8 }}>
                        <div style={{ gridColumn: item.mp === "Personalizado" ? "1 / 2" : "1 / -1" }}>
                          <FieldLabel>Matéria-prima</FieldLabel>
                          <DSel value={item.mp} options={MP_ELETRICA} onChange={(v) => updateEletricaItem(i, ei, "mp", v)} />
                        </div>
                        {item.mp === "Personalizado" && (
                          <div><FieldLabel>Descrição</FieldLabel><DInput value={item.custom} onChange={(e) => updateEletricaItem(i, ei, "custom", e.target.value)} placeholder="Descreva o item" /></div>
                        )}
                        <div><FieldLabel>Qtd</FieldLabel>
                          <div style={{ display: "flex", border: `1px solid ${theme.border(isDark)}`, borderRadius: 8, overflow: "hidden" }}>
                            <button onClick={() => updateEletricaItem(i, ei, "qtd", Math.max(1, item.qtd - 1))} style={{ width: 28, height: 32, background: theme.bgInput(isDark), border: "none", borderRight: `1px solid ${theme.border(isDark)}`, cursor: "pointer", color: theme.txtSecondary(isDark), fontSize: 14, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>−</button>
                            <input type="number" min={1} value={item.qtd} onChange={(e) => updateEletricaItem(i, ei, "qtd", Math.max(1, +e.target.value || 1))} style={{ flex: 1, textAlign: "center", padding: 0, height: 32, background: theme.bgInput(isDark), border: "none", color: theme.txtPrimary(isDark), fontSize: 13, fontWeight: 600, outline: "none" }} />
                            <button onClick={() => updateEletricaItem(i, ei, "qtd", item.qtd + 1)} style={{ width: 28, height: 32, background: theme.bgInput(isDark), border: "none", borderLeft: `1px solid ${theme.border(isDark)}`, cursor: "pointer", color: theme.accent, fontSize: 14, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  <button onClick={() => addEletricaItem(i)} style={{ fontSize: 12, color: theme.accent, background: `${theme.accent}0e`, border: `1px dashed ${theme.accent}55`, borderRadius: 7, cursor: "pointer", fontWeight: 600, padding: "6px 14px", alignSelf: "flex-start" }}>
                    + item elétrico
                  </button>
                </div>
              )}
            </div>

            {/* Observação */}
            <div>
              <FieldLabel>Observação</FieldLabel>
              <textarea
                value={product.obs}
                onChange={(e) => updateProduct(i, "obs", e.target.value)}
                rows={3}
                style={{ width: "100%", boxSizing: "border-box", background: theme.bgInput(isDark), color: theme.txtPrimary(isDark), border: `1px solid ${theme.border(isDark)}`, borderRadius: 8, padding: "8px 12px", fontSize: 13, resize: "vertical", outline: "none", fontFamily: "inherit" }}
              />
            </div>

          </div>
        </Card>
      ))}

      {/* ─── Ações ─── */}
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
        <button
          onClick={() => setProducts((ps) => [...ps, createEmptyProduct()])}
          style={{ padding: "9px 18px", fontSize: 13, fontWeight: 600, border: `1px solid ${theme.accent}55`, borderRadius: 8, background: `${theme.accent}0e`, color: theme.accent, cursor: "pointer" }}
        >
          + Produto
        </button>
        <button
          onClick={handleSave}
          style={{ padding: "9px 28px", fontSize: 13, fontWeight: 700, border: "none", borderRadius: 8, background: theme.accent, color: theme.accentText, cursor: "pointer", boxShadow: `0 4px 16px ${theme.accent}55` }}
        >
          {isEditing ? "Salvar Alterações" : "Salvar Pedido"}
        </button>
      </div>

    </div>
  );
}

// ─── ServicosModais.jsx ───────────────────────────────────────────────────────
// Modais do módulo de Serviços:
// ConferenciaModal, FornecedoresConfig, OrderDropdown, ServiceModal
import { useState, useRef, useMemo, useEffect } from "react";
import { useDark } from "../../context/DarkContext";
import theme from "../../theme";
import { generateId, today } from "../../utils";
import Modal from "../../components/ui/Modal";
import DInput from "../../components/ui/DInput";
import DSel from "../../components/ui/DSel";
import { FieldLabel } from "../../components/ui/Labels";
import TrashButton from "../../components/ui/TrashButton";
import { DEFAULT_FORNECEDORES, DEFAULT_SHEETS_URL, addDays, nameToColor, getInitials, AddCard, SectionLabel, parseSheetsUrl, fetchLoteDaPlanilha, createFornecedorSheet } from "./servicos.utils";

// ─── loadImageAsBase64 ────────────────────────────────────────────────────────
// Carrega uma imagem via URL e retorna sua representação base64 (para jsPDF).
// Retorna null silenciosamente se a imagem não carregar.
function loadImageAsBase64(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width  = img.naturalWidth;
      canvas.height = img.naturalHeight;
      canvas.getContext("2d").drawImage(img, 0, 0);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

// ─── buildPdfDoc ──────────────────────────────────────────────────────────────
// Gera documento jsPDF da conferência de recebimento. Carregamento sob-demanda.
async function buildPdfDoc(row, itens) {
  const { default: jsPDF }     = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");

  const dateStr    = new Date().toLocaleDateString("pt-BR");
  const codigos    = Array.isArray(row.codigos) && row.codigos.length
    ? row.codigos.map((v) => v.split("/")[1] || v).join(", ")
    : null;

  const doc  = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const blue = [55, 85, 130];
  const L = 20, R = 190, W = 170;

  // ── Logo — discreta, tipo marca d'água ────────────────────────────────────
  const logoH = 6, logoY = 9;

  // Carraro PNG — topo esquerdo
  try {
    const logoB64 = await loadImageAsBase64("/carraro.png");
    if (logoB64) doc.addImage(logoB64, "PNG", L, logoY, logoH, logoH);
  } catch {}

  // Badge DUCOR — topo direito, só texto, preto 70% opacidade
  const bW = 18, bX = R - bW;
  doc.setGState(new doc.GState({ opacity: 0.7 }));
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0);
  doc.text("DUCOR", bX + bW / 2, logoY + 4.5, { align: "center" });
  doc.setGState(new doc.GState({ opacity: 1 }));

  // ── Separador + Título ────────────────────────────────────────────────────
  doc.setDrawColor(...blue);
  doc.setLineWidth(0.6);
  doc.line(L, 21, R, 21);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...blue);
  doc.text("CONFERÊNCIA DE RECEBIMENTO", L, 27);

  doc.setLineWidth(0.4);
  doc.line(L, 30, R, 30);

  // ── Informações ───────────────────────────────────────────────────────────
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0);
  const infoLines = [
    [`Lote: ${row.lote || "—"}`, `Fornecedor: ${row.fornecedor || "—"}`, `Data: ${dateStr}`],
    [`Pedido(s): ${(row.pedidos || []).join(", ") || "—"}`, "", ""],
    ...(codigos ? [[`Produto(s): ${codigos}`, "", ""]] : []),
  ];
  let y = 35;
  infoLines.forEach(([a, b, c]) => {
    doc.text(a, L, y);
    if (b) doc.text(b, 80, y);
    if (c) doc.text(c, 150, y);
    y += 5;
  });

  // ── Tabela ────────────────────────────────────────────────────────────────
  const codigosUnicos = new Set(itens.map((it) => it.codigo)).size;
  autoTable(doc, {
    startY: y + 2,
    head: [["CÓDIGO", "QUANTIA", "CHECK", "OBS"]],
    body: itens.map((it) => [
      it.codigo,
      it.quantia,
      "[ ]",
      "",
    ]),
    headStyles: { fillColor: blue, fontStyle: "bold", fontSize: 9, textColor: [255, 255, 255] },
    bodyStyles: { fontSize: 9, font: "courier", textColor: [0, 0, 0] },
    styles: { cellPadding: 3 },
    columnStyles: {
      0: { cellWidth: W * 0.46, halign: "left",   cellPadding: { top: 3, right: 3, bottom: 3, left: 2 } },
      1: { cellWidth: W * 0.18, halign: "center", fontStyle: "bold" },
      2: { cellWidth: W * 0.18, halign: "center", lineWidth: { top: 0, right: 0, bottom: 0, left: 0.4 }, lineColor: [217, 217, 217] },
      3: { cellWidth: W * 0.18, halign: "center", lineWidth: { top: 0, right: 0, bottom: 0, left: 0.4 }, lineColor: [217, 217, 217] },
    },
    margin: { left: L, right: 20 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    didParseCell: (data) => {
      // Centraliza cabeçalhos das colunas 1, 2 e 3
      if (data.section === "head" && data.column.index >= 1) {
        data.cell.styles.halign = "center";
      }
      // Destaque vermelho em OBS quando diverge
      if (data.column.index === 3 && data.section === "body") {
        const it = itens[data.row.index];
        if (it?.qtdRecebida && it.qtdRecebida !== it.quantia) {
          data.cell.styles.textColor = [220, 38, 38];
          data.cell.styles.fontStyle = "bold";
        }
      }
    },
  });

  // ── Rodapé ────────────────────────────────────────────────────────────────
  const finalY = doc.lastAutoTable.finalY + 6;
  doc.setDrawColor(0);
  doc.setLineWidth(0.3);
  doc.line(L, finalY, R, finalY);
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  doc.text(`Componentes: ${codigosUnicos}`, L, finalY + 5);
  doc.text("Assinatura: ___________________________", 110, finalY + 5);
  return doc;
}

// ─── ConferenciaModal ─────────────────────────────────────────────────────────
// Auto-importa itens da planilha e gera PDF para conferência física na fábrica.
export function ConferenciaModal({ row, sheetsUrl, sheetGid, onUpdate, onClose }) {
  const isDark = useDark();
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState("");
  const [itens,      setItens]      = useState(null);
  const [pdfLoading, setPdfLoading] = useState(false);

  // Busca automática ao abrir
  useEffect(() => {
    const run = async () => {
      // Garante URL publicada: se a URL recebida não for publicada, usa DEFAULT_SHEETS_URL
      const parsed = parseSheetsUrl(sheetsUrl);
      const urlEfetiva = parsed.isPublished ? sheetsUrl : DEFAULT_SHEETS_URL;
      const { sheetId, publishedId } = parseSheetsUrl(urlEfetiva);
      if (!sheetId && !publishedId) { setError("URL da planilha não configurada. Acesse ⚙ Configurações."); setLoading(false); return; }
      if (!sheetGid) { setError(`GID da aba do fornecedor "${row.fornecedor}" não configurado em ⚙ Fornecedores.`); setLoading(false); return; }
      if (!row.lote?.trim()) { setError("Este serviço não tem Lote preenchido."); setLoading(false); return; }
      try {
        const found = await fetchLoteDaPlanilha(urlEfetiva, sheetGid, row.lote);
        if (!found.length) { setError(`Nenhum item encontrado para o lote "${row.lote}" na planilha.`); setLoading(false); return; }
        setItens(found);
        onUpdate({ planilhaItens: found });
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const filename   = `${row.lote} - ${(row.fornecedor || "").toUpperCase()}`;
  const dateStr    = new Date().toLocaleDateString("pt-BR");

  const handlePdf = async (mode) => {
    if (pdfLoading || !itens) return;
    setPdfLoading(true);
    try {
      const doc = await buildPdfDoc(row, itens);
      if (mode === "view")     window.open(doc.output("bloburl"), "_blank");
      else                     doc.save(`${filename}.pdf`);
    } catch (e) {
      alert(`Erro ao gerar PDF: ${e.message}`);
    } finally {
      setPdfLoading(false);
    }
  };

  return (
    <Modal title={`Conferência — ${row.lote || "Lote"}`} onClose={onClose} maxWidth={640}>
      {/* Loading */}
      {loading && (
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "24px 0", color: theme.txtMuted(isDark) }}>
          <div style={{ width: 22, height: 22, border: `3px solid ${theme.accentDim}`, borderTopColor: theme.accent, borderRadius: "50%", animation: "spin .7s linear infinite", flexShrink: 0 }} />
          <span style={{ fontSize: 13 }}>Buscando itens do lote <strong>{row.lote}</strong> na planilha...</span>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {/* Erro */}
      {!loading && error && (
        <div style={{ padding: "12px 16px", background: theme.redBg(isDark), border: `1px solid ${theme.red}33`, borderRadius: 8, color: theme.red, fontSize: 13, marginBottom: 8 }}>
          ⚠ {error}
        </div>
      )}

      {/* Itens encontrados */}
      {!loading && itens && (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 14 }}>
            <span style={{ fontSize: 13, color: theme.green, fontWeight: 700 }}>✓ {itens.length} itens encontrados</span>
            <span style={{ fontSize: 12, color: theme.txtMuted(isDark) }}>— Lote: {row.lote} | {row.fornecedor} | {dateStr}</span>
          </div>
          <div style={{ maxHeight: 360, overflowY: "auto", border: `1px solid ${theme.border(isDark)}`, borderRadius: 10, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ background: "#1f4791", color: "#fff" }}>
                  <th style={{ padding: "8px 12px", textAlign: "left" }}>CÓDIGO</th>
                  <th style={{ padding: "8px 12px", textAlign: "center", width: 90 }}>QUANTIA</th>
                </tr>
              </thead>
              <tbody>
                {itens.map((it, i) => (
                  <tr key={it.id} style={{ background: i % 2 === 0 ? theme.bgInput(isDark) : "transparent" }}>
                    <td style={{ padding: "7px 12px", fontFamily: "monospace", fontWeight: 700, color: theme.txtPrimary(isDark), borderBottom: `1px solid ${theme.border(isDark)}` }}>{it.codigo}</td>
                    <td style={{ padding: "7px 12px", textAlign: "center", color: theme.txtSecondary(isDark), borderBottom: `1px solid ${theme.border(isDark)}` }}>{it.quantia}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Rodapé */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 20, paddingTop: 16, borderTop: `1px solid ${theme.border(isDark)}` }}>
        <button onClick={onClose}
          style={{ padding: "8px 18px", fontSize: 13, fontWeight: 600, borderRadius: 8, border: `1px solid ${theme.border(isDark)}`, background: "transparent", color: theme.txtSecondary(isDark), cursor: "pointer" }}>
          Fechar
        </button>
        {itens && (
          <div style={{ display: "flex", gap: 8 }}>
            <button
              disabled={pdfLoading}
              title="Abrir visualização do PDF em nova aba"
              onClick={() => handlePdf("view")}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", fontSize: 13, fontWeight: 700, borderRadius: 8, border: `1px solid ${theme.accent}`, background: "transparent", color: theme.accent, cursor: pdfLoading ? "wait" : "pointer", opacity: pdfLoading ? 0.6 : 1 }}>
              {pdfLoading ? "⏳" : "👁"} Visualizar
            </button>
            <button
              disabled={pdfLoading}
              title={`Salvar como ${filename}.pdf`}
              onClick={() => handlePdf("save")}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", fontSize: 13, fontWeight: 700, borderRadius: 8, border: "none", background: theme.accent, color: "#fff", cursor: pdfLoading ? "wait" : "pointer", opacity: pdfLoading ? 0.6 : 1, boxShadow: `0 4px 14px ${theme.accent}50` }}>
              {pdfLoading ? "⏳" : "⬇"} Baixar PDF
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
}

// ─── FornecedorCard ───────────────────────────────────────────────────────────
function FornecedorCard({ forn, onClick }) {
  const isDark = useDark();
  const [hov, setHov] = useState(false);
  const color = nameToColor(forn.nome);
  const initials = getInitials(forn.nome);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        width: 128, height: 148, borderRadius: 12, cursor: "pointer", flexShrink: 0,
        background: theme.bgCard(isDark),
        border: `1px solid ${hov ? color : theme.border(isDark)}`,
        boxShadow: hov ? `0 4px 14px ${color}40` : "none",
        display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center", gap: 7, padding: "12px 8px",
        position: "relative", transition: "all .15s", userSelect: "none",
      }}
    >
      <span style={{ position: "absolute", top: 7, right: 9, fontSize: 13, color: hov ? color : theme.txtMuted(isDark), transition: "color .15s" }}>✏</span>
      {forn.foto ? (
        <img src={forn.foto} alt={forn.nome} style={{ width: 62, height: 62, borderRadius: "50%", objectFit: "cover", border: `2px solid ${color}` }} />
      ) : (
        <div style={{ width: 62, height: 62, borderRadius: "50%", background: color, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 21, fontWeight: 700, color: "#fff", letterSpacing: "-0.02em" }}>{initials}</div>
      )}
      <span style={{ fontSize: 12, fontWeight: 700, color: theme.txtPrimary(isDark), textAlign: "center", lineHeight: 1.3, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{forn.nome}</span>
    </div>
  );
}

// ─── FornecedorModal ──────────────────────────────────────────────────────────
function FornecedorModal({ forn, gasUrl, onSave, onDelete, onClose }) {
  const isDark = useDark();
  const fileRef = useRef();
  const isNew = !forn;
  const [form, setForm] = useState(forn ? { ...forn } : { id: generateId(), nome: "", endereco: "", prazoMedio: "", contato: "", email: "", foto: "", sheetGid: "" });
  const setF = (k, v) => setForm((prev) => ({ ...prev, [k]: v }));
  const [gasLoading, setGasLoading] = useState(false);
  const [gasError, setGasError]     = useState("");
  const [savedOk, setSavedOk]       = useState(false);
  const handlePhoto = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setF("foto", ev.target.result);
    reader.readAsDataURL(file);
  };
  const handleSave = async () => {
    const nome = form.nome.trim();
    const prazo = parseInt(form.prazoMedio, 10);
    if (!nome || isNaN(prazo) || prazo <= 0) return;
    const baseForm = { ...form, nome, prazoMedio: prazo };
    if (isNew && gasUrl && !baseForm.sheetGid) {
      setGasLoading(true);
      setGasError("");
      try {
        const gid = await createFornecedorSheet(gasUrl, nome);
        onSave({ ...baseForm, sheetGid: gid });
        onClose();
      } catch (e) {
        setGasError(`Aba não criada na planilha: ${e.message}. Fornecedor salvo sem GID.`);
        onSave(baseForm);
        setSavedOk(true);
      } finally {
        setGasLoading(false);
      }
      return;
    }
    onSave(baseForm);
    onClose();
  };
  const color = nameToColor(form.nome);
  const initials = getInitials(form.nome);
  const btnBase = { padding: "8px 18px", fontSize: 13, fontWeight: 600, borderRadius: 8, cursor: "pointer" };
  return (
    <Modal title={isNew ? "Novo Fornecedor" : "Editar Fornecedor"} onClose={onClose}>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "flex", justifyContent: "center" }}>
          <div onClick={() => fileRef.current?.click()} title="Clique para alterar foto" style={{ position: "relative", cursor: "pointer" }}>
            {form.foto ? (
              <img src={form.foto} alt={form.nome} style={{ width: 80, height: 80, borderRadius: "50%", objectFit: "cover", border: `3px solid ${color}` }} />
            ) : (
              <div style={{ width: 80, height: 80, borderRadius: "50%", background: color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, fontWeight: 700, color: "#fff" }}>{initials}</div>
            )}
            <div style={{ position: "absolute", bottom: 0, right: 0, width: 24, height: 24, borderRadius: "50%", background: isDark ? "#334155" : "#e2e8f0", border: `2px solid ${isDark ? "#0f172a" : "#fff"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11 }}>📷</div>
          </div>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handlePhoto} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div><FieldLabel>Nome *</FieldLabel><DInput value={form.nome} onChange={(e) => setF("nome", e.target.value)} placeholder="Ex: Joilaser" /></div>
          <div><FieldLabel>Prazo médio (dias) *</FieldLabel><DInput type="number" value={form.prazoMedio} onChange={(e) => setF("prazoMedio", e.target.value)} placeholder="Ex: 7" /></div>
          <div><FieldLabel>Endereço</FieldLabel><DInput value={form.endereco} onChange={(e) => setF("endereco", e.target.value)} placeholder="Rua, Cidade..." /></div>
          <div><FieldLabel>Contato</FieldLabel><DInput value={form.contato} onChange={(e) => setF("contato", e.target.value)} placeholder="(11) 9999-9999" /></div>
          <div style={{ gridColumn: "1 / -1" }}><FieldLabel>E-mail</FieldLabel><DInput type="email" value={form.email} onChange={(e) => setF("email", e.target.value)} placeholder="fornecedor@email.com" /></div>
          <div style={{ gridColumn: "1 / -1" }}>
            <FieldLabel>GID da aba na planilha</FieldLabel>
            <DInput value={form.sheetGid || ""} onChange={(e) => setF("sheetGid", e.target.value)} placeholder="ex: 142236726" />
            <div style={{ fontSize: 11, color: theme.txtMuted(isDark), marginTop: 3 }}>Abra a aba do fornecedor na planilha e copie o número após <strong>#gid=</strong> na URL.</div>
          </div>
        </div>
      </div>
      {gasError && (
        <div style={{ marginTop: 12, padding: "8px 12px", background: `${theme.orange}18`, border: `1px solid ${theme.orange}55`, borderRadius: 8, fontSize: 12, color: theme.orange }}>
          ⚠ {gasError}
        </div>
      )}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 20 }}>
        {!isNew ? (
          <button onClick={() => { onDelete(form.id); onClose(); }} style={{ ...btnBase, border: `1px solid ${theme.red}`, background: "transparent", color: theme.red }}>Excluir</button>
        ) : <div />}
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onClose} style={{ ...btnBase, border: `1px solid ${theme.border(isDark)}`, background: "transparent", color: theme.txtSecondary(isDark) }}>
            {savedOk ? "Fechar" : "Cancelar"}
          </button>
          {!savedOk && (
            <button onClick={handleSave} disabled={gasLoading} style={{ ...btnBase, border: "none", background: gasLoading ? theme.border(isDark) : theme.accent, color: gasLoading ? theme.txtMuted(isDark) : "#fff", fontWeight: 700, cursor: gasLoading ? "wait" : "pointer" }}>
              {gasLoading ? "Criando aba..." : "Salvar"}
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}

// ─── FornecedoresConfig ───────────────────────────────────────────────────────
export function FornecedoresConfig({ fornecedores, setFornecedores, gasUrl }) {
  const [editTarget, setEditTarget] = useState(null);
  const handleSave = (data) => {
    if (editTarget === "new") setFornecedores([...fornecedores, data]);
    else setFornecedores(fornecedores.map((f) => (f.id === data.id ? data : f)));
    setEditTarget(null);
  };
  const handleDelete = (id) => { setFornecedores(fornecedores.filter((f) => f.id !== id)); setEditTarget(null); };
  return (
    <>
      {editTarget !== null && <FornecedorModal forn={editTarget === "new" ? null : editTarget} gasUrl={gasUrl} onSave={handleSave} onDelete={handleDelete} onClose={() => setEditTarget(null)} />}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
        <AddCard label="Adicionar fornecedor" onClick={() => setEditTarget("new")} />
        {fornecedores.map((f) => <FornecedorCard key={f.id} forn={f} onClick={() => setEditTarget(f)} />)}
      </div>
    </>
  );
}

// ─── OrderDropdown (exported — usado também em ComprasModal) ──────────────────
export function OrderDropdown({ orders, value = [], onChange }) {
  const isDark = useDark();
  const [open, setOpen] = useState(false);
  const ref = useRef();

  // Fecha dropdown ao clicar fora
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const toggle = (id) => {
    const next = value.includes(id) ? value.filter((v) => v !== id) : [...value, id];
    onChange(next);
  };

  const inputStyle = {
    width: "100%", padding: "7px 10px", boxSizing: "border-box",
    background: theme.bgInput(isDark), border: `1px solid ${open ? theme.accent : theme.border(isDark)}`,
    borderRadius: open ? "8px 8px 0 0" : 8, color: theme.txtPrimary(isDark),
    fontSize: 13, outline: "none", cursor: "pointer", userSelect: "none",
  };

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <div style={inputStyle} onClick={() => setOpen((p) => !p)}>
        {value.length === 0
          ? <span style={{ color: theme.txtMuted(isDark) }}>Selecionar pedido(s)...</span>
          : <span style={{ fontFamily: "monospace", fontWeight: 700, color: theme.accent }}>{value.join(", ")}</span>
        }
      </div>
      {open && (
        <div style={{ position: "absolute", top: "100%", left: 0, right: 0, zIndex: 200, background: theme.bgCard(isDark), border: `1px solid ${theme.accent}`, borderTop: "none", borderRadius: "0 0 8px 8px", boxShadow: "0 6px 18px rgba(0,0,0,0.22)", maxHeight: 200, overflowY: "auto" }}>
          {orders.length === 0 && <div style={{ padding: "12px 14px", fontSize: 12, color: theme.txtMuted(isDark) }}>Nenhum pedido cadastrado.</div>}
          {orders.map((o) => {
            const sel = value.includes(o.id);
            return (
              <div key={o.id} onMouseDown={(e) => { e.preventDefault(); toggle(o.id); }}
                style={{ padding: "9px 14px", fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 10, background: sel ? `${theme.accent}14` : "transparent" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = sel ? `${theme.accent}20` : theme.bgHover(isDark))}
                onMouseLeave={(e) => (e.currentTarget.style.background = sel ? `${theme.accent}14` : "transparent")}
              >
                <span style={{ fontSize: 14 }}>{sel ? "☑" : "☐"}</span>
                <span style={{ fontFamily: "monospace", fontWeight: 700, color: theme.accent }}>{o.id}</span>
                <span style={{ fontSize: 11, color: theme.txtSecondary(isDark) }}>{o.cliente}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── CodeSelector ─────────────────────────────────────────────────────────────
export function CodeSelector({ orders, selectedPedidos, value = [], onChange }) {
  const isDark = useDark();
  const byPedido = orders
    .filter((o) => selectedPedidos.includes(o.id))
    .map((o) => ({
      pedidoId: o.id,
      cliente: o.cliente || "",
      produtos: (o.produtos || []).map((p) => ({ uid: `${o.id}/${p.codigo}`, codigo: p.codigo, nome: p.produto || "" })),
    }))
    .filter((g) => g.produtos.length > 0);

  const allUids = byPedido.flatMap((g) => g.produtos.map((p) => p.uid));
  const toggleAll = () => onChange(value.length === allUids.length ? [] : allUids);
  const toggle = (uid) => onChange(value.includes(uid) ? value.filter((v) => v !== uid) : [...value, uid]);

  if (!byPedido.length) return <div style={{ fontSize: 12, color: theme.txtMuted(isDark), padding: "8px 0" }}>Nenhum produto encontrado nos pedidos selecionados.</div>;

  const allSel = value.length === allUids.length && allUids.length > 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {/* Ação rápida */}
      <button onClick={toggleAll}
        style={{ alignSelf: "flex-start", fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 6, cursor: "pointer",
          border: `1px solid ${theme.accent}`, background: allSel ? theme.accent : "transparent",
          color: allSel ? "#fff" : theme.accent, transition: "all .12s" }}>
        {allSel ? "✕ Desmarcar todos" : "✓ Selecionar todos"}
      </button>

      {byPedido.map(({ pedidoId, cliente, produtos }) => (
        <div key={pedidoId}>
          {/* Cabeçalho do pedido (apenas quando múltiplos) */}
          {selectedPedidos.length > 1 && (
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase",
              color: theme.txtMuted(isDark), marginBottom: 6, paddingBottom: 4,
              borderBottom: `1px solid ${theme.border(isDark)}` }}>
              {pedidoId}{cliente ? ` — ${cliente}` : ""}
            </div>
          )}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {produtos.map(({ uid, codigo, nome }) => {
              const sel = value.includes(uid);
              const nomeShort = nome.length > 22 ? nome.slice(0, 22) + "…" : nome;
              return (
                <button key={uid} onClick={() => toggle(uid)}
                  style={{ display: "flex", flexDirection: "column", alignItems: "flex-start",
                    padding: "6px 12px", borderRadius: 8, cursor: "pointer",
                    border: `1px solid ${sel ? theme.accent : theme.border(isDark)}`,
                    background: sel ? theme.accent : theme.bgInput(isDark),
                    color: sel ? "#fff" : theme.txtSecondary(isDark), transition: "all .12s",
                    minWidth: 110, textAlign: "left" }}>
                  <span style={{ fontSize: 12, fontWeight: 700, fontFamily: "monospace", lineHeight: 1.4 }}>{codigo}</span>
                  {nome && <span style={{ fontSize: 10, opacity: 0.8, marginTop: 1, lineHeight: 1.3 }}>{nomeShort}</span>}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── ServiceModal ─────────────────────────────────────────────────────────────
export function ServiceModal({ orders, fornecedores, onClose, onSave }) {
  const isDark = useDark();
  const initForn = fornecedores[0] || null;
  const [form, setForm] = useState({
    id: generateId(), pedidos: [], codigos: [], lote: "", orcamento: "",
    fornecedor: initForn?.nome || "",
    previsao: initForn?.prazoMedio ? addDays(initForn.prazoMedio) : "",
    linkDrive: "", obs: "", status: "Enviado", checklist: {}, createdAt: today(),
  });
  const [error, setError] = useState("");
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const handleSave = () => {
    if (!form.pedidos.length) { setError("Selecione pelo menos um pedido."); return; }
    if (!form.lote.trim())    { setError("O campo Lote é obrigatório."); return; }
    if (!form.fornecedor)     { setError("Selecione um fornecedor."); return; }
    setError("");
    onSave(form);
    onClose();
  };

  const sep = { borderTop: `1px solid ${theme.border(isDark)}`, margin: "16px 0" };

  return (
    <Modal title="Novo Serviço" onClose={onClose} maxWidth={600}>
      {error && <div style={{ background: theme.redBg(isDark), border: `1px solid ${theme.red}33`, borderRadius: 8, padding: "8px 12px", fontSize: 12, color: theme.red, marginBottom: 14 }}>{error}</div>}

      <div>
        <SectionLabel>Pedido</SectionLabel>
        <div style={{ padding: "14px 16px", borderRadius: 12, border: `2px solid ${theme.accent}`, background: `${theme.accent}0e`, display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <span style={{ fontSize: 22, lineHeight: 1 }}>📋</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: theme.txtPrimary(isDark) }}>Por Pedido</div>
              <div style={{ fontSize: 11, color: theme.txtMuted(isDark), marginTop: 2 }}>Vinculado a pedido(s) de produção</div>
            </div>
          </div>
          <div>
            <FieldLabel>Id do Pedido *</FieldLabel>
            <OrderDropdown orders={orders} value={form.pedidos} onChange={(v) => { set("pedidos", v); set("codigos", []); }} />
          </div>
          {form.pedidos.length > 0 && (
            <div>
              <FieldLabel>Cód. do Produto</FieldLabel>
              <CodeSelector orders={orders} selectedPedidos={form.pedidos} value={form.codigos} onChange={(v) => set("codigos", v)} />
            </div>
          )}
        </div>
      </div>

      <div style={sep} />

      <div>
        <SectionLabel>Serviço</SectionLabel>
        <div style={{ marginBottom: 14 }}>
          <FieldLabel>Fornecedor *</FieldLabel>
          {fornecedores.length > 0 ? (
            <DSel value={form.fornecedor} options={fornecedores.map((f) => f.nome)}
              onChange={(v) => { const forn = fornecedores.find((f) => f.nome === v); setForm((prev) => ({ ...prev, fornecedor: v, ...(forn?.prazoMedio ? { previsao: addDays(forn.prazoMedio) } : {}) })); }} />
          ) : (
            <div style={{ fontSize: 12, color: theme.red, padding: "8px 0" }}>Nenhum fornecedor. Adicione em ⚙ Fornecedores.</div>
          )}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div><FieldLabel>Lote *</FieldLabel><DInput value={form.lote} onChange={(e) => set("lote", e.target.value.toUpperCase())} placeholder="Ex: MAR01" /></div>
          <div><FieldLabel>Nº do Orçamento</FieldLabel><DInput value={form.orcamento} onChange={(e) => set("orcamento", e.target.value)} placeholder="Ex: ORC-2025-001" /></div>
        </div>
      </div>

      <div style={sep} />

      <div>
        <SectionLabel>Detalhes</SectionLabel>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div><FieldLabel>Previsão</FieldLabel><DInput type="date" value={form.previsao} onChange={(e) => set("previsao", e.target.value)} /></div>
            <div><FieldLabel>Link Drive</FieldLabel><DInput type="url" value={form.linkDrive} onChange={(e) => set("linkDrive", e.target.value)} placeholder="https://drive.google.com/..." /></div>
          </div>
          <div><FieldLabel>Obs</FieldLabel><DInput value={form.obs} onChange={(e) => set("obs", e.target.value)} /></div>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20 }}>
        <button onClick={onClose} style={{ padding: "9px 18px", fontSize: 13, fontWeight: 600, borderRadius: 8, border: `1px solid ${theme.border(isDark)}`, background: "transparent", color: theme.txtSecondary(isDark), cursor: "pointer" }}>Cancelar</button>
        <button onClick={handleSave} style={{ padding: "9px 26px", fontSize: 13, fontWeight: 700, borderRadius: 8, border: "none", background: theme.accent, color: "#fff", cursor: "pointer", boxShadow: `0 4px 14px ${theme.accent}50` }}>Salvar Serviço</button>
      </div>
    </Modal>
  );
}

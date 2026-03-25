// ─── Tarefas.jsx — Quadro Kanban estilo Trello ───────────────────────────────
import { useState, useEffect, useRef } from "react";
import { useDark } from "../../context/DarkContext";
import theme from "../../theme";
import { tarefasService } from "../../services/tarefas";

// ─── Paleta de cores para cartões ────────────────────────────────────────────
const CORES_CARTAO = [
  { label: "Sem cor",   value: null      },
  { label: "Vermelho",  value: "#ef4444" },
  { label: "Laranja",   value: "#f97316" },
  { label: "Amarelo",   value: "#eab308" },
  { label: "Verde",     value: "#22c55e" },
  { label: "Azul",      value: "#3b82f6" },
  { label: "Roxo",      value: "#a855f7" },
  { label: "Rosa",      value: "#ec4899" },
  { label: "Cinza",     value: "#6b7280" },
];

// ─── Paleta de cores para colunas ─────────────────────────────────────────────
const CORES_COLUNA = [
  "#2d4a2d", "#1a3a1a", "#7c3d0a", "#1e3a5f",
  "#4a1a4a", "#6b7280", "#1a1a2e", "#3d1a1a",
];

// ─── Ícones SVG inline ────────────────────────────────────────────────────────
const IconCheck = ({ size = 18, color }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);
const IconCircle = ({ size = 18, color }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round">
    <circle cx="12" cy="12" r="10" />
  </svg>
);
const IconDots = ({ size = 16, color }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <circle cx="5" cy="12" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="19" cy="12" r="2" />
  </svg>
);
const IconTrash = ({ size = 14, color }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round">
    <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" />
  </svg>
);
const IconPlus = ({ size = 14, color }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round">
    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

// ─── Cartão ───────────────────────────────────────────────────────────────────
function Cartao({ tarefa, colunaId, onToggle, onDelete, onCorChange, onDragStart }) {
  const isDark = useDark();
  const [menuCor, setMenuCor] = useState(false);
  const [hovered, setHovered] = useState(false);
  const menuRef = useRef(null);

  // Fecha menu ao clicar fora
  useEffect(() => {
    if (!menuCor) return;
    const fn = (e) => { if (!menuRef.current?.contains(e.target)) setMenuCor(false); };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, [menuCor]);

  const cardBg  = isDark ? "#1e2433" : "#ffffff";
  const txtMain = isDark ? "#e2e8f0" : "#1e293b";
  const txtMut  = isDark ? "#64748b" : "#94a3b8";

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, tarefa.id, colunaId)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: cardBg,
        borderRadius: 8,
        cursor: "grab",
        position: "relative",
        overflow: "visible",
        boxShadow: hovered ? "0 2px 8px rgba(0,0,0,.25)" : "0 1px 3px rgba(0,0,0,.15)",
        transition: "box-shadow .15s",
      }}
    >
      {/* Barra colorida no topo */}
      {tarefa.cor && (
        <div style={{ height: 5, background: tarefa.cor, borderRadius: "8px 8px 0 0" }} />
      )}

      <div style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "10px 10px 10px 10px" }}>
        {/* Check */}
        <button
          onClick={() => onToggle(tarefa)}
          style={{ background: "none", border: "none", cursor: "pointer", padding: 0, flexShrink: 0, marginTop: 1 }}
          title={tarefa.concluido ? "Marcar como pendente" : "Marcar como concluído"}
        >
          {tarefa.concluido
            ? <IconCheck color="#22c55e" />
            : <IconCircle color={txtMut} />
          }
        </button>

        {/* Título */}
        <span style={{
          flex: 1, fontSize: 13, color: txtMain, lineHeight: 1.4,
          textDecoration: tarefa.concluido ? "line-through" : "none",
          opacity: tarefa.concluido ? 0.5 : 1,
          wordBreak: "break-word",
        }}>
          {tarefa.titulo}
        </span>

        {/* Ações (visíveis ao hover) */}
        <div style={{ display: "flex", gap: 2, opacity: hovered ? 1 : 0, transition: "opacity .15s", flexShrink: 0 }}>
          {/* Cor */}
          <div ref={menuRef} style={{ position: "relative" }}>
            <button
              onClick={() => setMenuCor((v) => !v)}
              title="Cor do cartão"
              style={{ background: "none", border: "none", cursor: "pointer", padding: "2px 4px", borderRadius: 4, fontSize: 13 }}
            >
              🎨
            </button>
            {menuCor && (
              <div style={{
                position: "absolute", top: "100%", right: 0, zIndex: 9999,
                background: isDark ? "#1e2433" : "#fff",
                border: `1px solid ${theme.border(isDark)}`,
                borderRadius: 10, padding: 10, boxShadow: "0 4px 20px rgba(0,0,0,.3)",
                display: "grid", gridTemplateColumns: "repeat(5, 24px)", gap: 6, width: 160,
              }}>
                {CORES_CARTAO.map((c) => (
                  <button
                    key={c.label}
                    onClick={() => { onCorChange(tarefa, c.value); setMenuCor(false); }}
                    title={c.label}
                    style={{
                      width: 24, height: 24, borderRadius: "50%",
                      background: c.value ?? (isDark ? "#2d3748" : "#e2e8f0"),
                      border: tarefa.cor === c.value ? "2px solid #fff" : "1px solid rgba(255,255,255,.2)",
                      cursor: "pointer", padding: 0,
                      boxShadow: tarefa.cor === c.value ? "0 0 0 2px " + (c.value ?? "#888") : "none",
                    }}
                  />
                ))}
              </div>
            )}
          </div>
          {/* Excluir */}
          <button
            onClick={() => onDelete(tarefa)}
            title="Excluir cartão"
            style={{ background: "none", border: "none", cursor: "pointer", padding: "2px 4px", borderRadius: 4 }}
          >
            <IconTrash color="#ef4444" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Coluna ───────────────────────────────────────────────────────────────────
function Coluna({ coluna, onAddTarefa, onToggleTarefa, onDeleteTarefa, onCorTarefa,
                  onDeleteColuna, onRenameColuna, onCorColuna, onDragStart, onDrop }) {
  const isDark = useDark();
  const [addingCard, setAddingCard] = useState(false);
  const [novoTitulo, setNovoTitulo] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nomeEdit, setNomeEdit] = useState(coluna.nome);
  const [dragOver, setDragOver] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const menuRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return;
    const fn = (e) => { if (!menuRef.current?.contains(e.target)) setMenuOpen(false); };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, [menuOpen]);

  useEffect(() => {
    if (addingCard && inputRef.current) inputRef.current.focus();
  }, [addingCard]);

  const handleAddCard = async () => {
    const t = novoTitulo.trim();
    if (!t) { setAddingCard(false); return; }
    await onAddTarefa(coluna.id, t);
    setNovoTitulo("");
    setAddingCard(false);
  };

  const handleRename = async () => {
    const n = nomeEdit.trim();
    if (n && n !== coluna.nome) await onRenameColuna(coluna.id, n);
    setEditingName(false);
  };

  const hdrTxt = "#fff";

  // ── Modo recolhido ──────────────────────────────────────────────────────────
  if (collapsed) return (
    <div
      style={{
        flex: "0 0 44px", width: 44, borderRadius: 12,
        background: coluna.cor ?? "#2d4a2d",
        display: "flex", flexDirection: "column", alignItems: "center",
        padding: "10px 0", gap: 8, cursor: "pointer", userSelect: "none",
        alignSelf: "flex-start",
      }}
      title={`Expandir "${coluna.nome}"`}
    >
      <button
        onClick={() => setCollapsed(false)}
        style={{ background: "none", border: "none", cursor: "pointer", padding: "4px",
                 color: "#fff", display: "flex", alignItems: "center" }}
        title="Expandir"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round">
          <polyline points="9 18 15 12 9 6" /><polyline points="15 18 21 12 15 6" />
        </svg>
      </button>
      <span style={{
        writingMode: "vertical-rl", textOrientation: "mixed", transform: "rotate(180deg)",
        fontSize: 13, fontWeight: 700, color: "#fff", letterSpacing: ".3px",
        flex: 1, display: "flex", alignItems: "center", gap: 6,
      }}>
        {coluna.nome}
      </span>
      {(coluna.tarefas?.length ?? 0) > 0 && (
        <span style={{
          fontSize: 11, fontWeight: 700, color: "#fff",
          background: "rgba(0,0,0,.35)", borderRadius: 10,
          padding: "2px 6px", minWidth: 20, textAlign: "center",
        }}>
          {coluna.tarefas.length}
        </span>
      )}
    </div>
  );

  return (
    <div
      style={{ flex: "1 1 240px", minWidth: 200, display: "flex", flexDirection: "column", borderRadius: 12 }}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => { setDragOver(false); onDrop(e, coluna.id); }}
    >
      {/* Header colorido */}
      <div style={{
        background: coluna.cor ?? "#2d4a2d",
        padding: "12px 12px 10px",
        outline: dragOver ? "2px solid #fff" : "none",
        borderRadius: "12px 12px 0 0",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {editingName ? (
            <input
              autoFocus
              value={nomeEdit}
              onChange={(e) => setNomeEdit(e.target.value)}
              onBlur={handleRename}
              onKeyDown={(e) => { if (e.key === "Enter") handleRename(); if (e.key === "Escape") setEditingName(false); }}
              style={{
                flex: 1, fontSize: 14, fontWeight: 700, background: "rgba(255,255,255,.15)",
                border: "none", borderRadius: 6, color: "#fff", padding: "2px 6px", outline: "none",
              }}
            />
          ) : (
            <span
              onDoubleClick={() => setEditingName(true)}
              style={{ flex: 1, fontSize: 14, fontWeight: 700, color: hdrTxt, cursor: "pointer", lineHeight: 1.3 }}
              title="Duplo clique para renomear"
            >
              {coluna.nome}
            </span>
          )}

          {/* Botão recolher */}
          <button
            onClick={() => setCollapsed(true)}
            title="Recolher lista"
            style={{ background: "none", border: "none", cursor: "pointer", padding: "2px 4px",
                     borderRadius: 6, opacity: 0.75, display: "flex", alignItems: "center",
                     flexShrink: 0 }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round">
              <polyline points="15 18 9 12 15 6" /><polyline points="9 18 3 12 9 6" />
            </svg>
          </button>

          {/* Menu ··· */}
          <div ref={menuRef} style={{ position: "relative" }}>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              style={{ background: "none", border: "none", cursor: "pointer", padding: "2px 6px", borderRadius: 6,
                       opacity: 0.85, display: "flex", alignItems: "center" }}
            >
              <IconDots color="#fff" />
            </button>

            {menuOpen && (
              <div style={{
                position: "absolute", top: "calc(100% + 6px)", right: 0, zIndex: 9999,
                background: isDark ? "#282e3e" : "#ffffff",
                border: `1px solid ${isDark ? "#3a4258" : "#d1d5db"}`,
                borderRadius: 12, boxShadow: "0 12px 32px rgba(0,0,0,.45)",
                width: 240,
              }}>
                {/* Header */}
                <div style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "12px 14px 10px",
                  borderBottom: `1px solid ${isDark ? "#3a4258" : "#e5e7eb"}`,
                }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: isDark ? "#e2e8f0" : "#1e293b", letterSpacing: ".3px" }}>
                    Ações da Lista
                  </span>
                  <button
                    onClick={() => setMenuOpen(false)}
                    style={{ background: "none", border: "none", cursor: "pointer", padding: "2px 6px",
                             borderRadius: 6, fontSize: 16, color: isDark ? "#94a3b8" : "#6b7280",
                             lineHeight: 1, display: "flex", alignItems: "center" }}
                  >✕</button>
                </div>

                {/* Ações */}
                {[
                  { icon: "✏️", label: "Renomear lista",  action: () => { setEditingName(true); setMenuOpen(false); } },
                  { icon: "➕", label: "Adicionar cartão", action: () => { setAddingCard(true); setMenuOpen(false); } },
                ].map(({ icon, label, action }) => (
                  <button key={label} onClick={action}
                    style={{ width: "100%", padding: "10px 14px", background: "none", border: "none",
                             cursor: "pointer", textAlign: "left", fontSize: 13,
                             color: isDark ? "#cbd5e1" : "#374151",
                             display: "flex", alignItems: "center", gap: 8,
                             borderBottom: `1px solid ${isDark ? "#3a4258" : "#f3f4f6"}` }}
                  >
                    <span style={{ fontSize: 15 }}>{icon}</span>{label}
                  </button>
                ))}

                {/* Alterar cor da lista */}
                <div style={{ padding: "10px 14px 4px" }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: isDark ? "#64748b" : "#9ca3af",
                                letterSpacing: ".6px", marginBottom: 8 }}>
                    ALTERAR COR DA LISTA
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
                    {CORES_COLUNA.map((c) => (
                      <button key={c}
                        onClick={async () => { await onCorColuna(coluna.id, c); setMenuOpen(false); }}
                        style={{
                          width: 36, height: 28, borderRadius: 6, background: c, border: "none",
                          cursor: "pointer", padding: 0,
                          outline: coluna.cor === c ? `3px solid ${isDark ? "#fff" : "#1e293b"}` : "none",
                          outlineOffset: 1,
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}
                      >
                        {coluna.cor === c && <span style={{ color: "#fff", fontSize: 13, fontWeight: 700 }}>✓</span>}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Excluir */}
                <div style={{ padding: "0 8px 8px" }}>
                  <button
                    onClick={() => { onDeleteColuna(coluna.id); setMenuOpen(false); }}
                    style={{ width: "100%", padding: "9px 10px", background: "none",
                             border: `1px solid ${isDark ? "#4a3333" : "#fecaca"}`,
                             borderRadius: 8, cursor: "pointer", textAlign: "left",
                             fontSize: 13, color: "#ef4444",
                             display: "flex", alignItems: "center", gap: 8 }}
                  >
                    <span style={{ fontSize: 15 }}>🗑</span> Excluir lista
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Lista de cartões */}
      <div style={{
        background: isDark ? "#161c2e" : "#f1f5f9",
        flex: 1, padding: "8px 8px 4px", display: "flex", flexDirection: "column", gap: 6,
        minHeight: 40, borderRadius: "0 0 12px 12px",
        outline: dragOver ? `2px dashed ${theme.accent}` : "none",
      }}>
        {(coluna.tarefas ?? []).map((tarefa) => (
          <Cartao
            key={tarefa.id}
            tarefa={tarefa}
            colunaId={coluna.id}
            onToggle={onToggleTarefa}
            onDelete={onDeleteTarefa}
            onCorChange={onCorTarefa}
            onDragStart={onDragStart}
          />
        ))}

        {/* Input para novo cartão */}
        {addingCard ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <textarea
              ref={inputRef}
              value={novoTitulo}
              onChange={(e) => setNovoTitulo(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleAddCard(); }
                if (e.key === "Escape") { setAddingCard(false); setNovoTitulo(""); }
              }}
              placeholder="Título do cartão..."
              rows={2}
              style={{
                width: "100%", boxSizing: "border-box", padding: "8px 10px",
                borderRadius: 8, border: `1px solid ${theme.accent}`,
                background: isDark ? "#1e2433" : "#fff",
                color: isDark ? "#e2e8f0" : "#1e293b",
                fontSize: 13, resize: "none", outline: "none", fontFamily: "inherit",
              }}
            />
            <div style={{ display: "flex", gap: 6 }}>
              <button
                onClick={handleAddCard}
                style={{ flex: 1, padding: "7px 0", borderRadius: 8, border: "none",
                         background: theme.accent, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
              >
                Adicionar
              </button>
              <button
                onClick={() => { setAddingCard(false); setNovoTitulo(""); }}
                style={{ padding: "7px 12px", borderRadius: 8, border: `1px solid ${theme.border(isDark)}`,
                         background: "transparent", color: isDark ? "#94a3b8" : "#64748b", fontSize: 13, cursor: "pointer" }}
              >
                ✕
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setAddingCard(true)}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "8px 10px", borderRadius: 8, border: "none",
              background: "transparent", cursor: "pointer",
              color: theme.accent, fontSize: 13, fontWeight: 600,
              width: "100%", textAlign: "left",
            }}
          >
            <IconPlus color={theme.accent} size={14} />
            Adicionar um cartão
          </button>
        )}
      </div>
    </div>
  );
}

// ─── NovaColuna ───────────────────────────────────────────────────────────────
function NovaColuna({ onConfirm }) {
  const isDark = useDark();
  const [open, setOpen] = useState(false);
  const [nome, setNome] = useState("");
  const [cor, setCor] = useState(CORES_COLUNA[0]);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus();
  }, [open]);

  const confirmar = async () => {
    const n = nome.trim();
    if (!n) return;
    await onConfirm({ nome: n, cor });
    setNome("");
    setCor(CORES_COLUNA[0]);
    setOpen(false);
  };

  const btnBase = {
    padding: "8px 14px", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer",
  };

  if (!open) return (
    <button
      onClick={() => setOpen(true)}
      style={{
        flex: "1 1 240px", minWidth: 200, padding: "12px 16px", borderRadius: 12,
        border: `2px dashed ${isDark ? "#334155" : "#cbd5e1"}`,
        background: "transparent", cursor: "pointer",
        color: isDark ? "#64748b" : "#94a3b8", fontSize: 14, fontWeight: 600,
        display: "flex", alignItems: "center", gap: 8, alignSelf: "flex-start",
      }}
    >
      <IconPlus color={isDark ? "#64748b" : "#94a3b8"} size={16} />
      Adicionar outra lista
    </button>
  );

  return (
    <div style={{
      flex: "1 1 240px", minWidth: 200, borderRadius: 12,
      background: isDark ? "#161c2e" : "#f1f5f9",
      padding: 12, display: "flex", flexDirection: "column", gap: 10,
      alignSelf: "flex-start",
    }}>
      <input
        ref={inputRef}
        value={nome}
        onChange={(e) => setNome(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") confirmar(); if (e.key === "Escape") setOpen(false); }}
        placeholder="Nome da lista..."
        style={{
          padding: "8px 10px", borderRadius: 8, fontSize: 13,
          border: `1px solid ${theme.accent}`,
          background: isDark ? "#1e2433" : "#fff",
          color: isDark ? "#e2e8f0" : "#1e293b",
          outline: "none", fontFamily: "inherit",
        }}
      />

      {/* Picker de cor */}
      <div>
        <div style={{ fontSize: 11, color: isDark ? "#64748b" : "#94a3b8", marginBottom: 6, fontWeight: 600 }}>
          COR DA LISTA
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {CORES_COLUNA.map((c) => (
            <button
              key={c}
              onClick={() => setCor(c)}
              style={{
                width: 26, height: 26, borderRadius: "50%", background: c, border: "none",
                cursor: "pointer", padding: 0,
                boxShadow: cor === c ? `0 0 0 3px ${isDark ? "#0f172a" : "#f8fafc"}, 0 0 0 5px ${c}` : "none",
              }}
            />
          ))}
        </div>
      </div>

      <div style={{ display: "flex", gap: 6 }}>
        <button onClick={confirmar} style={{ ...btnBase, flex: 1, background: theme.accent, color: "#fff", border: "none" }}>
          Criar lista
        </button>
        <button onClick={() => setOpen(false)} style={{ ...btnBase, background: "transparent", border: `1px solid ${theme.border(isDark)}`, color: isDark ? "#94a3b8" : "#64748b" }}>
          ✕
        </button>
      </div>
    </div>
  );
}

// ─── Tarefas (componente raiz) ────────────────────────────────────────────────
export default function Tarefas() {
  const isDark = useDark();
  const [colunas, setColunas] = useState([]);
  const [loading, setLoading] = useState(true);
  const dragRef = useRef({ tarefaId: null, colunaOrigemId: null });

  useEffect(() => {
    tarefasService.listColunas()
      .then(setColunas)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // ─── Handlers de coluna ─────────────────────────────────────────────────────
  const handleAddColuna = async ({ nome, cor }) => {
    const nova = await tarefasService.createColuna({ nome, cor, ordem: colunas.length });
    setColunas((p) => [...p, nova]);
  };

  const handleDeleteColuna = async (id) => {
    if (!window.confirm("Excluir esta lista e todos os cartões?")) return;
    await tarefasService.deleteColuna(id);
    setColunas((p) => p.filter((c) => c.id !== id));
  };

  const handleRenameColuna = async (id, nome) => {
    const updated = await tarefasService.updateColuna(id, { nome });
    setColunas((p) => p.map((c) => c.id === id ? { ...c, nome: updated.nome } : c));
  };

  const handleCorColuna = async (id, cor) => {
    await tarefasService.updateColuna(id, { cor });
    setColunas((p) => p.map((c) => c.id === id ? { ...c, cor } : c));
  };

  // ─── Handlers de tarefa ─────────────────────────────────────────────────────
  const handleAddTarefa = async (coluna_id, titulo) => {
    const nova = await tarefasService.createTarefa({ coluna_id, titulo });
    setColunas((p) => p.map((c) => c.id === coluna_id
      ? { ...c, tarefas: [...(c.tarefas ?? []), nova] }
      : c
    ));
  };

  const handleToggleTarefa = async (tarefa) => {
    const updated = await tarefasService.updateTarefa(tarefa.id, { concluido: !tarefa.concluido });
    setColunas((p) => p.map((c) => ({
      ...c,
      tarefas: (c.tarefas ?? []).map((t) => t.id === updated.id ? updated : t),
    })));
  };

  const handleDeleteTarefa = async (tarefa) => {
    await tarefasService.deleteTarefa(tarefa.id);
    setColunas((p) => p.map((c) => ({
      ...c,
      tarefas: (c.tarefas ?? []).filter((t) => t.id !== tarefa.id),
    })));
  };

  const handleCorTarefa = async (tarefa, cor) => {
    const updated = await tarefasService.updateTarefa(tarefa.id, { cor });
    setColunas((p) => p.map((c) => ({
      ...c,
      tarefas: (c.tarefas ?? []).map((t) => t.id === updated.id ? updated : t),
    })));
  };

  // ─── Drag & Drop ────────────────────────────────────────────────────────────
  const handleDragStart = (e, tarefaId, colunaOrigemId) => {
    dragRef.current = { tarefaId, colunaOrigemId };
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDrop = async (e, colunaDestinoId) => {
    e.preventDefault();
    const { tarefaId, colunaOrigemId } = dragRef.current;
    if (!tarefaId || colunaOrigemId === colunaDestinoId) return;

    // Otimista: move localmente
    let tarefaMovida;
    setColunas((p) => {
      const next = p.map((c) => {
        if (c.id === colunaOrigemId) {
          tarefaMovida = (c.tarefas ?? []).find((t) => t.id === tarefaId);
          return { ...c, tarefas: (c.tarefas ?? []).filter((t) => t.id !== tarefaId) };
        }
        return c;
      });
      return next.map((c) => {
        if (c.id === colunaDestinoId && tarefaMovida) {
          return { ...c, tarefas: [...(c.tarefas ?? []), { ...tarefaMovida, coluna_id: colunaDestinoId }] };
        }
        return c;
      });
    });

    // Persiste
    try {
      await tarefasService.updateTarefa(tarefaId, { coluna_id: colunaDestinoId });
    } catch {
      // Reverte em caso de erro
      tarefasService.listColunas().then(setColunas).catch(() => {});
    }
    dragRef.current = { tarefaId: null, colunaOrigemId: null };
  };

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 200 }}>
      <span style={{ color: theme.accent, fontSize: 14, fontWeight: 600 }}>Carregando tarefas...</span>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: theme.txtPrimary(isDark), margin: 0 }}>
        Tarefas
      </h2>

      {/* Board responsivo — sem scroll horizontal */}
      <div style={{
        display: "flex", flexWrap: "wrap", gap: 12, alignItems: "flex-start",
      }}>
        {colunas.map((coluna) => (
          <Coluna
            key={coluna.id}
            coluna={coluna}
            onAddTarefa={handleAddTarefa}
            onToggleTarefa={handleToggleTarefa}
            onDeleteTarefa={handleDeleteTarefa}
            onCorTarefa={handleCorTarefa}
            onDeleteColuna={handleDeleteColuna}
            onRenameColuna={handleRenameColuna}
            onCorColuna={handleCorColuna}
            onDragStart={handleDragStart}
            onDrop={handleDrop}
          />
        ))}

        {/* Botão / form de nova coluna */}
        <NovaColuna onConfirm={handleAddColuna} />
      </div>

      {colunas.length === 0 && (
        <div style={{
          textAlign: "center", padding: "60px 20px",
          color: isDark ? "#475569" : "#94a3b8",
          fontSize: 14,
        }}>
          Nenhuma lista criada ainda. Clique em <strong>"Adicionar outra lista"</strong> para começar.
        </div>
      )}
    </div>
  );
}

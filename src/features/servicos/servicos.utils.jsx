// ─── servicos.utils.jsx ───────────────────────────────────────────────────────
// Constantes, helpers e componentes compartilhados entre os módulos de Serviços e Compras.
import { useState } from "react";
import { useDark } from "../../context/DarkContext";
import theme from "../../theme";

// ─── Constantes padrão ────────────────────────────────────────────────────────
// URL padrão da planilha (publicada no formato pub?output=tsv)
export const DEFAULT_SHEETS_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQBOex_HKbAiFFlJAChrtfHpMOBhMnUiJ_6bWrQ1YbbRqdn7FNYB4CnkxbkX50pPq2TjrCRnjvmCHFA/pub?output=ods";

export const DEFAULT_FORNECEDORES = [
  { id: "f1", nome: "Joilaser",   endereco: "", prazoMedio: 15, contato: "", email: "", sheetGid: "1056402992" },
  { id: "f2", nome: "Laurentino", endereco: "", prazoMedio: 4,  contato: "", email: "", sheetGid: "142236726"  },
  { id: "f3", nome: "Antenor",    endereco: "", prazoMedio: 7,  contato: "", email: "", sheetGid: ""           },
  { id: "f4", nome: "Rafael",     endereco: "", prazoMedio: 7,  contato: "", email: "", sheetGid: ""           },
];

export const DEFAULT_CATEGORIAS = [
  { id: "default-aco",   nome: "Aço",     itens: ["Chapa 3mm", "Chapa 5mm", "Chapa 8mm", "Tubo 40x40", "Tubo 50x50"], fornecedorNome: "", endereco: "", contato: "", email: "", link: "" },
  { id: "default-mad",   nome: "Madeira", itens: ["MDF 15mm", "MDF 18mm", "Compensado 15mm", "Compensado 18mm"],       fornecedorNome: "", endereco: "", contato: "", email: "", link: "" },
  { id: "default-couro", nome: "Couro",   itens: ["Couro natural", "Tecido PU", "Camurça"],                            fornecedorNome: "", endereco: "", contato: "", email: "", link: "" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
export const joinArr = (v) => (Array.isArray(v) ? v.join(", ") || "—" : v || "—");

export function addDays(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

// ─── Itens de compra (suporte a formato legado e novo) ────────────────────────
// Normaliza linha de compra: novo formato usa array `itens`, legado usa `item` + `categoria`.
export function getRowItens(row) {
  if (Array.isArray(row.itens) && row.itens.length)
    return row.itens;
  if (row.item)
    return [{ id: "legacy", categoria: row.categoria || "", item: row.item, qtd: row.qtd || "—" }];
  return [];
}

// ─── Avatar helpers ───────────────────────────────────────────────────────────
const AVATAR_PALETTE = [
  "#3b82f6","#6366f1","#8b5cf6","#ec4899","#f97316",
  "#d97706","#059669","#0891b2","#dc2626","#0284c7",
];

export function nameToColor(name = "") {
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) & 0xffffffff;
  return AVATAR_PALETTE[Math.abs(h) % AVATAR_PALETTE.length];
}

export function getInitials(name = "") {
  return name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() || "").join("") || "?";
}

// ─── Badge "📦 Estoque" ───────────────────────────────────────────────────────
export function EstoqueBadge() {
  return (
    <span style={{ background: theme.green, color: "#fff", fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 99, whiteSpace: "nowrap" }}>
      📦 Estoque
    </span>
  );
}

// ─── Rótulo de seção (ALL-CAPS, muted) ───────────────────────────────────────
export function SectionLabel({ children }) {
  const isDark = useDark();
  return (
    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: theme.txtMuted(isDark), marginBottom: 10 }}>
      {children}
    </div>
  );
}

// ─── Google Sheets helpers ────────────────────────────────────────────────────
// Suporta dois formatos:
//   URL direta:    https://docs.google.com/spreadsheets/d/{sheetId}/edit
//   URL publicada: https://docs.google.com/spreadsheets/d/e/{publishedId}/pub
export function parseSheetsUrl(url) {
  const pubMatch = url?.match(/\/spreadsheets\/d\/e\/([a-zA-Z0-9_-]+)/);
  if (pubMatch) {
    const gidMatch = url?.match(/[?&#]gid=(\d+)/);
    return { sheetId: "", publishedId: pubMatch[1], gid: gidMatch?.[1] ?? "0", isPublished: true };
  }
  const idMatch  = url?.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
  const gidMatch = url?.match(/[?&#]gid=(\d+)/);
  return { sheetId: idMatch?.[1] ?? "", publishedId: "", gid: gidMatch?.[1] ?? "0", isPublished: false };
}

// Extrai apenas o número de um GID — aceita "1056402992" ou URL completa com ?gid=…
function sanitizeGid(gid) {
  const s = String(gid ?? "").trim();
  if (/^\d+$/.test(s)) return s;                      // já é número
  const m = s.match(/[?&#]gid=(\d+)/);                // extrai de URL
  return m?.[1] ?? "";
}

// Busca itens de um lote na aba do fornecedor via gid.
// Aceita URL direta ou publicada. Retorna: [{ id, codigo, quantia, checked }]
export async function fetchLoteDaPlanilha(sheetsUrl, gid, lote) {
  const cleanGid = sanitizeGid(gid);
  const { sheetId, publishedId, isPublished } = parseSheetsUrl(sheetsUrl);
  if (!cleanGid) throw new Error("GID do fornecedor inválido — reconfigure em ⚙ Fornecedores");
  const url = isPublished
    ? `https://docs.google.com/spreadsheets/d/e/${publishedId}/pub?output=tsv&gid=${cleanGid}`
    : `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=tsv&gid=${cleanGid}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Erro HTTP ${res.status} — verifique se a planilha está compartilhada como pública`);
  const tsv = await res.text();

  const lines = tsv.trim().split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];

  // norm: remove aspas, maiúsculas, sem acentos, só letras/números
  const norm     = (s) => s.trim().replace(/^"|"$/g, "").toUpperCase().replace(/[^A-ZÁÉÍÓÚ0-9]/g, "");
  const normKey  = (s) => norm(s).normalize("NFD").replace(/[\u0300-\u036f]/g, ""); // sem acentos para detectar colunas
  const headers  = lines[0].split("\t").map(norm);
  const headersK = headers.map((h) => h.normalize("NFD").replace(/[\u0300-\u036f]/g, ""));

  const loteIdx  = headersK.findIndex((h) => h === "LOTE");
  const codIdx   = headersK.findIndex((h) => h.startsWith("COD"));
  const quantIdx = headersK.findIndex((h) => h.startsWith("QUANT") || h.startsWith("QTD"));

  if (loteIdx < 0 || codIdx < 0) throw new Error(`Aba do fornecedor sem colunas LOTE/CÓDIGO — verifique o cabeçalho`);

  const itens = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split("\t").map((c) => c.trim().replace(/^"|"$/g, ""));
    if (norm(cols[loteIdx] ?? "") === norm(lote)) {
      const codigo  = cols[codIdx] || "";
      const quantia = quantIdx >= 0 ? (cols[quantIdx] || "—") : "—";
      if (codigo) itens.push({ id: crypto.randomUUID(), codigo, quantia, checked: false });
    }
  }
  return itens;
}

// Cria (ou garante existência de) aba do fornecedor via Google Apps Script Web App.
// Retorna o GID (string) da aba criada/existente.
export async function createFornecedorSheet(gasUrl, fornecedorNome) {
  const name = encodeURIComponent(fornecedorNome.trim().toUpperCase());
  const res = await fetch(`${gasUrl}?name=${name}`);
  if (!res.ok) throw new Error(`Erro HTTP ${res.status} ao chamar Apps Script`);
  const json = await res.json();
  if (json.error) throw new Error(json.error);
  return String(json.gid);
}

// ─── Card "+" genérico ────────────────────────────────────────────────────────
export function AddCard({ label, onClick }) {
  const isDark = useDark();
  const [hov, setHov] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      title={label}
      style={{
        width: 128, height: 148, borderRadius: 12, cursor: "pointer", flexShrink: 0,
        border: `2px dashed ${hov ? theme.accent : theme.border(isDark)}`,
        background: hov ? (isDark ? "#1e293b" : "#f8fafc") : "transparent",
        display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center", gap: 6, transition: "all .15s", userSelect: "none",
      }}
    >
      <span style={{ fontSize: 34, lineHeight: 1, color: hov ? theme.accent : theme.txtMuted(isDark), transition: "color .15s" }}>+</span>
      <span style={{ fontSize: 11, fontWeight: 600, color: hov ? theme.accent : theme.txtMuted(isDark), textAlign: "center", padding: "0 8px", transition: "color .15s" }}>
        {label}
      </span>
    </div>
  );
}

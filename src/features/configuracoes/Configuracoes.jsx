import { useState } from "react";
import { useDark } from "../../context/DarkContext";
import { useAuth } from "../../context/AuthContext";
import { useConfig } from "../../hooks/useConfig";
import theme from "../../theme";
import { parseSheetsUrl, DEFAULT_SHEETS_URL } from "../servicos/servicos.utils";
import UsuariosSection from "./UsuariosSection";

function ConfigCard({ title, children }) {
  const isDark = useDark();
  return (
    <div style={{ padding: 20, background: theme.bgCard(isDark), border: `1px solid ${theme.border(isDark)}`, borderRadius: 12 }}>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: theme.txtMuted(isDark), marginBottom: 14 }}>
        {title}
      </div>
      {children}
    </div>
  );
}

// ─── Gerenciador de lista de variações ───────────────────────────────────────
function VariacoesList({ label, emoji, chave, config, updateConfig }) {
  const isDark = useDark();
  const lista  = config[chave] ?? [];
  const [novoItem, setNovoItem] = useState("");

  const adicionar = async () => {
    const val = novoItem.trim();
    if (!val || lista.includes(val)) return;
    await updateConfig(chave, [...lista, val]);
    setNovoItem("");
  };

  const remover = async (item) => {
    await updateConfig(chave, lista.filter((i) => i !== item));
  };

  const inputStyle = {
    flex: 1, padding: "8px 10px", fontSize: 13, borderRadius: 8,
    background: theme.bgInput(isDark), border: `1px solid ${theme.border(isDark)}`,
    color: theme.txtPrimary(isDark), outline: "none",
  };

  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: theme.txtSecondary(isDark), marginBottom: 8 }}>
        {emoji} {label}
      </div>

      {/* Lista atual */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
        {lista.length === 0 && (
          <span style={{ fontSize: 12, color: theme.txtMuted(isDark) }}>Nenhuma variação cadastrada.</span>
        )}
        {lista.map((item) => (
          <div
            key={item}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "4px 10px", borderRadius: 20,
              background: theme.bgInput(isDark), border: `1px solid ${theme.border(isDark)}`,
              fontSize: 12, color: theme.txtSecondary(isDark),
            }}
          >
            {item}
            <button
              onClick={() => remover(item)}
              style={{ background: "none", border: "none", cursor: "pointer", color: theme.red, fontWeight: 700, padding: 0, fontSize: 14, lineHeight: 1 }}
              title="Remover"
            >×</button>
          </div>
        ))}
      </div>

      {/* Adicionar novo */}
      <div style={{ display: "flex", gap: 8 }}>
        <input
          value={novoItem}
          onChange={(e) => setNovoItem(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && adicionar()}
          placeholder={`Nova variação de ${label}...`}
          style={inputStyle}
        />
        <button
          onClick={adicionar}
          style={{
            padding: "8px 16px", borderRadius: 8, border: "none",
            background: theme.accent, color: "#fff", fontWeight: 700,
            fontSize: 13, cursor: "pointer",
          }}
        >
          + Adicionar
        </button>
      </div>
    </div>
  );
}

// ─── Configuracoes ────────────────────────────────────────────────────────────
export default function Configuracoes() {
  const isDark = useDark();
  const { user } = useAuth();
  const { config, updateConfig } = useConfig();

  const sheetsUrl = config.config_sheets_url ?? DEFAULT_SHEETS_URL;
  const gasUrl    = config.config_gas_url ?? "";
  const setSheetsUrl = (val) => updateConfig('config_sheets_url', val);
  const setGasUrl    = (val) => updateConfig('config_gas_url', val);

  const { sheetId, publishedId } = parseSheetsUrl(sheetsUrl);
  const sheetsOk = sheetsUrl && (sheetId || publishedId);

  const inputStyle = {
    width: "100%", padding: "9px 12px", fontSize: 13, borderRadius: 8,
    boxSizing: "border-box", background: theme.bgInput(isDark),
    border: `1px solid ${theme.border(isDark)}`, color: theme.txtPrimary(isDark), outline: "none",
  };

  const labelStyle = {
    fontSize: 12, color: theme.txtMuted(isDark), marginBottom: 6, lineHeight: 1.6, display: "block",
  };

  return (
    <div style={{ maxWidth: 680 }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: theme.txtPrimary(isDark), marginBottom: 24, marginTop: 0 }}>
        Configurações
      </h2>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

        {/* Gerenciamento de Usuários — somente admin */}
        {user?.role === "admin" && <UsuariosSection />}

        {/* ─── Variações de Matéria-Prima ─────────────────────────────────── */}
        <ConfigCard title="🪵 Variações de Matéria-Prima">
          <span style={labelStyle}>
            Gerencie as opções disponíveis para seleção em Novo Pedido.
            Adicione novas variações ou remova as que não usa mais.
            As alterações ficam salvas e acessíveis em qualquer dispositivo.
          </span>

          <VariacoesList
            label="Madeira"
            emoji="🪵"
            chave="mp_madeira"
            config={config}
            updateConfig={updateConfig}
          />

          <VariacoesList
            label="Elétrica"
            emoji="⚡"
            chave="mp_eletrica"
            config={config}
            updateConfig={updateConfig}
          />

          <VariacoesList
            label="Couro"
            emoji="🪑"
            chave="mp_couro"
            config={config}
            updateConfig={updateConfig}
          />
        </ConfigCard>

        {/* Google Sheets */}
        <ConfigCard title="Google Sheets — Planilha de Importação">
          <span style={labelStyle}>
            Cole a URL da planilha. Cada fornecedor deve ter uma aba com seu nome em maiúsculas
            (ex: LAURENTINO, JOILASER). A planilha deve estar compartilhada como pública (visualizador).
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <input
              value={sheetsUrl}
              onChange={(e) => setSheetsUrl(e.target.value)}
              placeholder="https://docs.google.com/spreadsheets/d/..."
              style={inputStyle}
            />
          </div>
          {sheetsUrl && (
            <div style={{ marginTop: 6, fontSize: 12, fontWeight: 600 }}>
              {sheetsOk
                ? <span style={{ color: theme.green }}>✓ Configurada</span>
                : <span style={{ color: "#ef4444" }}>⚠ URL inválida</span>
              }
            </div>
          )}
        </ConfigCard>

        {/* Google Apps Script */}
        <ConfigCard title="Google Apps Script — Auto-criar Abas">
          <span style={labelStyle}>
            URL do Web App para criar abas automaticamente ao adicionar fornecedores.
            Em Extensões → Apps Script da planilha, cole o script abaixo e implante como Web App
            (executar como: você, acesso: qualquer pessoa).
          </span>
          <input
            value={gasUrl}
            onChange={(e) => setGasUrl(e.target.value)}
            placeholder="https://script.google.com/macros/s/..."
            style={inputStyle}
          />
          {gasUrl && (
            <div style={{ marginTop: 6, fontSize: 12, fontWeight: 600, color: theme.green }}>✓ Configurado</div>
          )}
          <details style={{ marginTop: 12 }}>
            <summary style={{ fontSize: 12, color: theme.accent, cursor: "pointer", fontWeight: 600 }}>
              ► Ver código do Apps Script
            </summary>
            <pre style={{ marginTop: 8, fontSize: 11, background: isDark ? "#0f172a" : "#f1f5f9", borderRadius: 8, padding: "12px 14px", overflowX: "auto", color: theme.txtPrimary(isDark), border: `1px solid ${theme.border(isDark)}`, whiteSpace: "pre-wrap", lineHeight: 1.6 }}>
{`function doGet(e) {
  var name = (e.parameter.name || "").toUpperCase().trim();
  if (!name) return out({ error: "missing name" });
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    var h = sheet.getRange("A1:C1");
    h.setValues([["LOTE","CÓDIGO","QUANTIA"]]);
    h.setFontWeight("bold");
    h.setBackground("#1f4791");
    h.setFontColor("#ffffff");
    sheet.getRange("A:A").setNumberFormat("@STRING@");
    sheet.setColumnWidth(1, 80);
    sheet.setColumnWidth(2, 180);
    sheet.setColumnWidth(3, 90);
  }
  return out({ gid: sheet.getSheetId(), name: sheet.getName() });
}
function out(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}`}
            </pre>
          </details>
        </ConfigCard>

      </div>
    </div>
  );
}

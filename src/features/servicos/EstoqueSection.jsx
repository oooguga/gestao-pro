// ─── EstoqueSection.jsx ───────────────────────────────────────────────────────
// Seção de Estoque Geral — fundação para controle futuro de materiais da fábrica.
import { useDark } from "../../context/DarkContext";
import theme from "../../theme";

const CARDS = [
  { icon: "📋", label: "Fichas Técnicas",    desc: "Especificações e materiais por produto" },
  { icon: "📏", label: "Matérias-primas",    desc: "Chapas, tubos, madeira, couro…" },
  { icon: "🔄", label: "Movimentações",      desc: "Entradas e saídas de materiais" },
  { icon: "⚠️", label: "Alertas de Estoque", desc: "Itens abaixo do mínimo" },
];

export function EstoqueSection() {
  const isDark = useDark();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <span style={{ fontSize: 38, lineHeight: 1 }}>📦</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: theme.txtPrimary(isDark) }}>
            Estoque Geral
          </div>
          <div style={{ fontSize: 12, color: theme.txtMuted(isDark), marginTop: 2 }}>
            Controle de materiais em estoque na fábrica
          </div>
        </div>
        <span style={{
          fontSize: 11, fontWeight: 700, padding: "4px 12px", borderRadius: 99,
          background: `${theme.accent}18`, color: theme.accent,
          border: `1px solid ${theme.accent}33`, letterSpacing: "0.04em",
        }}>
          Em desenvolvimento
        </span>
      </div>

      {/* Grid de seções futuras */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
        gap: 14,
      }}>
        {CARDS.map(({ icon, label, desc }) => (
          <div
            key={label}
            style={{
              padding: "20px 18px",
              borderRadius: 12,
              border: `1px dashed ${theme.border(isDark)}`,
              background: theme.bgCard(isDark),
              display: "flex", flexDirection: "column", gap: 8,
              opacity: 0.65,
              userSelect: "none",
            }}
          >
            <span style={{ fontSize: 26, lineHeight: 1 }}>{icon}</span>
            <div style={{ fontSize: 13, fontWeight: 700, color: theme.txtPrimary(isDark) }}>
              {label}
            </div>
            <div style={{ fontSize: 11, color: theme.txtMuted(isDark), lineHeight: 1.5 }}>
              {desc}
            </div>
          </div>
        ))}
      </div>

      {/* Rodapé informativo */}
      <div style={{
        padding: "14px 18px", borderRadius: 10,
        background: theme.bgInput(isDark),
        border: `1px solid ${theme.border(isDark)}`,
        fontSize: 12, color: theme.txtMuted(isDark), lineHeight: 1.6,
      }}>
        💡 As fichas técnicas dos produtos serão integradas aos pedidos de produção em uma próxima atualização.
        Aqui ficará o painel geral de estoque da fábrica.
      </div>
    </div>
  );
}

export default EstoqueSection;

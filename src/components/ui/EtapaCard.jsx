import { useDark } from "../../context/DarkContext";
import theme from "../../theme";

/**
 * Card de etapa individual dentro do painel de detalhes de um produto.
 */
export default function EtapaCard({ title, children }) {
  const isDark = useDark();
  return (
    <div
      style={{
        background: theme.bgInput(isDark),
        border: `1px solid ${theme.border(isDark)}`,
        borderRadius: 8,
        padding: "12px 14px",
      }}
    >
      <p
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: theme.accent,
          textTransform: "uppercase",
          letterSpacing: "0.07em",
          margin: "0 0 10px",
        }}
      >
        {title}
      </p>
      {children}
    </div>
  );
}

import { memo } from "react";
import { useDark } from "../../context/DarkContext";
import theme from "../../theme";

/**
 * Barra de progresso simples (0–100%).
 * A cor muda conforme o progresso: cinza → âmbar → azul → verde.
 */
const ProgressBar = memo(function ProgressBar({ pct }) {
  const isDark = useDark();
  const color =
    pct === 100 ? theme.green
    : pct > 60  ? theme.blue
    : pct > 30  ? theme.amber
    : "#6b7280";

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ flex: 1, height: 4, borderRadius: 99, background: theme.bgInput(isDark) }}>
        <div
          style={{
            height: 4,
            borderRadius: 99,
            width: `${pct}%`,
            background: color,
            transition: "width .3s",
          }}
        />
      </div>
      <span style={{ fontSize: 11, fontWeight: 700, color, minWidth: 30, textAlign: "right" }}>
        {pct}%
      </span>
    </div>
  );
});
export default ProgressBar;

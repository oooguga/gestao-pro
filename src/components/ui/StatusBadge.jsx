import { useDark } from "../../context/DarkContext";
import theme from "../../theme";

/**
 * Badge colorido para exibir um status com cor semântica.
 *
 * Props:
 *   status  — valor atual (string)
 *   options — array de todas as opções possíveis (para calcular a cor)
 */
export default function StatusBadge({ status, options }) {
  const isDark = useDark();
  const index = options.indexOf(status);
  const total = options.length;
  const progress = total <= 1 ? 1 : index / (total - 1);

  const color =
    index <= 0       ? theme.txtMuted(isDark)
    : index === total - 1 ? theme.green
    : progress > 0.5 ? theme.blue
    : theme.amber;

  const bg =
    index <= 0       ? (isDark ? "#1a1d27" : "#f0f1f5")
    : index === total - 1 ? theme.greenBg(isDark)
    : progress > 0.5 ? theme.blueBg(isDark)
    : theme.amberBg(isDark);

  return (
    <span
      style={{
        display: "inline-block",
        padding: "3px 10px",
        borderRadius: 99,
        fontSize: 11,
        fontWeight: 700,
        background: bg,
        color,
      }}
    >
      {status}
    </span>
  );
}

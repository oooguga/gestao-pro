import { memo } from "react";
import { useDark } from "../../context/DarkContext";
import theme from "../../theme";

/**
 * Navegador de etapas com botões prev/next.
 * Mostra o passo atual e o total. Cor muda conforme progresso.
 *
 * Props:
 *   value    — etapa atual (string)
 *   options  — array de todas as etapas possíveis
 *   onChange — callback (novaEtapa: string) => void
 *   disabled — trava os botões
 */
const StepNav = memo(function StepNav({ value, options, onChange, disabled }) {
  const isDark = useDark();
  const currentIndex = options.indexOf(value);
  const total = options.length;
  const progress = total <= 1 ? 1 : currentIndex / (total - 1);

  const color =
    currentIndex === 0       ? theme.txtSecondary(isDark)
    : currentIndex === total - 1 ? theme.green
    : progress > 0.5         ? theme.blue
    : theme.amber;

  const canGoPrev = currentIndex > 0;
  const canGoNext = currentIndex < total - 1;

  const navigate = (direction) => {
    const nextIndex = direction === "prev" ? currentIndex - 1 : currentIndex + 1;
    if (nextIndex >= 0 && nextIndex < total) onChange(options[nextIndex]);
  };

  const btnStyle = (canNavigate) => ({
    flexShrink: 0,
    width: 22,
    height: 22,
    borderRadius: 6,
    border: `1px solid ${theme.border(isDark)}`,
    background: canNavigate && !disabled ? theme.bgInput(isDark) : "transparent",
    color: canNavigate && !disabled ? theme.txtSecondary(isDark) : theme.txtMuted(isDark),
    cursor: canNavigate && !disabled ? "pointer" : "default",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 0,
    opacity: canNavigate && !disabled ? 1 : 0.35,
  });

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, width: "100%" }}>
      <button onClick={() => navigate("prev")} disabled={!canGoPrev || disabled} style={btnStyle(canGoPrev)}>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>

      <div style={{ flex: 1, textAlign: "center" }}>
        <div style={{ fontSize: 11, fontWeight: 700, color, lineHeight: 1.2 }}>{value}</div>
        <div style={{ fontSize: 9, color: theme.txtMuted(isDark), marginTop: 1 }}>
          {currentIndex + 1}/{total}
        </div>
      </div>

      <button onClick={() => navigate("next")} disabled={!canGoNext || disabled} style={btnStyle(canGoNext)}>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>
    </div>
  );
});
export default StepNav;

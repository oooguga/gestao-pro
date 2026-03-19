import { useDark } from "../../context/DarkContext";
import theme from "../../theme";

/**
 * Select customizado com suporte ao tema dark/light.
 * Props:
 *   value    — valor atual
 *   options  — array de strings com as opções
 *   onChange — callback (novoValor: string) => void
 *   disabled — desabilita o select
 */
export default function DSel({ value, options, onChange, disabled }) {
  const isDark = useDark();
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      style={{
        background: theme.bgInput(isDark),
        color: theme.txtPrimary(isDark),
        border: `1px solid ${theme.border(isDark)}`,
        borderRadius: 8,
        padding: "6px 10px",
        fontSize: 12,
        cursor: disabled ? "not-allowed" : "pointer",
        outline: "none",
        opacity: disabled ? 0.5 : 1,
        width: "100%",
        boxSizing: "border-box",
      }}
    >
      {options.map((option) => (
        <option key={option} value={option}>{option}</option>
      ))}
    </select>
  );
}

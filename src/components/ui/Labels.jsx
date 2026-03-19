import { useDark } from "../../context/DarkContext";
import theme from "../../theme";

export function SectionLabel({ children }) {
  return (
    <p
      style={{
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: "0.08em",
        color: theme.accent,
        textTransform: "uppercase",
        margin: "0 0 10px",
      }}
    >
      {children}
    </p>
  );
}

export function FieldLabel({ children }) {
  const isDark = useDark();
  return (
    <label
      style={{
        fontSize: 11,
        fontWeight: 600,
        color: theme.txtSecondary(isDark),
        display: "block",
        marginBottom: 5,
        letterSpacing: "0.03em",
      }}
    >
      {children}
    </label>
  );
}

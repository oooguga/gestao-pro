import { useDark } from "../../context/DarkContext";
import theme from "../../theme";

export default function Card({ children, style = {} }) {
  const isDark = useDark();
  return (
    <div
      style={{
        background: theme.bgCard(isDark),
        border: `1px solid ${theme.border(isDark)}`,
        borderRadius: 12,
        padding: "20px 24px",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

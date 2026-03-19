import { useState } from "react";
import { useDark } from "../../context/DarkContext";
import theme from "../../theme";

/**
 * Input customizado com suporte ao tema dark/light.
 * Suporta type="text", "number", "date".
 * Para number, use a prop `min` para definir o valor mínimo aceito.
 *
 * Comportamento: para type="number", permite digitar livremente mas
 * corrige o valor ao sair do campo (onBlur), garantindo mínimo.
 */
export default function DInput({ value, onChange, placeholder, type = "text", style = {}, min }) {
  const isDark = useDark();
  const [focused, setFocused] = useState(false);

  const handleBlur = () => {
    setFocused(false);
    // Ao sair do campo numérico, garante que o valor respeita o mínimo
    if (type === "number" && min !== undefined) {
      const num = +value;
      if (isNaN(num) || num < min) {
        // Dispara um evento sintético com o valor corrigido
        onChange({ target: { value: String(min) } });
      }
    }
  };

  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      min={type === "number" && min !== undefined ? min : undefined}
      onFocus={() => setFocused(true)}
      onBlur={handleBlur}
      style={{
        width: "100%",
        boxSizing: "border-box",
        background: theme.bgInput(isDark),
        color: theme.txtPrimary(isDark),
        border: `1px solid ${focused ? theme.borderFocus : theme.border(isDark)}`,
        borderRadius: 8,
        padding: "8px 12px",
        fontSize: 13,
        outline: "none",
        transition: "border-color .15s",
        ...style,
      }}
    />
  );
}

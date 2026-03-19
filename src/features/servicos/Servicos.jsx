// ─── Servicos.jsx ─────────────────────────────────────────────────────────────
// Componente raiz da tela "Serviços e Materiais".
// Navega entre as seções: Serviços · Compras
import { useState } from "react";
import { useDark } from "../../context/DarkContext";
import theme from "../../theme";
import { ServicoSection } from "./ServicosTable";
import { ComprasSection }  from "./ComprasSection";

export default function Servicos({ orders = [] }) {
  const isDark = useDark();
  const [activeSection, setActiveSection] = useState("servicos");

  const sectionBtnStyle = (active) => ({
    padding: "8px 20px", fontSize: 13, fontWeight: 700, borderRadius: 8,
    border: `1px solid ${active ? theme.accent : theme.border(isDark)}`,
    background: active ? theme.accent : "transparent",
    color: active ? "#fff" : theme.txtSecondary(isDark),
    cursor: "pointer", transition: "all .15s",
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: theme.txtPrimary(isDark), margin: 0 }}>
        Serviços e Materiais
      </h2>

      <div style={{ display: "flex", gap: 8, borderBottom: `1px solid ${theme.border(isDark)}`, paddingBottom: 4 }}>
        <button onClick={() => setActiveSection("servicos")} style={sectionBtnStyle(activeSection === "servicos")}>
          Serviços
        </button>
        <button onClick={() => setActiveSection("compras")} style={sectionBtnStyle(activeSection === "compras")}>
          Compras
        </button>
      </div>

      {activeSection === "servicos" && <ServicoSection orders={orders} />}
      {activeSection === "compras"  && <ComprasSection orders={orders} />}
    </div>
  );
}

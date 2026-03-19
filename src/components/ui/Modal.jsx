import { useDark } from "../../context/DarkContext";
import theme from "../../theme";

/**
 * Modal genérico reutilizável.
 * Props:
 *   title   — título do cabeçalho
 *   onClose — callback ao fechar
 *   children — conteúdo do corpo
 */
export default function Modal({ title, onClose, children, maxWidth = 540 }) {
  const isDark = useDark();
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 200,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        background: "rgba(0,0,0,0.65)",
      }}
    >
      <div
        style={{
          background: theme.bgCard(isDark),
          border: `1px solid ${theme.border(isDark)}`,
          borderRadius: 14,
          width: "100%",
          maxWidth,
          boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
          display: "flex",
          flexDirection: "column",
          maxHeight: "90vh",
          overflow: "hidden",
        }}
      >
        {/* Cabeçalho */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 20px",
            borderBottom: `1px solid ${theme.border(isDark)}`,
          }}
        >
          <span style={{ fontSize: 15, fontWeight: 700, color: theme.txtPrimary(isDark) }}>
            {title}
          </span>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: theme.txtSecondary(isDark),
              padding: 4,
              display: "flex",
              alignItems: "center",
              borderRadius: 6,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Corpo */}
        <div style={{ padding: 20, overflowY: "auto", flex: 1 }}>
          {children}
        </div>
      </div>
    </div>
  );
}

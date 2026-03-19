// ─── Sistema de tema (dark / light) ──────────────────────────────────────────
// Cada propriedade que muda conforme o tema é uma função: theme.bgCard(isDark)
// Propriedades fixas são strings diretas: theme.accent
//
// Para adicionar uma nova cor ao tema, adicione aqui — apenas aqui.
const theme = {
  // Fundos
  bgPage:    (dark) => dark ? "#0f1117" : "#f5f6fa",
  bgCard:    (dark) => dark ? "#1a1d27" : "#ffffff",
  bgInput:   (dark) => dark ? "#13151f" : "#f0f1f5",
  bgHover:   (dark) => dark ? "#22263a" : "#e8eaf0",
  bgSidebar: (dark) => dark ? "#13151f" : "#ffffff",
  bgTopbar:  (dark) => dark ? "#13151f" : "#ffffff",

  // Destaque (accent) — cor principal do sistema
  accent:     "#00c2a8",
  accentDim:  "#00c2a820",
  accentText: "#0a1a18",

  // Bordas
  border:      (dark) => dark ? "#2a2d3e" : "#dde0ec",
  borderFocus: "#00c2a8",

  // Textos
  txtPrimary:   (dark) => dark ? "#e8eaf0" : "#111827",
  txtSecondary: (dark) => dark ? "#8b8fa8" : "#6b7280",
  txtMuted:     (dark) => dark ? "#4a4e65" : "#9ca3af",

  // Semânticas (sucesso, erro, aviso, info)
  green:    "#10b981",
  greenBg:  (dark) => dark ? "#0d2e22" : "#ecfdf5",

  red:      "#ef4444",
  redBg:    (dark) => dark ? "#2d1111" : "#fef2f2",

  amber:    "#f59e0b",
  amberBg:  (dark) => dark ? "#2d1f0a" : "#fffbeb",

  blue:     "#3b82f6",
  blueBg:   (dark) => dark ? "#0d1f3d" : "#eff6ff",

  purple:   "#8b5cf6",
  purpleBg: (dark) => dark ? "#1e1333" : "#f5f3ff",

  orange:   "#f97316",
  orangeBg: (dark) => dark ? "#2d1708" : "#fff7ed",
};

export default theme;

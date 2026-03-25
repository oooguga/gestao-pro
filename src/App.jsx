import { useState, useCallback, useEffect, lazy, Suspense } from "react";
import { DarkContext } from "./context/DarkContext";
import { useAuth } from "./context/AuthContext";
import ErrorBoundary from "./components/ErrorBoundary";
import theme from "./theme";
import { pedidosService } from "./services/pedidos";
import LoginPage from "./features/auth/LoginPage";

// ─── Lazy loading das guias ───────────────────────────────────────────────────
const Dashboard      = lazy(() => import("./features/dashboard/Dashboard"));
const NovoPedido     = lazy(() => import("./features/pedidos/NovoPedido"));
const OrdensProducao = lazy(() => import("./features/pedidos/OrdensProducao"));
const Servicos       = lazy(() => import("./features/servicos/Servicos"));
const Estoque        = lazy(() => import("./features/servicos/EstoqueSection"));
const Configuracoes  = lazy(() => import("./features/configuracoes/Configuracoes"));
const Tarefas        = lazy(() => import("./features/tarefas/Tarefas"));

// ─── Indicador de carregamento ────────────────────────────────────────────────
function PageLoader() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", flexDirection: "column", gap: 12 }}>
      <div style={{ width: 32, height: 32, border: `3px solid ${theme.accentDim}`, borderTopColor: theme.accent, borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
      <span style={{ fontSize: 13, color: theme.accent, fontWeight: 600 }}>Carregando...</span>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ─── Logo: Ducor × Companhia Carraro ──────────────────────────────────────────
const BrandLogos = () => (
  <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
    <img
      src="/carraro.png"
      alt="Companhia Carraro"
      style={{ height: 20, width: "auto", display: "block", borderRadius: 3 }}
    />
    <span style={{ fontSize: 10, color: "#888", opacity: 0.4, lineHeight: 1, userSelect: "none" }}>×</span>
    <div style={{ background: "#000", borderRadius: 3, height: 20, padding: "0 8px", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <span style={{ color: "#fff", fontWeight: 900, fontSize: 10, letterSpacing: "0.06em", lineHeight: 1, userSelect: "none" }}>
        DUCOR
      </span>
    </div>
  </div>
);

// ─── Itens de navegação ───────────────────────────────────────────────────────
const NAV_ITEMS = [
  { id: "dashboard",     label: "Dashboard" },
  { id: "novo",          label: "Novo Pedido" },
  { id: "ordens",        label: "Ordens de Produção" },
  { id: "servicos",      label: "Serviços" },
  { id: "estoque",       label: "Estoque" },
  { id: "tarefas",      label: "Tarefas" },
  { id: "---", label: null },
  { id: "configuracoes", label: "⚙ Configurações" },
];

const PAGE_LABELS = {
  dashboard:     "Dashboard",
  novo:          "Novo Pedido",
  ordens:        "Ordens de Produção",
  servicos:      "Serviços",
  estoque:       "Estoque",
  tarefas:       "Tarefas",
  configuracoes: "Configurações",
};

// ─── Componente raiz ──────────────────────────────────────────────────────────
export default function App() {
  const [isDark, setIsDark]           = useState(true);
  const [currentTab, setCurrentTab]   = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // ─── Auth ──────────────────────────────────────────────────────────────────
  const { isAuthenticated, isInitializing, logout, user } = useAuth();

  // ─── Toast de confirmação ─────────────────────────────────────────────────
  const [toast, setToast] = useState(null); // { message, type }
  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  // ─── Estado global de pedidos — carregado via API ─────────────────────────
  const [orders,      setOrders]      = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) { setLoadingData(false); return; }
    setLoadingData(true);
    pedidosService.list()
      .then((p) => setOrders(p))
      .catch((e) => showToast(e.message, 'error'))
      .finally(() => setLoadingData(false));
  }, [isAuthenticated, showToast]);

  // ─── Controle de edição ───────────────────────────────────────────────────
  const [editTarget, setEditTarget] = useState(null);

  // ─── Handlers de pedidos ──────────────────────────────────────────────────
  const saveNewOrder = useCallback(async (order) => {
    try {
      const created = await pedidosService.create(order);
      setOrders((prev) => [...prev, created]);
      setCurrentTab("ordens");
      showToast(`Pedido ${created.id} salvo!`);
    } catch (e) { showToast(e.message, 'error'); }
  }, [showToast]);

  const handleEditClick = useCallback((orderId, productId) => {
    setEditTarget({ orderId, productId });
    setCurrentTab("novo");
  }, []);

  const saveEditedOrder = useCallback(async (updatedOrder) => {
    try {
      const updated = await pedidosService.update(updatedOrder.id, updatedOrder);
      setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
      setEditTarget(null);
      setCurrentTab("ordens");
      showToast("Pedido atualizado!");
    } catch (e) { showToast(e.message, 'error'); }
  }, [showToast]);

  const cancelEdit = useCallback(() => {
    setEditTarget(null);
    setCurrentTab("ordens");
  }, []);

  const navigate = useCallback((tabId) => {
    setCurrentTab(tabId);
    setSidebarOpen(false);
  }, []);

  // ─── Renderização condicional ─────────────────────────────────────────────
  return (
    <DarkContext.Provider value={isDark}>

      {/* Enquanto verifica sessão */}
      {isInitializing && <PageLoader />}

      {/* Tela de login */}
      {!isInitializing && !isAuthenticated && <LoginPage isDark={isDark} />}

      {/* App principal */}
      {!isInitializing && isAuthenticated && (
        <div style={{ minHeight: "100vh", background: theme.bgPage(isDark), fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", color: theme.txtPrimary(isDark) }}>

          {/* Overlay do sidebar (mobile) */}
          {sidebarOpen && (
            <div onClick={() => setSidebarOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 30, background: "rgba(0,0,0,0.55)" }} />
          )}

          {/* Sidebar */}
          <aside
            style={{
              position: "fixed", top: 0, left: 0, height: "100%", width: 220, zIndex: 40,
              display: "flex", flexDirection: "column",
              background: theme.bgSidebar(isDark),
              borderRight: `1px solid ${theme.border(isDark)}`,
              transform: sidebarOpen ? "translateX(0)" : "translateX(-220px)",
              transition: "transform .25s cubic-bezier(.4,0,.2,1)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 16px 14px", borderBottom: `1px solid ${theme.border(isDark)}` }}>
              <BrandLogos />
              <button onClick={() => setSidebarOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: theme.txtSecondary(isDark), padding: 4 }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <nav style={{ flex: 1, padding: "10px 8px", display: "flex", flexDirection: "column", gap: 2 }}>
              {NAV_ITEMS.filter(({ id }) => id !== "configuracoes" || user?.role === "admin").map(({ id, label }) => {
                if (id === "---") return <div key="sep" style={{ height: 1, background: theme.border(isDark), margin: "6px 4px" }} />;
                const isActive = currentTab === id;
                return (
                  <button
                    key={id}
                    onClick={() => navigate(id)}
                    style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 8, border: "none", background: isActive ? theme.accentDim : "transparent", color: isActive ? theme.accent : theme.txtSecondary(isDark), cursor: "pointer", textAlign: "left", width: "100%", fontSize: 13, fontWeight: isActive ? 700 : 500 }}
                  >
                    {label}
                  </button>
                );
              })}
            </nav>

            <div style={{ padding: "10px 8px", borderTop: `1px solid ${theme.border(isDark)}`, display: "flex", flexDirection: "column", gap: 6 }}>
              {user && (
                <div style={{ padding: "6px 12px", fontSize: 11, color: theme.txtMuted(isDark), overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  <span style={{ fontWeight: 700, color: theme.txtSecondary(isDark) }}>{user.role}</span>
                </div>
              )}
              <button
                onClick={() => setIsDark((prev) => !prev)}
                style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", padding: "9px 12px", borderRadius: 8, border: `1px solid ${theme.border(isDark)}`, background: theme.bgInput(isDark), color: theme.txtSecondary(isDark), cursor: "pointer", fontSize: 12, fontWeight: 600 }}
              >
                <span>Aparência</span>
                <span>{isDark ? "☀️" : "🌙"}</span>
              </button>
              <button
                onClick={logout}
                style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", padding: "9px 12px", borderRadius: 8, border: `1px solid ${theme.border(isDark)}`, background: "transparent", color: theme.red, cursor: "pointer", fontSize: 12, fontWeight: 600 }}
              >
                <span>Sair</span>
                <span>⎋</span>
              </button>
            </div>
          </aside>

          {/* Topbar */}
          <header
            style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 20, height: 52, display: "flex", alignItems: "center", gap: 12, padding: "0 16px", background: theme.bgTopbar(isDark), borderBottom: `1px solid ${theme.border(isDark)}` }}
          >
            <button
              onClick={() => setSidebarOpen((prev) => !prev)}
              style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 34, height: 34, borderRadius: 8, border: `1px solid ${theme.border(isDark)}`, background: theme.bgInput(isDark), cursor: "pointer", color: theme.txtSecondary(isDark), flexShrink: 0 }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>

            <BrandLogos />

            <span style={{ fontSize: 12, color: theme.txtMuted(isDark), overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              / {PAGE_LABELS[currentTab]}
            </span>

            <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
              {/* Botão sair */}
              <button
                onClick={logout}
                title="Sair"
                style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 34, height: 34, borderRadius: 8, border: `1px solid ${theme.border(isDark)}`, background: theme.bgInput(isDark), cursor: "pointer", fontSize: 15, color: theme.txtSecondary(isDark) }}
              >
                ⎋
              </button>
              <button
                onClick={() => setIsDark((prev) => !prev)}
                style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 34, height: 34, borderRadius: 8, border: `1px solid ${theme.border(isDark)}`, background: theme.bgInput(isDark), cursor: "pointer", fontSize: 16 }}
              >
                {isDark ? "☀️" : "🌙"}
              </button>
            </div>
          </header>

          {/* Conteúdo principal */}
          <main style={{ marginTop: 52, padding: "24px 16px", minHeight: "calc(100vh - 52px)" }}>
            {loadingData ? (
              <PageLoader />
            ) : (
              <ErrorBoundary key={currentTab}>
                <Suspense fallback={<PageLoader />}>
                  {currentTab === "dashboard" && (
                    <Dashboard orders={orders} />
                  )}
                  {currentTab === "novo" && (
                    <NovoPedido
                      onSave={editTarget ? saveEditedOrder : saveNewOrder}
                      editOrder={editTarget ? orders.find((o) => o.id === editTarget.orderId) : null}
                      onCancelEdit={cancelEdit}
                    />
                  )}
                  {currentTab === "ordens" && (
                    <OrdensProducao orders={orders} setOrders={setOrders} onEdit={handleEditClick} />
                  )}
                  {currentTab === "servicos" && (
                    <Servicos orders={orders} />
                  )}
                  {currentTab === "estoque" && <Estoque />}
                  {currentTab === "tarefas" && <Tarefas />}
                  {currentTab === "configuracoes" && user?.role === "admin" && <Configuracoes />}
                </Suspense>
              </ErrorBoundary>
            )}
          </main>

          {/* Toast de notificação */}
          {toast && (
            <div
              style={{
                position: "fixed", bottom: 24, right: 24,
                background: toast.type === 'error' ? theme.red : theme.accent,
                color: toast.type === 'error' ? '#fff' : theme.accentText,
                padding: "10px 18px", borderRadius: 10, fontSize: 13, fontWeight: 700,
                zIndex: 50,
                boxShadow: toast.type === 'error' ? "0 4px 20px rgba(239,68,68,.3)" : "0 4px 20px rgba(0,194,168,.3)",
              }}
            >
              {toast.type === 'error' ? '✗ ' : '✓ '}{toast.message}
            </div>
          )}
        </div>
      )}
    </DarkContext.Provider>
  );
}

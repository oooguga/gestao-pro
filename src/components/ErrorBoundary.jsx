import { Component } from "react";
import theme from "../theme";

/**
 * Captura erros de renderização em componentes filhos,
 * evitando que um crash em uma aba quebre o app inteiro.
 * Exibe uma tela de erro amigável com botão de recuperação.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // Em produção, aqui seria enviado para um serviço de monitoramento.
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          minHeight: "40vh", gap: 16, padding: 40, textAlign: "center",
        }}>
          <div style={{ fontSize: 36 }}>⚠️</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: theme.red }}>
            Algo deu errado nesta seção
          </div>
          <div style={{ fontSize: 12, color: "#6b7280", maxWidth: 360, lineHeight: 1.6 }}>
            {this.state.error?.message || "Erro inesperado."}
          </div>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            style={{
              marginTop: 8, padding: "9px 20px", borderRadius: 8, border: "none",
              background: theme.accent, color: "#fff", fontWeight: 700,
              fontSize: 13, cursor: "pointer",
            }}
          >
            Tentar novamente
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

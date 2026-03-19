import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Plugin que retorna módulo vazio para deps opcionais do jsPDF (canvg, html2canvas, dompurify).
// O jsPDF tenta importar esses pacotes dinamicamente para suporte a SVG — funcionalidade que
// não usamos. Sem esse stub, o Vite quebra ao analisar o código do jsPDF.
const stubOptionalDeps = {
  name: 'stub-jspdf-optional-deps',
  resolveId(id) {
    if (['canvg', 'html2canvas', 'dompurify'].includes(id)) return id;
  },
  load(id) {
    if (['canvg', 'html2canvas', 'dompurify'].includes(id)) return 'export default {}';
  },
};

export default defineConfig({
  plugins: [react(), stubOptionalDeps],
})

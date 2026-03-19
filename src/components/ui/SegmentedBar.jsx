import { memo } from "react";
import { useDark } from "../../context/DarkContext";
import { GROUP_META } from "../../constants";
import theme from "../../theme";

/**
 * Barra segmentada que mostra o progresso por grupo de fabricação.
 * Cada segmento representa um setor (Madeira, Elétrica, Ferragens, etc.).
 *
 * Props:
 *   groups — array retornado por groupedProgress() ou groupedProgressAvg()
 *            Formato: [{ key, ativo, fill }]
 */
const SegmentedBar = memo(function SegmentedBar({ groups }) {
  const isDark = useDark();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 3, width: "100%" }}>
      {/* Barras coloridas */}
      <div style={{ display: "flex", gap: 2, height: 10, borderRadius: 6, overflow: "hidden", width: "100%" }}>
        {groups.map((group, i) => {
          const meta = GROUP_META.find((m) => m.key === group.key);
          // Proteção: se o grupo não estiver em GROUP_META, ignora
          if (!meta) return null;

          const isNA     = !group.ativo;
          const trackBg  = isNA ? (isDark ? "#1a1d27" : "#e5e7eb") : (isDark ? "#2a2d3e" : "#e5e7eb");
          // Cor de preenchimento: usa a cor do setor (meta.cor) para progresso parcial,
          // verde somente quando 100% concluído.
          const fillColor = group.fill === 1 ? theme.green : meta.cor;

          return (
            <div
              key={group.key}
              title={isNA ? `${meta.label}: N/A` : `${meta.label}: ${Math.round(group.fill * 100)}%`}
              style={{ flex: 1, minWidth: 0, background: trackBg, position: "relative" }}
            >
              {!isNA && group.fill > 0 && (
                <div
                  style={{
                    height: "100%",
                    width: `${group.fill * 100}%`,
                    background: fillColor,
                    transition: "width .3s",
                  }}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Labels abaixo de cada segmento */}
      <div style={{ display: "flex", gap: 2, width: "100%" }}>
        {groups.map((group) => {
          const meta = GROUP_META.find((m) => m.key === group.key);
          if (!meta) return null;
          return (
            <div
              key={group.key}
              style={{
                flex: 1,
                minWidth: 0,
                textAlign: "center",
                fontSize: 8,
                fontWeight: 600,
                color: !group.ativo ? (isDark ? "#2a2d3e" : "#9ca3af") : meta.cor,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {meta.label}
            </div>
          );
        })}
      </div>
    </div>
  );
});
export default SegmentedBar;

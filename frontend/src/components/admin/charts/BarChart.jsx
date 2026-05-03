import { useMemo } from "react";

const formatValue = (v) => {
  if (v >= 1000) return `${(v / 1000).toFixed(1)}k`;
  return String(Math.round(v));
};

export const BarChart = ({
  data = [],
  labelKey = "label",
  valueKey = "value",
  color = "#6366f1",
  height = 220,
  formatTooltip = (v) => v,
  horizontal = false
}) => {
  const W = 600;
  const H = height;

  const items = useMemo(() => data.slice(0, 10), [data]);
  const maxVal = useMemo(() => Math.max(...items.map((d) => Number(d[valueKey] || 0)), 1), [items, valueKey]);

  if (!items.length) {
    return (
      <div
        className="flex items-center justify-center rounded-xl bg-slate-50 text-sm text-slate-400"
        style={{ height }}
      >
        Sem dados para o período selecionado
      </div>
    );
  }

  if (horizontal) {
    const padL = 140;
    const padR = 60;
    const padT = 12;
    const padB = 12;
    const rowH = Math.min(32, (H - padT - padB) / items.length);
    const plotW = W - padL - padR;
    const actualH = padT + padB + items.length * rowH;

    return (
      <div className="w-full overflow-hidden">
        <svg viewBox={`0 0 ${W} ${actualH}`} className="w-full" style={{ height: actualH }}>
          {items.map((item, i) => {
            const val = Number(item[valueKey] || 0);
            const barW = (val / maxVal) * plotW;
            const y = padT + i * rowH;
            return (
              <g key={i}>
                <text x={padL - 8} y={y + rowH / 2 + 4} textAnchor="end" fontSize="11" fill="#475569">
                  {String(item[labelKey] || "").length > 18
                    ? String(item[labelKey]).slice(0, 18) + "…"
                    : item[labelKey]}
                </text>
                <rect x={padL} y={y + 4} width={Math.max(barW, 2)} height={rowH - 8} rx="4" fill={color} opacity="0.85">
                  <title>{formatTooltip(val)}</title>
                </rect>
                <text x={padL + barW + 6} y={y + rowH / 2 + 4} fontSize="11" fill="#64748b">
                  {formatValue(val)}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    );
  }

  // Vertical bars
  const padL = 48;
  const padR = 16;
  const padT = 16;
  const padB = 40;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;
  const barW = Math.max(8, plotW / items.length - 8);
  const step = plotW / items.length;

  return (
    <div className="w-full overflow-hidden">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height }}>
        {/* Y gridlines */}
        {[0, 0.25, 0.5, 0.75, 1].map((t) => {
          const y = padT + (1 - t) * plotH;
          return (
            <g key={t}>
              <line x1={padL} y1={y} x2={W - padR} y2={y} stroke="#e2e8f0" strokeWidth="1" />
              <text x={padL - 6} y={y + 4} textAnchor="end" fontSize="10" fill="#94a3b8">
                {formatValue(maxVal * t)}
              </text>
            </g>
          );
        })}

        {/* Bars */}
        {items.map((item, i) => {
          const val = Number(item[valueKey] || 0);
          const barH = (val / maxVal) * plotH;
          const x = padL + i * step + (step - barW) / 2;
          const y = padT + plotH - barH;
          const label = String(item[labelKey] || "");
          return (
            <g key={i}>
              <rect x={x} y={y} width={barW} height={Math.max(barH, 2)} rx="4" fill={color} opacity="0.85">
                <title>{label}: {formatTooltip(val)}</title>
              </rect>
              <text
                x={x + barW / 2}
                y={H - padB + 14}
                textAnchor="middle"
                fontSize="9"
                fill="#94a3b8"
              >
                {label.length > 10 ? label.slice(0, 10) + "…" : label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

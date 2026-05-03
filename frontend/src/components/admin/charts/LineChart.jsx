import { useMemo } from "react";

const formatValue = (v) => {
  if (v >= 1000) return `${(v / 1000).toFixed(1)}k`;
  return String(Math.round(v));
};

const W = 600;
const PAD = { L: 48, R: 16, T: 16, B: 32 };

export const LineChart = ({
  data = [],
  valueKey = "value",
  color = "#6366f1",
  height = 200,
  formatTooltip = (v) => v
}) => {
  const computed = useMemo(() => {
    if (!data.length) return null;

    const H = height;
    const plotW = W - PAD.L - PAD.R;
    const plotH = H - PAD.T - PAD.B;

    const values = data.map((d) => Number(d[valueKey] || 0));
    const rawMin = Math.min(...values, 0);
    const rawMax = Math.max(...values, 1);
    const range = rawMax - rawMin || 1;

    const pts = data.map((d, i) => ({
      x: PAD.L + (i / Math.max(data.length - 1, 1)) * plotW,
      y: PAD.T + (1 - (Number(d[valueKey] || 0) - rawMin) / range) * plotH,
      raw: Number(d[valueKey] || 0),
      label: d.date || d.label || ""
    }));

    const polyline = pts.map((p) => `${p.x},${p.y}`).join(" ");
    const area = [
      `M ${pts[0].x},${PAD.T + plotH}`,
      ...pts.map((p) => `L ${p.x},${p.y}`),
      `L ${pts[pts.length - 1].x},${PAD.T + plotH}`,
      "Z"
    ].join(" ");

    const yLabels = [0, 1, 2, 3, 4].map((i) => ({
      value: rawMin + (i / 4) * range,
      y: PAD.T + plotH - (i / 4) * plotH
    }));

    const step = Math.max(1, Math.ceil(data.length / 6));
    const xLabels = pts.filter((_, i) => i % step === 0 || i === pts.length - 1);

    return { pts, polyline, area, yLabels, xLabels, H, plotH };
  }, [data, valueKey, height]);

  const gradId = `lg-${color.replace("#", "")}`;

  if (!computed) {
    return (
      <div
        className="flex items-center justify-center rounded-xl bg-slate-50 text-sm text-slate-400"
        style={{ height }}
      >
        Sem dados para o período selecionado
      </div>
    );
  }

  const { pts, polyline, area, yLabels, xLabels, H } = computed;

  return (
    <div className="w-full overflow-hidden">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        style={{ height: H }}
        role="img"
        aria-label="Gráfico de linha"
      >
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.15" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>

        {yLabels.map((yl) => (
          <g key={yl.y}>
            <line x1={PAD.L} y1={yl.y} x2={W - PAD.R} y2={yl.y} stroke="#e2e8f0" strokeWidth="1" />
            <text x={PAD.L - 6} y={yl.y + 4} textAnchor="end" fontSize="10" fill="#94a3b8">
              {formatValue(yl.value)}
            </text>
          </g>
        ))}

        <path d={area} fill={`url(#${gradId})`} />

        <polyline
          points={polyline}
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {pts.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="3.5" fill={color} stroke="white" strokeWidth="2">
            <title>{formatTooltip(p.raw)}</title>
          </circle>
        ))}

        {xLabels.map((xl, i) => (
          <text key={i} x={xl.x} y={H - 6} textAnchor="middle" fontSize="9" fill="#94a3b8">
            {xl.label?.length > 8 ? xl.label.slice(5) : xl.label}
          </text>
        ))}
      </svg>
    </div>
  );
};

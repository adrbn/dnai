"use client";

import type { Severity } from "@/lib/types";

const COLOR: Record<Severity, string> = {
  low: "rgb(120 220 160)",
  medium: "rgb(236 196 92)",
  high: "rgb(247 110 110)",
};

const WEIGHT: Record<Severity, number> = { low: 1, medium: 3, high: 6 };

interface SeverityBarsProps {
  counts: Record<Severity, number>;
}

export function SeverityBars({ counts }: SeverityBarsProps) {
  const total = counts.low + counts.medium + counts.high;
  const score = counts.low * WEIGHT.low + counts.medium * WEIGHT.medium + counts.high * WEIGHT.high;
  const maxRef = 30; // rough scale: 5 high × 6 = 30 ≈ full gauge
  const pct = Math.min(1, score / maxRef);

  const levels: { key: Severity; label: string }[] = [
    { key: "high", label: "Pertinence haute" },
    { key: "medium", label: "Pertinence modérée" },
    { key: "low", label: "Pertinence faible" },
  ];

  // semicircle gauge: radius 60, center at (80, 70)
  const R = 58;
  const CX = 80;
  const CY = 72;
  // angle sweep from π (left) to 0 (right)
  const angle = Math.PI - pct * Math.PI;
  const needleX = CX + Math.cos(angle) * R;
  const needleY = CY - Math.sin(angle) * R;

  const gaugeColor =
    pct > 0.6 ? COLOR.high : pct > 0.25 ? COLOR.medium : COLOR.low;

  // build dashed arc for the gauge itself
  const circumference = Math.PI * R;
  const filled = circumference * pct;

  return (
    <div>
      <div className="relative flex justify-center">
        <svg viewBox="0 0 160 90" className="h-auto w-full max-w-[220px]">
          <defs>
            <linearGradient id="sv-track" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0%" stopColor={COLOR.low} stopOpacity="0.15" />
              <stop offset="50%" stopColor={COLOR.medium} stopOpacity="0.15" />
              <stop offset="100%" stopColor={COLOR.high} stopOpacity="0.15" />
            </linearGradient>
            <linearGradient id="sv-fill" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0%" stopColor={COLOR.low} />
              <stop offset="50%" stopColor={COLOR.medium} />
              <stop offset="100%" stopColor={COLOR.high} />
            </linearGradient>
          </defs>

          {/* track */}
          <path
            d={`M ${CX - R} ${CY} A ${R} ${R} 0 0 1 ${CX + R} ${CY}`}
            stroke="url(#sv-track)"
            strokeWidth={10}
            strokeLinecap="round"
            fill="none"
          />
          {/* fill */}
          <path
            d={`M ${CX - R} ${CY} A ${R} ${R} 0 0 1 ${CX + R} ${CY}`}
            stroke="url(#sv-fill)"
            strokeWidth={10}
            strokeLinecap="round"
            fill="none"
            strokeDasharray={`${filled} ${circumference}`}
            style={{ transition: "stroke-dasharray 600ms ease" }}
          />

          {/* needle */}
          <line
            x1={CX}
            y1={CY}
            x2={needleX}
            y2={needleY}
            stroke={gaugeColor}
            strokeWidth={2}
            strokeLinecap="round"
            style={{ transition: "all 600ms ease" }}
          />
          <circle cx={CX} cy={CY} r={4} fill={gaugeColor} />

          {/* labels */}
          <text x={CX - R} y={CY + 14} textAnchor="middle" className="fill-fg-muted text-[7px]">
            safe
          </text>
          <text x={CX} y={8} textAnchor="middle" className="fill-fg-muted text-[7px]">
            modéré
          </text>
          <text x={CX + R} y={CY + 14} textAnchor="middle" className="fill-fg-muted text-[7px]">
            attention
          </text>

          {/* center readout */}
          <text x={CX} y={CY - 20} textAnchor="middle" className="fill-fg text-[18px] font-bold">
            {total}
          </text>
          <text x={CX} y={CY - 8} textAnchor="middle" className="fill-fg-muted text-[7px] uppercase tracking-[0.12em]">
            médicaments
          </text>
        </svg>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        {levels.map(({ key, label }) => (
          <div
            key={key}
            className="rounded-lg border border-border bg-surface-2/40 p-2 text-center"
            style={{
              borderColor: counts[key] > 0 ? `${COLOR[key]}66` : undefined,
              background: counts[key] > 0 ? `${COLOR[key]}12` : undefined,
            }}
          >
            <div
              className="text-lg font-bold tabular-nums"
              style={{ color: counts[key] > 0 ? COLOR[key] : undefined }}
            >
              {counts[key]}
            </div>
            <div className="text-[9px] uppercase tracking-wider text-fg-muted">
              {label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

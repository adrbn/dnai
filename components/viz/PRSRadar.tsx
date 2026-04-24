"use client";

import type { PRSFinding } from "@/lib/types";

interface PRSRadarProps {
  findings: PRSFinding[];
  size?: number;
}

const CATEGORY_COLOR: Record<PRSFinding["rule"]["category"], string> = {
  metabolic: "rgb(236 196 92)",
  cardio: "rgb(247 110 110)",
  neuro: "rgb(170 140 255)",
  cancer: "rgb(255 140 180)",
  anthropometric: "rgb(120 180 255)",
  longevity: "rgb(120 220 160)",
};

/**
 * Radial percentile chart — each spoke is a PRS finding, distance from the
 * center encodes percentile. A dashed median ring at 50% gives a "you vs
 * population" reference at a glance.
 */
export function PRSRadar({ findings, size = 320 }: PRSRadarProps) {
  if (findings.length < 3) return null;
  // Pad room for the label ring (we place labels at 1.18 × r) plus a little
  // slack so long trait names like "Longévité exceptionnelle" don't get clipped.
  const pad = 96;
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - pad;

  const n = findings.length;
  const polar = (i: number, radiusFrac: number) => {
    const angle = (i / n) * Math.PI * 2 - Math.PI / 2;
    return {
      x: cx + Math.cos(angle) * r * radiusFrac,
      y: cy + Math.sin(angle) * r * radiusFrac,
    };
  };

  const userPolygon = findings
    .map((f, i) => {
      const { x, y } = polar(i, Math.max(0.05, Math.min(1, f.percentile / 100)));
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      width={size}
      height={size}
      className="mx-auto block"
      role="img"
      aria-label="Carte radar des scores polygéniques"
    >
      {/* Concentric reference rings at 25 / 50 / 75 / 100 */}
      {[0.25, 0.5, 0.75, 1].map((frac) => (
        <circle
          key={frac}
          cx={cx}
          cy={cy}
          r={r * frac}
          fill="none"
          stroke={frac === 0.5 ? "rgba(26,22,19,0.35)" : "rgba(26,22,19,0.1)"}
          strokeWidth={frac === 0.5 ? 1 : 0.75}
          strokeDasharray={frac === 0.5 ? "3 3" : undefined}
        />
      ))}
      {/* Spokes */}
      {findings.map((_, i) => {
        const { x, y } = polar(i, 1);
        return (
          <line
            key={i}
            x1={cx}
            y1={cy}
            x2={x}
            y2={y}
            stroke="rgba(26,22,19,0.08)"
            strokeWidth={0.75}
          />
        );
      })}
      {/* User polygon */}
      <polygon
        points={userPolygon}
        fill="rgba(142,42,35,0.14)"
        stroke="rgb(142,42,35)"
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
      {/* Per-finding dot + label */}
      {findings.map((f, i) => {
        const frac = Math.max(0.05, Math.min(1, f.percentile / 100));
        const { x, y } = polar(i, frac);
        const labelPos = polar(i, 1.18);
        const angle = (i / n) * Math.PI * 2 - Math.PI / 2;
        const cos = Math.cos(angle);
        const anchor =
          Math.abs(cos) < 0.2 ? "middle" : cos > 0 ? "start" : "end";
        return (
          <g key={f.rule.id}>
            <circle
              cx={x}
              cy={y}
              r={3.5}
              fill={CATEGORY_COLOR[f.rule.category]}
              stroke="#1a1613"
              strokeWidth={0.75}
            />
            <text
              x={labelPos.x}
              y={labelPos.y}
              textAnchor={anchor}
              dominantBaseline="middle"
              className="fill-ink/70"
              style={{
                fontSize: 10,
                fontFamily: "var(--font-sans)",
                letterSpacing: 0.2,
              }}
            >
              {truncate(f.rule.trait, 14)}
            </text>
          </g>
        );
      })}
      {/* Center label */}
      <text
        x={cx}
        y={cy - 6}
        textAnchor="middle"
        style={{ fontSize: 10, fill: "rgba(26,22,19,0.45)", letterSpacing: 0.5 }}
      >
        P50
      </text>
      <text
        x={cx}
        y={cy + 8}
        textAnchor="middle"
        style={{ fontSize: 9, fill: "rgba(26,22,19,0.35)" }}
      >
        médiane
      </text>
    </svg>
  );
}

function truncate(s: string, n: number): string {
  return s.length <= n ? s : `${s.slice(0, n - 1)}…`;
}

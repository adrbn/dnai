"use client";

/**
 * PRSDistribution — plots a normal bell curve (the reference population
 * distribution for this PRS) and overlays the user's position as a vertical
 * marker. Under the hood the PRS pipeline gives us popMean/popSd + a z-score,
 * which is already the standardized distance from the population mean; we
 * simply draw that on a canonical N(0,1) curve.
 *
 * Design goals:
 * - Instantly legible: bell curve + one marker + "vous êtes ici" label
 * - Shaded tail beyond the user so at a glance you see "% of people below"
 * - No library: pure SVG, matches the existing minimal viz style
 */

interface PRSDistributionProps {
  zScore: number;
  percentile: number;
  color: string;
  label?: string;
  width?: number;
  height?: number;
}

// Standard normal PDF — unnormalized is fine since we rescale by max.
function phi(z: number): number {
  return Math.exp(-(z * z) / 2);
}

export function PRSDistribution({
  zScore,
  percentile,
  color,
  label = "Vous",
  width = 360,
  height = 120,
}: PRSDistributionProps) {
  const zMin = -3.2;
  const zMax = 3.2;
  const padX = 6;
  const padTop = 10;
  const padBottom = 18;
  const innerW = width - padX * 2;
  const innerH = height - padTop - padBottom;

  const samples = 96;
  const xFor = (z: number) =>
    padX + ((z - zMin) / (zMax - zMin)) * innerW;
  const yFor = (p: number) => padTop + innerH - p * innerH;

  // Build path for the bell curve (normalized so peak = 1).
  const peak = phi(0);
  const pts: [number, number][] = [];
  for (let i = 0; i <= samples; i++) {
    const z = zMin + ((zMax - zMin) * i) / samples;
    pts.push([z, phi(z) / peak]);
  }
  const curvePath = pts
    .map(([z, p], i) => `${i === 0 ? "M" : "L"} ${xFor(z).toFixed(1)} ${yFor(p).toFixed(1)}`)
    .join(" ");

  // Tail to highlight: everything up to the user's z (below-percentile shading).
  const clampedZ = Math.max(zMin, Math.min(zMax, zScore));
  const tailPts = pts.filter(([z]) => z <= clampedZ);
  const baseY = yFor(0);
  const tailPath = tailPts.length
    ? `M ${xFor(zMin).toFixed(1)} ${baseY.toFixed(1)} ` +
      tailPts.map(([z, p]) => `L ${xFor(z).toFixed(1)} ${yFor(p).toFixed(1)}`).join(" ") +
      ` L ${xFor(clampedZ).toFixed(1)} ${baseY.toFixed(1)} Z`
    : "";

  const userX = xFor(clampedZ);
  const markerLabel = `${Math.round(percentile)}ᵉ percentile`;
  const offLeft = clampedZ < -2.3;
  const offRight = clampedZ > 2.3;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      className="block w-full"
      role="img"
      aria-label={`Position relative à la population : ${markerLabel}`}
    >
      {/* Axis line */}
      <line
        x1={padX}
        y1={baseY}
        x2={width - padX}
        y2={baseY}
        stroke="rgba(26,22,19,0.2)"
        strokeWidth={0.75}
      />
      {/* Median reference line */}
      <line
        x1={xFor(0)}
        y1={padTop}
        x2={xFor(0)}
        y2={baseY}
        stroke="rgba(26,22,19,0.25)"
        strokeWidth={0.75}
        strokeDasharray="3 3"
      />
      {/* Tail shading (user's side) */}
      {tailPath && (
        <path d={tailPath} fill={color} opacity={0.18} />
      )}
      {/* Bell curve */}
      <path d={curvePath} fill="none" stroke="rgba(26,22,19,0.55)" strokeWidth={1.2} />
      {/* Tick labels at z=-2,-1,0,1,2 */}
      {[-2, -1, 0, 1, 2].map((z) => (
        <g key={z}>
          <line
            x1={xFor(z)}
            y1={baseY}
            x2={xFor(z)}
            y2={baseY + 3}
            stroke="rgba(26,22,19,0.35)"
            strokeWidth={0.75}
          />
          <text
            x={xFor(z)}
            y={baseY + 12}
            textAnchor="middle"
            style={{ fontSize: 9, fill: "rgba(26,22,19,0.5)" }}
          >
            {z === 0 ? "moyenne" : `${z > 0 ? "+" : ""}${z}σ`}
          </text>
        </g>
      ))}
      {/* User marker */}
      <line
        x1={userX}
        y1={padTop - 4}
        x2={userX}
        y2={baseY}
        stroke={color}
        strokeWidth={1.75}
      />
      <circle cx={userX} cy={padTop + 2} r={4} fill={color} stroke="#1a1613" strokeWidth={0.75} />
      <text
        x={offLeft ? userX + 6 : offRight ? userX - 6 : userX}
        y={padTop - 2}
        textAnchor={offLeft ? "start" : offRight ? "end" : "middle"}
        style={{ fontSize: 10, fontWeight: 600, fill: color }}
      >
        {label} · {markerLabel}
      </text>
    </svg>
  );
}

"use client";

import { useMemo } from "react";
import type { AncestryComponent, AncestryResult } from "@/lib/types";

type Region = AncestryComponent["region"];

// Equirectangular projection over a 800×400 viewBox.
// Continent blobs are hand-drawn simplifications — editorial, not cartographic.
const CONTINENTS: { d: string; fill?: string }[] = [
  // North America
  { d: "M 72,95 C 58,120 62,175 110,200 L 170,218 L 205,215 L 232,190 L 245,165 L 240,140 L 215,110 L 180,92 L 140,85 L 105,82 Z" },
  // Central America
  { d: "M 200,220 L 230,230 L 255,248 L 262,262 L 248,258 L 222,238 Z" },
  // South America
  { d: "M 255,260 C 248,295 258,340 275,365 L 288,355 L 295,320 L 300,290 L 292,268 L 272,258 Z" },
  // Greenland
  { d: "M 300,70 L 330,65 L 348,82 L 342,102 L 312,108 L 295,92 Z" },
  // Europe
  { d: "M 390,108 L 418,100 L 450,108 L 462,122 L 455,138 L 428,148 L 398,145 L 382,132 L 380,118 Z" },
  // Africa
  { d: "M 415,160 C 402,200 418,250 445,285 L 468,298 L 485,278 L 495,240 L 490,200 L 475,170 L 450,158 L 428,155 Z" },
  // Middle East / Arabia
  { d: "M 470,165 L 498,170 L 510,188 L 500,205 L 478,200 L 465,182 Z" },
  // Asia core (Eurasia east)
  { d: "M 470,105 L 530,98 L 600,102 L 660,115 L 690,135 L 680,158 L 640,170 L 590,172 L 540,168 L 498,158 L 478,142 L 468,122 Z" },
  // India (SAS)
  { d: "M 560,185 L 588,188 L 598,218 L 585,238 L 568,232 L 558,208 Z" },
  // South-East Asia
  { d: "M 632,180 L 660,182 L 672,205 L 660,222 L 640,218 L 628,198 Z" },
  // Indonesia/archipelago (dotted)
  { d: "M 660,235 L 680,232 L 700,240 L 705,252 L 685,252 L 668,245 Z" },
  // Australia
  { d: "M 672,285 C 668,305 688,320 715,320 L 738,312 L 742,295 L 725,278 L 698,275 Z" },
  // Japan
  { d: "M 710,148 L 720,152 L 724,168 L 716,175 L 706,165 Z" },
  // UK / Ireland
  { d: "M 372,110 L 382,108 L 385,125 L 375,130 L 368,120 Z" },
  // Madagascar
  { d: "M 500,275 L 508,280 L 510,298 L 500,302 L 496,288 Z" },
];

// Approximate centroids per continental cluster, in the same 800×400 space.
const REGION_CENTROIDS: Record<Region, { x: number; y: number }> = {
  AFR: { x: 455, y: 230 },
  EUR: { x: 418, y: 125 },
  EAS: { x: 640, y: 150 },
  SAS: { x: 578, y: 210 },
  AMR: { x: 200, y: 170 },
};

const REGION_COLOR: Record<Region, string> = {
  AFR: "#b8792f",
  EUR: "#1c3d78",
  EAS: "#c99a1f",
  SAS: "#7c3ca6",
  AMR: "#3a7d52",
};

export function WorldAncestryMap({ ancestry }: { ancestry: AncestryResult }) {
  const ordered = useMemo(
    () => [...ancestry.components].sort((a, b) => a.percent - b.percent),
    [ancestry.components],
  );
  const top = ancestry.topRegion;
  return (
    <div className="mt-4 overflow-hidden rounded-sm border border-ink/12 bg-paper">
      <svg
        viewBox="0 0 800 400"
        className="block h-auto w-full"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label={`Carte des origines — ${top.label} ${top.percent.toFixed(1)}%`}
      >
        <defs>
          <pattern id="graticule" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(26,22,19,0.05)" strokeWidth="0.5" />
          </pattern>
          {/* Radial gradient for each region halo */}
          {(Object.keys(REGION_COLOR) as Region[]).map((r) => (
            <radialGradient key={r} id={`halo-${r}`}>
              <stop offset="0%" stopColor={REGION_COLOR[r]} stopOpacity="0.55" />
              <stop offset="55%" stopColor={REGION_COLOR[r]} stopOpacity="0.15" />
              <stop offset="100%" stopColor={REGION_COLOR[r]} stopOpacity="0" />
            </radialGradient>
          ))}
        </defs>

        {/* Background */}
        <rect width="800" height="400" fill="#f5efe5" />
        <rect width="800" height="400" fill="url(#graticule)" />

        {/* Continents (subtle fill so the halos read on top) */}
        <g fill="rgba(26,22,19,0.18)" stroke="rgba(26,22,19,0.35)" strokeWidth="0.7">
          {CONTINENTS.map((c, i) => (
            <path key={i} d={c.d} />
          ))}
        </g>

        {/* Halos — low-percent first so dominant sits on top */}
        {ordered.map((c) => {
          const center = REGION_CENTROIDS[c.region];
          if (!center || c.percent < 0.5) return null;
          // Halo radius proportional to sqrt(percent), clamped
          const r = 22 + Math.sqrt(c.percent) * 11;
          return (
            <circle
              key={`halo-${c.region}`}
              cx={center.x}
              cy={center.y}
              r={r}
              fill={`url(#halo-${c.region})`}
            />
          );
        })}

        {/* Region dots + labels for components ≥ 1% */}
        {ordered
          .filter((c) => c.percent >= 1)
          .map((c) => {
            const center = REGION_CENTROIDS[c.region];
            if (!center) return null;
            const r = 3 + Math.sqrt(c.percent) * 0.6;
            return (
              <g key={`mark-${c.region}`}>
                <circle
                  cx={center.x}
                  cy={center.y}
                  r={r}
                  fill={REGION_COLOR[c.region]}
                  stroke="#f5efe5"
                  strokeWidth="1.5"
                />
              </g>
            );
          })}

        {/* Dominant region label */}
        {(() => {
          const center = REGION_CENTROIDS[top.region];
          if (!center) return null;
          const labelY = center.y - 22 - Math.sqrt(top.percent) * 0.9;
          return (
            <g>
              <text
                x={center.x}
                y={labelY}
                textAnchor="middle"
                style={{ fontFamily: "var(--font-serif)" }}
                fontSize="18"
                fontWeight="500"
                fill="#1a1613"
              >
                {top.percent.toFixed(1)}%
              </text>
              <text
                x={center.x}
                y={labelY + 14}
                textAnchor="middle"
                style={{ fontFamily: "var(--font-sans)", letterSpacing: "0.12em" }}
                fontSize="8"
                fill="rgba(26,22,19,0.55)"
              >
                {top.label.toUpperCase()}
              </text>
            </g>
          );
        })()}
      </svg>

      {/* Legend + percents */}
      <div className="grid grid-cols-2 gap-x-5 gap-y-1.5 border-t border-ink/10 px-5 py-4 text-[12px] sm:grid-cols-3">
        {ancestry.components.map((c) => (
          <div key={c.region} className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{ background: REGION_COLOR[c.region] }}
              />
              <span className="text-ink/75">{c.label}</span>
            </div>
            <span className="font-mono tabular-nums text-ink/90">{c.percent.toFixed(1)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

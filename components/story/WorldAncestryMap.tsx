"use client";

import { useMemo } from "react";
import { geoEqualEarth, geoPath, geoGraticule10 } from "d3-geo";
import { feature } from "topojson-client";
import worldTopo from "world-atlas/countries-110m.json";
import type { AncestryComponent, AncestryResult } from "@/lib/types";
import { regionLabel } from "@/lib/annotation/ancestry";
import type { Lang } from "@/lib/i18n/lang";

type Region = AncestryComponent["region"];

// Pre-compute the projection + geo paths once at module scope: the world
// topology is static and the map has a fixed viewBox.
const WIDTH = 960;
const HEIGHT = 480;

const projection = geoEqualEarth()
  .scale(170)
  .translate([WIDTH / 2, HEIGHT / 2 + 10]);

const pathFn = geoPath(projection);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const world = worldTopo as any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const countries = feature(world, world.objects.countries) as any;

const graticulePath = pathFn(geoGraticule10()) ?? "";

// Region centroids in lon/lat — projected below.
const REGION_LONLAT: Record<Region, [number, number]> = {
  AFR: [20, 2], // central Africa
  EUR: [12, 50], // central Europe
  EAS: [110, 35], // eastern China
  SAS: [78, 22], // northern India
  AMR: [-95, 38], // central North America — dominant for AMR PGS references
};

const REGION_CENTROIDS: Record<Region, { x: number; y: number }> = Object.fromEntries(
  (Object.keys(REGION_LONLAT) as Region[]).map((r) => {
    const [x, y] = projection(REGION_LONLAT[r]) ?? [0, 0];
    return [r, { x, y }];
  }),
) as Record<Region, { x: number; y: number }>;

const REGION_COLOR: Record<Region, string> = {
  AFR: "#b8792f",
  EUR: "#1c3d78",
  EAS: "#c99a1f",
  SAS: "#7c3ca6",
  AMR: "#3a7d52",
};

export function WorldAncestryMap({ ancestry, lang = "fr" }: { ancestry: AncestryResult; lang?: Lang }) {
  const ordered = useMemo(
    () => [...ancestry.components].sort((a, b) => a.percent - b.percent),
    [ancestry.components],
  );
  const top = ancestry.topRegion;

  const countryPaths = useMemo(
    () =>
      (countries.features as unknown[])
        .map((f) => pathFn(f as Parameters<typeof pathFn>[0]))
        .filter((d): d is string => Boolean(d)),
    [],
  );

  const sphereOutline = useMemo(() => pathFn({ type: "Sphere" }) ?? "", []);

  return (
    <div className="mt-4 overflow-hidden rounded-sm border border-ink/12 bg-paper">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="block h-auto w-full"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label={`${lang === "en" ? "Ancestry map" : "Carte des origines"} — ${regionLabel(top.region, lang)} ${top.percent.toFixed(1)}%`}
      >
        <defs>
          {(Object.keys(REGION_COLOR) as Region[]).map((r) => (
            <radialGradient key={r} id={`halo-${r}`}>
              <stop offset="0%" stopColor={REGION_COLOR[r]} stopOpacity="0.6" />
              <stop offset="45%" stopColor={REGION_COLOR[r]} stopOpacity="0.22" />
              <stop offset="100%" stopColor={REGION_COLOR[r]} stopOpacity="0" />
            </radialGradient>
          ))}
          <clipPath id="sphere-clip">
            <path d={sphereOutline} />
          </clipPath>
        </defs>

        {/* Ocean (sphere) */}
        <path d={sphereOutline} fill="#f0e9dd" stroke="rgba(26,22,19,0.18)" strokeWidth="0.8" />

        {/* Graticule (faint lon/lat grid) */}
        <path
          d={graticulePath}
          fill="none"
          stroke="rgba(26,22,19,0.08)"
          strokeWidth="0.4"
          clipPath="url(#sphere-clip)"
        />

        {/* Countries */}
        <g fill="rgba(26,22,19,0.16)" stroke="rgba(26,22,19,0.32)" strokeWidth="0.4">
          {countryPaths.map((d: string, i: number) => (
            <path key={i} d={d} vectorEffect="non-scaling-stroke" />
          ))}
        </g>

        {/* Halos — low-percent first so dominant sits on top */}
        {ordered.map((c) => {
          const center = REGION_CENTROIDS[c.region];
          if (!center || c.percent < 0.5) return null;
          const r = 32 + Math.sqrt(c.percent) * 13;
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

        {/* Region dots for components ≥ 1% */}
        {ordered
          .filter((c) => c.percent >= 1)
          .map((c) => {
            const center = REGION_CENTROIDS[c.region];
            if (!center) return null;
            const r = 3.2 + Math.sqrt(c.percent) * 0.55;
            return (
              <circle
                key={`mark-${c.region}`}
                cx={center.x}
                cy={center.y}
                r={r}
                fill={REGION_COLOR[c.region]}
                stroke="#f0e9dd"
                strokeWidth="1.5"
              />
            );
          })}

        {/* Dominant region label */}
        {(() => {
          const center = REGION_CENTROIDS[top.region];
          if (!center) return null;
          const labelY = center.y - 28 - Math.sqrt(top.percent) * 0.9;
          return (
            <g>
              <text
                x={center.x}
                y={labelY}
                textAnchor="middle"
                style={{ fontFamily: "var(--font-serif)" }}
                fontSize="20"
                fontWeight="500"
                fill="#1a1613"
              >
                {top.percent.toFixed(1)}%
              </text>
              <text
                x={center.x}
                y={labelY + 15}
                textAnchor="middle"
                style={{ fontFamily: "var(--font-sans)", letterSpacing: "0.14em" }}
                fontSize="9"
                fill="rgba(26,22,19,0.6)"
              >
                {regionLabel(top.region, lang).toUpperCase()}
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
              <span className="text-ink/75">{regionLabel(c.region, lang)}</span>
            </div>
            <span className="font-mono tabular-nums text-ink/90">{c.percent.toFixed(1)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

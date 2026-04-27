"use client";

import { useEffect, useMemo, useState } from "react";
import type { DensityMap } from "@/lib/types";
import type { Lang } from "@/lib/i18n/lang";

type Cyto = {
  chromosomes: { chr: string; length: number; centromere: [number, number] }[];
};

interface DensityHeatmapProps {
  density: DensityMap;
  binSizeMb?: number;
  lang?: Lang;
}

const ORDER = [
  "1","2","3","4","5","6","7","8","9","10","11","12",
  "13","14","15","16","17","18","19","20","21","22","X","Y",
];

export function DensityHeatmap({ density, binSizeMb = 1, lang = "fr" }: DensityHeatmapProps) {
  const [cyto, setCyto] = useState<Cyto | null>(null);

  useEffect(() => {
    fetch("/data/karyogram.json")
      .then((r) => r.json())
      .then(setCyto)
      .catch(() => setCyto(null));
  }, []);

  const { maxCount, maxBins, rows } = useMemo(() => {
    let max = 0;
    let bins = 0;
    const ordered = ORDER.map((chr) => {
      const raw = density[chr] ?? density[`CHR${chr}`] ?? [];
      if (raw.length > bins) bins = raw.length;
      for (const v of raw) if (v && v > max) max = v;
      return { chr, counts: raw };
    });
    return { maxCount: max || 1, maxBins: bins || 1, rows: ordered };
  }, [density]);

  if (!cyto) {
    return <div className="py-8 text-center text-sm text-fg-muted">Chargement…</div>;
  }

  const labelW = 28;
  const rowH = 14;
  const rightPad = 8;
  const viewW = 820;
  const cellW = (viewW - labelW - rightPad) / maxBins;

  const colorFor = (v: number) => {
    if (!v) return "rgb(22 24 33)";
    const t = Math.log1p(v) / Math.log1p(maxCount);
    const r = Math.round(40 + t * 180);
    const g = Math.round(50 + t * 160);
    const b = Math.round(80 + t * 175);
    return `rgb(${r} ${g} ${b})`;
  };

  const halfIdx = Math.ceil(rows.length / 2);
  const columns = [rows.slice(0, halfIdx), rows.slice(halfIdx)];

  const renderColumn = (col: typeof rows, key: string) => {
    const colH = col.length * (rowH + 2) + 4;
    return (
      <svg key={key} viewBox={`0 0 ${viewW} ${colH}`} className="w-full">
        {col.map((row, i) => {
          const y = i * (rowH + 2) + 2;
          return (
            <g key={row.chr}>
              <text
                x={labelW - 4}
                y={y + rowH - 3}
                textAnchor="end"
                className="fill-fg-muted font-mono text-[9px]"
              >
                {row.chr}
              </text>
              {row.counts.map((c, b) => (
                <rect
                  key={b}
                  x={labelW + b * cellW}
                  y={y}
                  width={Math.max(cellW, 0.6)}
                  height={rowH}
                  fill={colorFor(c ?? 0)}
                >
                  {c ? <title>{`chr${row.chr} · ${b * binSizeMb}-${(b + 1) * binSizeMb} Mb · ${c} SNPs`}</title> : null}
                </rect>
              ))}
            </g>
          );
        })}
      </svg>
    );
  };

  return (
    <div>
      <div className="grid grid-cols-1 gap-x-4 gap-y-2 md:grid-cols-2">
        {renderColumn(columns[0], "left")}
        {renderColumn(columns[1], "right")}
      </div>
      <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-fg-muted">
        <span className="whitespace-nowrap">
          {lang === "en" ? `SNP density / ${binSizeMb} Mb` : `Densité / ${binSizeMb} Mb`}
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-sm" style={{ background: colorFor(0) }} />
          <span>0</span>
          <span
            className="inline-block h-2 w-10"
            style={{ background: `linear-gradient(to right, ${colorFor(1)}, ${colorFor(maxCount)})` }}
          />
          <span>{maxCount}</span>
        </span>
      </div>
    </div>
  );
}

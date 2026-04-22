"use client";

import { useEffect, useMemo, useState } from "react";

type Cyto = {
  build: string;
  chromosomes: { chr: string; length: number; centromere: [number, number] }[];
};

type Marker = {
  chr: string;
  pos: number;
  color: string;
  label: string;
  id: string;
};

interface KaryogramProps {
  markers: Marker[];
}

const ROW_HEIGHT = 22;
const CHR_WIDTH = 8;
const LABEL_COL = 32;
const RIGHT_PAD = 18;

export function Karyogram({ markers }: KaryogramProps) {
  const [cyto, setCyto] = useState<Cyto | null>(null);

  useEffect(() => {
    fetch("/data/karyogram.json")
      .then((r) => r.json())
      .then(setCyto)
      .catch(() => setCyto(null));
  }, []);

  const { chromosomes, maxLen } = useMemo(() => {
    if (!cyto) return { chromosomes: [], maxLen: 0 };
    const chrs = cyto.chromosomes.filter((c) => c.chr !== "MT");
    const m = chrs.reduce((mx, c) => Math.max(mx, c.length), 0);
    return { chromosomes: chrs, maxLen: m };
  }, [cyto]);

  const markersByChr = useMemo(() => {
    const map = new Map<string, Marker[]>();
    for (const m of markers) {
      const key = m.chr.replace(/^chr/i, "").toUpperCase();
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(m);
    }
    return map;
  }, [markers]);

  if (!cyto) {
    return <div className="py-12 text-center text-sm text-fg-muted">Chargement du karyogramme…</div>;
  }

  const viewWidth = 780;
  const trackWidth = viewWidth - LABEL_COL - RIGHT_PAD;
  const scale = trackWidth / maxLen;
  const viewHeight = chromosomes.length * ROW_HEIGHT + 20;

  return (
    <svg viewBox={`0 0 ${viewWidth} ${viewHeight}`} className="w-full">
      {chromosomes.map((c, idx) => {
        const y = idx * ROW_HEIGHT + 10;
        const len = c.length * scale;
        const cenStart = c.centromere[0] * scale;
        const cenEnd = c.centromere[1] * scale;
        const rowMarkers = markersByChr.get(c.chr.toUpperCase()) ?? [];
        return (
          <g key={c.chr}>
            <text
              x={LABEL_COL - 6}
              y={y + CHR_WIDTH + 2}
              textAnchor="end"
              className="fill-fg-muted text-[10px] font-mono"
            >
              {c.chr}
            </text>
            {/* p arm */}
            <rect
              x={LABEL_COL}
              y={y + 2}
              width={cenStart}
              height={CHR_WIDTH}
              rx={CHR_WIDTH / 2}
              fill="rgb(22 24 33)"
              stroke="rgb(36 40 52)"
            />
            {/* q arm */}
            <rect
              x={LABEL_COL + cenEnd}
              y={y + 2}
              width={len - cenEnd}
              height={CHR_WIDTH}
              rx={CHR_WIDTH / 2}
              fill="rgb(22 24 33)"
              stroke="rgb(36 40 52)"
            />
            {/* centromere */}
            <circle
              cx={LABEL_COL + (cenStart + cenEnd) / 2}
              cy={y + 2 + CHR_WIDTH / 2}
              r={3}
              fill="rgb(36 40 52)"
            />
            {/* markers */}
            {rowMarkers.map((m) => (
              <g key={m.id}>
                <line
                  x1={LABEL_COL + m.pos * scale}
                  x2={LABEL_COL + m.pos * scale}
                  y1={y - 1}
                  y2={y + CHR_WIDTH + 5}
                  stroke={m.color}
                  strokeWidth={1.5}
                />
                <circle
                  cx={LABEL_COL + m.pos * scale}
                  cy={y - 2}
                  r={3}
                  fill={m.color}
                >
                  <title>{m.label}</title>
                </circle>
              </g>
            ))}
          </g>
        );
      })}
    </svg>
  );
}

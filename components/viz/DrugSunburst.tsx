"use client";

import { useMemo } from "react";
import type { PharmaByDrug, Severity } from "@/lib/types";

const COLOR: Record<Severity, string> = {
  low: "rgb(120 220 160)",
  medium: "rgb(236 196 92)",
  high: "rgb(247 110 110)",
};

interface Props {
  byDrug: PharmaByDrug[];
  onSelect?: (drug: string) => void;
}

type Slice = {
  drug: string;
  severity: Severity;
  start: number;
  end: number;
  clazz: string;
};

export function DrugSunburst({ byDrug, onSelect }: Props) {
  const slices = useMemo<Slice[]>(() => {
    if (byDrug.length === 0) return [];
    const total = byDrug.length;
    return byDrug.map((d, i) => ({
      drug: d.drug,
      severity: d.severity,
      start: (i / total) * Math.PI * 2,
      end: ((i + 1) / total) * Math.PI * 2,
      clazz: d.drug_class ?? "autre",
    }));
  }, [byDrug]);

  if (slices.length === 0) {
    return (
      <div className="py-10 text-center text-sm text-fg-muted">
        Aucun médicament concerné parmi les règles PGx disponibles.
      </div>
    );
  }

  const cx = 180;
  const cy = 180;
  const rInner = 60;
  const rOuter = 160;

  return (
    <svg viewBox="0 0 360 360" className="h-auto w-full max-w-[420px]">
      <defs>
        <radialGradient id="sb-glow">
          <stop offset="0%" stopColor="rgb(120 180 255)" stopOpacity="0.35" />
          <stop offset="100%" stopColor="rgb(120 180 255)" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx={cx} cy={cy} r={rOuter} fill="url(#sb-glow)" />
      <circle cx={cx} cy={cy} r={rInner - 4} fill="rgb(16 18 25)" stroke="rgb(36 40 52)" />
      <text
        x={cx}
        y={cy - 4}
        textAnchor="middle"
        className="fill-fg text-sm font-semibold"
      >
        {byDrug.length}
      </text>
      <text
        x={cx}
        y={cy + 12}
        textAnchor="middle"
        className="fill-fg-muted text-[10px] uppercase tracking-wider"
      >
        médicaments
      </text>

      {slices.map((s) => {
        const x1 = cx + Math.cos(s.start) * rInner;
        const y1 = cy + Math.sin(s.start) * rInner;
        const x2 = cx + Math.cos(s.start) * rOuter;
        const y2 = cy + Math.sin(s.start) * rOuter;
        const x3 = cx + Math.cos(s.end) * rOuter;
        const y3 = cy + Math.sin(s.end) * rOuter;
        const x4 = cx + Math.cos(s.end) * rInner;
        const y4 = cy + Math.sin(s.end) * rInner;
        const largeArc = s.end - s.start > Math.PI ? 1 : 0;
        const d = [
          `M ${x1} ${y1}`,
          `L ${x2} ${y2}`,
          `A ${rOuter} ${rOuter} 0 ${largeArc} 1 ${x3} ${y3}`,
          `L ${x4} ${y4}`,
          `A ${rInner} ${rInner} 0 ${largeArc} 0 ${x1} ${y1}`,
          "Z",
        ].join(" ");

        const mid = (s.start + s.end) / 2;
        const lx = cx + Math.cos(mid) * (rInner + (rOuter - rInner) / 2);
        const ly = cy + Math.sin(mid) * (rInner + (rOuter - rInner) / 2);

        return (
          <g
            key={s.drug}
            className="cursor-pointer transition hover:opacity-80"
            onClick={() => onSelect?.(s.drug)}
          >
            <path d={d} fill={COLOR[s.severity]} fillOpacity={0.85} stroke="rgb(9 10 14)" strokeWidth={1} />
            {s.end - s.start > 0.35 && (
              <text
                x={lx}
                y={ly}
                textAnchor="middle"
                dominantBaseline="middle"
                className="fill-bg text-[9px] font-semibold pointer-events-none"
                transform={`rotate(${((mid * 180) / Math.PI + 90) % 360 > 180 ? (mid * 180) / Math.PI - 90 : (mid * 180) / Math.PI + 90}, ${lx}, ${ly})`}
              >
                {s.drug.length > 12 ? `${s.drug.slice(0, 11)}…` : s.drug}
              </text>
            )}
            <title>{`${s.drug} — ${s.clazz} (${s.severity})`}</title>
          </g>
        );
      })}
    </svg>
  );
}

"use client";

import { useMemo, useState } from "react";
import type { PharmaByDrug, Severity } from "@/lib/types";

const COLOR: Record<Severity, string> = {
  low: "rgb(120 220 160)",
  medium: "rgb(236 196 92)",
  high: "rgb(247 110 110)",
};

const SEV_ORDER: Severity[] = ["high", "medium", "low"];
const SEV_LABEL: Record<Severity, string> = {
  high: "Pertinence haute",
  medium: "Pertinence modérée",
  low: "Pertinence faible",
};

interface Props {
  byDrug: PharmaByDrug[];
  onSelect?: (drug: string) => void;
}

type Seg = {
  drug: PharmaByDrug;
  start: number;
  end: number;
  ring: number;
};

export function DrugSunburst({ byDrug, onSelect }: Props) {
  const [hover, setHover] = useState<string | null>(null);

  const { segs, bySev } = useMemo(() => {
    const grouped: Record<Severity, PharmaByDrug[]> = { high: [], medium: [], low: [] };
    for (const d of byDrug) grouped[d.severity].push(d);
    for (const s of SEV_ORDER) grouped[s].sort((a, b) => a.drug.localeCompare(b.drug));

    const nonEmpty = SEV_ORDER.filter((s) => grouped[s].length > 0);
    const out: Seg[] = [];
    // each ring goes full 360° with gaps between drugs
    nonEmpty.forEach((sev, ring) => {
      const drugs = grouped[sev];
      const n = drugs.length;
      const gap = (Math.PI * 2) * 0.005;
      const step = (Math.PI * 2 - gap * n) / n;
      drugs.forEach((d, i) => {
        const start = -Math.PI / 2 + i * (step + gap);
        out.push({ drug: d, start, end: start + step, ring });
      });
    });
    return { segs: out, bySev: grouped };
  }, [byDrug]);

  if (byDrug.length === 0) {
    return (
      <div className="py-10 text-center text-sm text-fg-muted">
        Aucun médicament concerné parmi les règles PGx disponibles.
      </div>
    );
  }

  const cx = 180;
  const cy = 180;
  const rings: { inner: number; outer: number }[] = [
    { inner: 140, outer: 168 }, // ring 0: first severity present
    { inner: 106, outer: 134 },
    { inner: 72, outer: 100 },
  ];

  const activeRings = SEV_ORDER.filter((s) => bySev[s].length > 0);

  return (
    <div className="flex w-full flex-col items-center gap-4">
      <svg viewBox="0 0 360 360" className="h-auto w-full max-w-[min(90vw,400px)]">
        <defs>
          <radialGradient id="sb-core">
            <stop offset="0%" stopColor="rgb(var(--accent) / 0.25)" />
            <stop offset="60%" stopColor="rgb(var(--accent) / 0.06)" />
            <stop offset="100%" stopColor="rgb(var(--accent) / 0)" />
          </radialGradient>
          <filter id="sb-shadow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="1.5" />
          </filter>
        </defs>

        {/* ambient */}
        <circle cx={cx} cy={cy} r={170} fill="url(#sb-core)" />

        {segs.map((s) => {
          const ringIdx = activeRings.indexOf(s.drug.severity);
          const r = rings[ringIdx];
          const x1 = cx + Math.cos(s.start) * r.inner;
          const y1 = cy + Math.sin(s.start) * r.inner;
          const x2 = cx + Math.cos(s.start) * r.outer;
          const y2 = cy + Math.sin(s.start) * r.outer;
          const x3 = cx + Math.cos(s.end) * r.outer;
          const y3 = cy + Math.sin(s.end) * r.outer;
          const x4 = cx + Math.cos(s.end) * r.inner;
          const y4 = cy + Math.sin(s.end) * r.inner;
          const largeArc = s.end - s.start > Math.PI ? 1 : 0;
          const d = [
            `M ${x1} ${y1}`,
            `L ${x2} ${y2}`,
            `A ${r.outer} ${r.outer} 0 ${largeArc} 1 ${x3} ${y3}`,
            `L ${x4} ${y4}`,
            `A ${r.inner} ${r.inner} 0 ${largeArc} 0 ${x1} ${y1}`,
            "Z",
          ].join(" ");
          const isHover = hover === s.drug.drug;
          return (
            <g
              key={s.drug.drug}
              className="cursor-pointer transition"
              onClick={() => onSelect?.(s.drug.drug)}
              onMouseEnter={() => setHover(s.drug.drug)}
              onMouseLeave={() => setHover(null)}
            >
              <path
                d={d}
                fill={COLOR[s.drug.severity]}
                fillOpacity={isHover ? 1 : 0.78}
                stroke="rgb(9 10 14)"
                strokeWidth={1.5}
                style={{
                  filter: isHover ? "brightness(1.15)" : undefined,
                  transition: "all .15s",
                }}
              />
              <title>{`${s.drug.drug} (${SEV_LABEL[s.drug.severity]})`}</title>
            </g>
          );
        })}

        {/* center label */}
        <circle
          cx={cx}
          cy={cy}
          r={62}
          fill="#f5efe5"
          stroke="rgba(26,22,19,0.18)"
          strokeWidth={1}
        />
        <text
          x={cx}
          y={cy - 4}
          textAnchor="middle"
          style={{ fontFamily: "var(--font-serif)" }}
          fontSize="32"
          fontWeight={500}
          fill="#1a1613"
          className="tabular-nums"
        >
          {byDrug.length}
        </text>
        <text
          x={cx}
          y={cy + 18}
          textAnchor="middle"
          fontSize="9"
          fill="rgba(26,22,19,0.6)"
          style={{ letterSpacing: "0.18em" }}
        >
          MÉDICAMENTS
        </text>
      </svg>

      {/* hover read-out: always takes space so layout stays stable */}
      <div className="flex min-h-[32px] items-center justify-center text-sm">
        {hover ? (
          <div className="flex items-center gap-2 rounded-full border border-border bg-surface-2/60 px-3 py-1">
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ background: COLOR[byDrug.find((d) => d.drug === hover)!.severity] }}
            />
            <span className="font-medium capitalize text-fg">{hover}</span>
            <span className="text-xs text-fg-muted">
              · {byDrug.find((d) => d.drug === hover)?.drug_class ?? "—"}
            </span>
          </div>
        ) : (
          <span className="text-xs text-fg-muted">Survolez un secteur · cliquez pour détailler</span>
        )}
      </div>

      {/* severity rings legend with counts */}
      <div className="flex flex-wrap justify-center gap-4 text-xs">
        {SEV_ORDER.filter((s) => bySev[s].length > 0).map((s) => (
          <span key={s} className="flex items-center gap-1.5 text-fg-muted">
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ background: COLOR[s] }}
            />
            {SEV_LABEL[s]}
            <span className="tabular-nums text-fg-muted/70">({bySev[s].length})</span>
          </span>
        ))}
      </div>
    </div>
  );
}

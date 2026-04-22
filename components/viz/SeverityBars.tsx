"use client";

import type { Severity } from "@/lib/types";

const COLOR: Record<Severity, string> = {
  low: "rgb(120 220 160)",
  medium: "rgb(236 196 92)",
  high: "rgb(247 110 110)",
};

interface SeverityBarsProps {
  counts: Record<Severity, number>;
}

export function SeverityBars({ counts }: SeverityBarsProps) {
  const max = Math.max(1, counts.low, counts.medium, counts.high);
  const levels: { key: Severity; label: string }[] = [
    { key: "high", label: "Critique" },
    { key: "medium", label: "Modéré" },
    { key: "low", label: "Mineur" },
  ];

  return (
    <div className="space-y-3">
      {levels.map(({ key, label }) => (
        <div key={key} className="flex items-center gap-3">
          <div className="w-20 text-xs text-fg-muted">{label}</div>
          <div className="relative h-5 flex-1 overflow-hidden rounded-full bg-surface-2">
            <div
              className="h-full rounded-full"
              style={{
                width: `${(counts[key] / max) * 100}%`,
                background: COLOR[key],
                boxShadow: `0 0 18px -4px ${COLOR[key]}`,
              }}
            />
          </div>
          <div className="w-8 text-right font-mono text-sm tabular-nums text-fg">
            {counts[key]}
          </div>
        </div>
      ))}
    </div>
  );
}

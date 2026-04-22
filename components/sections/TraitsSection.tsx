"use client";

import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import type { TraitConfidence, TraitFinding } from "@/lib/types";

interface TraitsSectionProps {
  findings: TraitFinding[];
}

const CONFIDENCE_VAR: Record<TraitConfidence, "ok" | "warn" | "neutral"> = {
  high: "ok",
  medium: "warn",
  low: "neutral",
};

const EMOJI_BY_ID: Record<string, string> = {
  lactose: "🥛",
  alcohol_flush: "🍷",
  caffeine: "☕",
  muscle_fiber_actn3: "💪",
  bitter_taste: "🥦",
  eye_color: "👁️",
  hair_red: "🦰",
  earwax_type: "👂",
  asparagus_anosmia: "🌿",
  cilantro_soap: "🌱",
  sleep_chronotype: "🌙",
  sleep_short: "😴",
  alcohol_metab_adh1b: "🥃",
  nicotine_dependence: "🚬",
  apoe: "🧠",
  hemochromatosis: "🩸",
  celiac_hla_proxy: "🌾",
  warfarin_sensitivity: "💊",
  male_pattern_baldness_proxy: "💇",
  freckles: "✨",
};

export function TraitsSection({ findings }: TraitsSectionProps) {
  const determined = findings.filter((f) => f.result !== null);
  const indeterminate = findings.filter((f) => f.result === null);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {determined.map((f) => (
          <Card key={f.rule.id} className="group transition hover:-translate-y-0.5 hover:border-accent/40">
            <div className="flex items-start justify-between gap-3">
              <div className="text-3xl">{EMOJI_BY_ID[f.rule.id] ?? "🧬"}</div>
              <Badge variant={CONFIDENCE_VAR[f.rule.confidence]}>
                {f.rule.confidence === "high" ? "Fiable" : f.rule.confidence === "medium" ? "Moyen" : "Indicatif"}
              </Badge>
            </div>
            <h3 className="mt-3 text-base font-semibold tracking-tight">{f.rule.title}</h3>
            <div className="mt-1 text-xs font-mono text-fg-muted">{f.rule.gene}</div>
            <div className="mt-3 text-lg font-semibold text-accent">{f.result?.label}</div>
            {f.result?.detail && (
              <p className="mt-1 text-sm text-fg-muted">{f.result.detail}</p>
            )}
            <div className="mt-3 flex flex-wrap gap-1.5 text-[10px] text-fg-muted">
              {Object.entries(f.genotypes_used).map(([rs, g]) => (
                <span key={rs} className="rounded bg-surface-2 px-1.5 py-0.5 font-mono">
                  {rs}={g ?? "—"}
                </span>
              ))}
            </div>
          </Card>
        ))}
      </div>

      {indeterminate.length > 0 && (
        <Card>
          <h3 className="text-sm font-semibold text-fg-muted">
            {indeterminate.length} trait(s) indéterminé(s) — rsID manquant ou génotype non reconnu
          </h3>
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            {indeterminate.map((f) => (
              <span key={f.rule.id} className="rounded bg-surface-2 px-2 py-1 text-fg-muted">
                {f.rule.title}
              </span>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

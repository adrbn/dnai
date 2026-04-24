"use client";

import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { TraitsAvatar } from "@/components/viz/TraitsAvatar";
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
  celiac_hla: "🌾",
  obesity_fto: "⚖️",
  mthfr_folate: "🥬",
  omega3_fads1: "🐟",
  vitamin_d_gc: "☀️",
  salt_sensitivity_agt: "🧂",
};

const NUTRITION_IDS = new Set([
  "lactose",
  "caffeine",
  "alcohol_flush",
  "alcohol_metab_adh1b",
  "bitter_taste",
  "cilantro_soap",
  "asparagus_anosmia",
  "celiac_hla",
  "obesity_fto",
  "mthfr_folate",
  "omega3_fads1",
  "vitamin_d_gc",
  "salt_sensitivity_agt",
]);

const APPEARANCE_IDS = new Set([
  "eye_color",
  "hair_red",
  "earwax_type",
  "freckles",
  "male_pattern_baldness_proxy",
]);

function TraitCard({ f }: { f: TraitFinding }) {
  return (
    <Card className="group transition hover:-translate-y-0.5 hover:border-accent/40">
      <div className="flex items-start justify-between gap-3">
        <div className="text-3xl">{EMOJI_BY_ID[f.rule.id] ?? "🧬"}</div>
        <Badge variant={CONFIDENCE_VAR[f.rule.confidence]}>
          {f.rule.confidence === "high" ? "Fiable" : f.rule.confidence === "medium" ? "Moyen" : "Indicatif"}
        </Badge>
      </div>
      <h3 className="mt-3 text-base font-semibold tracking-tight">{f.rule.title}</h3>
      <div className="mt-1 text-xs font-mono text-fg-muted">{f.rule.gene}</div>
      <div className="mt-3 text-lg font-semibold text-accent">{f.result?.label}</div>
      {f.result?.detail && <p className="mt-1 text-sm text-fg-muted">{f.result.detail}</p>}
      <div className="mt-3 flex flex-wrap gap-1.5 text-[10px] text-fg-muted">
        {Object.entries(f.genotypes_used).map(([rs, g]) => (
          <span key={rs} className="rounded bg-surface-2 px-1.5 py-0.5 font-mono">
            {rs}={g ?? "—"}
          </span>
        ))}
      </div>
    </Card>
  );
}

export function TraitsSection({ findings }: TraitsSectionProps) {
  const determined = findings.filter((f) => f.result !== null);
  const indeterminate = findings.filter((f) => f.result === null);

  const appearance = determined.filter((f) => APPEARANCE_IDS.has(f.rule.id));
  const nutrition = determined.filter((f) => NUTRITION_IDS.has(f.rule.id));
  const other = determined.filter(
    (f) => !APPEARANCE_IDS.has(f.rule.id) && !NUTRITION_IDS.has(f.rule.id),
  );

  return (
    <div className="space-y-8">
      {appearance.length >= 2 && (
        <Card>
          <CardHeader
            title="Votre avatar"
            subtitle="Cartoon dérivé de vos variants morphologiques — caricatural, pas un portrait."
          />
          <div className="mt-2 grid items-center gap-6 md:grid-cols-[auto_1fr]">
            <TraitsAvatar findings={determined} />
            <div className="text-sm text-fg-muted">
              <p>
                L&apos;avatar combine six traits : couleur des yeux (HERC2), pilosité MC1R,
                tendance aux taches de rousseur, type de cérumen (ABCC11), perception
                savonneuse de la coriandre (OR6A2) et sensibilité aux amers (TAS2R38).
              </p>
              <p className="mt-2 text-xs">
                Les variants affichés sont probabilistes — la couleur des yeux et la rousseur
                dépendent de dizaines d&apos;autres loci. Cet avatar est une illustration,
                pas une prédiction médicale.
              </p>
            </div>
          </div>
        </Card>
      )}

      {appearance.length > 0 && (
        <div>
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="font-serif text-xl font-medium tracking-tight">Apparence</h2>
            <span className="text-xs text-fg-muted">{appearance.length} variants</span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {appearance.map((f) => (
              <TraitCard key={f.rule.id} f={f} />
            ))}
          </div>
        </div>
      )}

      {nutrition.length > 0 && (
        <div>
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="font-serif text-xl font-medium tracking-tight">Nutrition & métabolisme</h2>
            <span className="text-xs text-fg-muted">{nutrition.length} variants</span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {nutrition.map((f) => (
              <TraitCard key={f.rule.id} f={f} />
            ))}
          </div>
        </div>
      )}

      {other.length > 0 && (
        <div>
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="font-serif text-xl font-medium tracking-tight">Autres traits</h2>
            <span className="text-xs text-fg-muted">{other.length} variants</span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {other.map((f) => (
              <TraitCard key={f.rule.id} f={f} />
            ))}
          </div>
        </div>
      )}

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

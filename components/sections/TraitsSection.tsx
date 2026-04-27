"use client";

import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { TraitsAvatar } from "@/components/viz/TraitsAvatar";
import { SectionPrimer } from "@/components/SectionPrimer";
import type { TraitConfidence, TraitFinding } from "@/lib/types";
import { S, tr, trTpl } from "@/lib/i18n/strings";
import type { Lang } from "@/lib/i18n/lang";

interface TraitsSectionProps {
  findings: TraitFinding[];
  lang?: Lang;
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

function TraitCard({ f, lang }: { f: TraitFinding; lang: Lang }) {
  const confLabel =
    f.rule.confidence === "high"
      ? tr(S.traits.confHigh, lang)
      : f.rule.confidence === "medium"
        ? tr(S.traits.confMedium, lang)
        : tr(S.traits.confLow, lang);
  return (
    <Card className="group transition hover:-translate-y-0.5 hover:border-accent/40">
      <div className="flex items-start justify-between gap-3">
        <div className="text-3xl">{EMOJI_BY_ID[f.rule.id] ?? "🧬"}</div>
        <Badge variant={CONFIDENCE_VAR[f.rule.confidence]}>{confLabel}</Badge>
      </div>
      <h3 className="mt-3 text-base font-semibold tracking-tight">{lang === "en" ? f.rule.title_en ?? f.rule.title : f.rule.title}</h3>
      <div className="mt-1 text-xs font-mono text-fg-muted">{f.rule.gene}</div>
      <div className="mt-3 text-lg font-semibold text-accent">{lang === "en" ? f.result?.label_en ?? f.result?.label : f.result?.label}</div>
      {(lang === "en" ? f.result?.detail_en ?? f.result?.detail : f.result?.detail) && (
        <p className="mt-1 text-sm text-fg-muted">{lang === "en" ? f.result?.detail_en ?? f.result?.detail : f.result?.detail}</p>
      )}
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

export function TraitsSection({ findings, lang = "fr" }: TraitsSectionProps) {
  const determined = findings.filter((f) => f.result !== null);
  const indeterminate = findings.filter((f) => f.result === null);

  const appearance = determined.filter((f) => APPEARANCE_IDS.has(f.rule.id));
  const nutrition = determined.filter((f) => NUTRITION_IDS.has(f.rule.id));
  const other = determined.filter(
    (f) => !APPEARANCE_IDS.has(f.rule.id) && !NUTRITION_IDS.has(f.rule.id),
  );

  return (
    <div className="space-y-8">
      <SectionPrimer kind="traits" lang={lang} />
      {appearance.length >= 2 && (
        <Card>
          <CardHeader
            title={tr(S.traits.avatarTitle, lang)}
            subtitle={tr(S.traits.avatarSubtitle, lang)}
          />
          <div className="mt-2 grid items-center gap-6 md:grid-cols-[auto_1fr]">
            <TraitsAvatar findings={determined} />
            <div className="text-sm text-fg-muted">
              <p>{tr(S.traits.avatarBody, lang)}</p>
              <p className="mt-2 text-xs">{tr(S.traits.avatarCaveat, lang)}</p>
            </div>
          </div>
        </Card>
      )}

      {appearance.length > 0 && (
        <div>
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="font-serif text-xl font-medium tracking-tight">{tr(S.traits.appearance, lang)}</h2>
            <span className="text-xs text-fg-muted">{appearance.length} {tr(S.traits.variants, lang)}</span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {appearance.map((f) => (
              <TraitCard key={f.rule.id} f={f} lang={lang} />
            ))}
          </div>
        </div>
      )}

      {nutrition.length > 0 && (
        <div>
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="font-serif text-xl font-medium tracking-tight">{tr(S.traits.nutrition, lang)}</h2>
            <span className="text-xs text-fg-muted">{nutrition.length} {tr(S.traits.variants, lang)}</span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {nutrition.map((f) => (
              <TraitCard key={f.rule.id} f={f} lang={lang} />
            ))}
          </div>
        </div>
      )}

      {other.length > 0 && (
        <div>
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="font-serif text-xl font-medium tracking-tight">{tr(S.traits.other, lang)}</h2>
            <span className="text-xs text-fg-muted">{other.length} {tr(S.traits.variants, lang)}</span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {other.map((f) => (
              <TraitCard key={f.rule.id} f={f} lang={lang} />
            ))}
          </div>
        </div>
      )}

      {indeterminate.length > 0 && (
        <Card>
          <h3 className="text-sm font-semibold text-fg-muted">
            {trTpl(S.traits.indeterminateTpl, lang, indeterminate.length)}
          </h3>
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            {indeterminate.map((f) => (
              <span key={f.rule.id} className="rounded bg-surface-2 px-2 py-1 text-fg-muted">
                {lang === "en" ? f.rule.title_en ?? f.rule.title : f.rule.title}
              </span>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

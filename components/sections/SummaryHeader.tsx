"use client";

import type { AnalysisResult } from "@/lib/types";
import { sourceBadge, sourcePrimer } from "@/lib/source-copy";

interface Props {
  result: AnalysisResult;
  active?: "overview" | "health" | "pharma" | "risk" | "traits" | "lookup" | "compare";
}

export function SummaryHeader({ result, active }: Props) {
  const callRate =
    result.meta.totalSNPs === 0 ? 0 : 1 - result.meta.noCalls / result.meta.totalSNPs;
  const highRisk = result.prs.filter((p) => p.percentile >= 75).length;
  const veryHighRisk = result.prs.filter((p) => p.percentile >= 90).length;
  const traitsOk = result.traits.filter((t) => t.result).length;
  const criticalDrugs = result.pharma.byDrug.filter((d) => d.severity === "high").length;

  const stats = {
    clinvar: result.clinvar.length,
    drugs: result.pharma.byDrug.length,
    criticalDrugs,
    prsHigh: highRisk,
    prsVeryHigh: veryHighRisk,
    prsTotal: result.prs.length,
    traitsOk,
    traitsTotal: result.traits.length,
    fRoh: result.roh.fRoh,
  };
  const isOverview = active === "overview" || active === undefined;
  const scopedPoints = isOverview ? [] : scopedConclusionPoints(stats, result, active);

  const items: Item[] = [
    {
      key: "snps",
      label: "SNPs",
      value: formatInt(result.meta.totalSNPs),
      sub: `${(callRate * 100).toFixed(1)}% call`,
    },
    {
      key: "health",
      label: "Santé (ClinVar)",
      value: result.clinvar.length,
      sub: "P / LP",
      tone: result.clinvar.length > 0 ? "danger" : "muted",
    },
    {
      key: "pharma",
      label: "Pharmaco",
      value: result.pharma.byDrug.length,
      sub: `${result.pharma.findings.length} règles`,
      tone: result.pharma.byDrug.length > 0 ? "warn" : "muted",
    },
    {
      key: "risk",
      label: "PRS élevés",
      value: highRisk,
      sub: `${result.prs.length} évalués`,
      tone: highRisk > 0 ? "warn" : "muted",
    },
    {
      key: "traits",
      label: "Traits",
      value: `${traitsOk}/${result.traits.length}`,
      sub: "déterminés",
      tone: "accent",
    },
    {
      key: "roh",
      label: "F_ROH",
      value: `${(result.roh.fRoh * 100).toFixed(2)}%`,
      sub: `${result.roh.totalSegments} segs`,
      tone: result.roh.fRoh > 0.03 ? "warn" : "muted",
    },
  ];

  if (!isOverview) {
    if (scopedPoints.length === 0) return null;
    const worstTone = pickWorstTone(scopedPoints);
    return (
      <div
        className={`mb-5 rounded-xl border px-4 py-3 ${
          worstTone === "danger"
            ? "border-danger/30 bg-danger/5"
            : worstTone === "warn"
              ? "border-warn/30 bg-warn/5"
              : "border-accent/30 bg-accent/5"
        }`}
      >
        <ul className="space-y-1.5 text-sm">
          {scopedPoints.map((p, i) => (
            <PointRow key={i} point={p} />
          ))}
        </ul>
      </div>
    );
  }

  const conclusion = overallConclusion(stats, result);

  return (
    <div className="mb-6 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3 rounded-2xl border border-border bg-surface/50 px-4 py-3">
        <div className="flex-1 min-w-[240px] space-y-1">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-fg-muted">
            Votre fichier
          </div>
          <div className="text-sm font-semibold text-fg">
            {sourceBadge(result.meta.source, result.meta.totalSNPs)}
          </div>
          <p className="text-xs leading-relaxed text-fg-muted">
            {sourcePrimer(result.meta.source, result.meta.totalSNPs)}
          </p>
        </div>
      </div>
      <div
        className={`rounded-2xl border p-4 sm:p-5 ${
          conclusion.tone === "danger"
            ? "border-danger/30 bg-danger/5"
            : conclusion.tone === "warn"
              ? "border-warn/30 bg-warn/5"
              : "border-ok/30 bg-ok/5"
        }`}
      >
        <div className="flex items-center justify-between gap-3">
          <div
            className={`text-[10px] font-semibold uppercase tracking-wider ${
              conclusion.tone === "danger"
                ? "text-danger"
                : conclusion.tone === "warn"
                  ? "text-warn"
                  : "text-ok"
            }`}
          >
            {conclusion.headline}
          </div>
          <div className="text-[10px] text-fg-muted/70">lecture par profane</div>
        </div>
        {conclusion.points.length === 0 && conclusion.fallback && (
          <p className="mt-2 text-sm leading-relaxed text-fg">{conclusion.fallback}</p>
        )}
        {conclusion.points.length > 0 && (
          <ul className="mt-2.5 space-y-1.5 text-sm">
            {conclusion.points.map((p, i) => (
              <PointRow key={i} point={p} />
            ))}
          </ul>
        )}
        {conclusion.cta && (
          <p className="mt-3 border-t border-current/10 pt-2.5 text-sm leading-relaxed text-fg-muted">
            <span className="font-semibold text-fg">À faire : </span>
            {conclusion.cta}
          </p>
        )}
      </div>
      <div className="overflow-hidden rounded-2xl border border-border bg-surface/50">
        <div className="grid grid-cols-2 divide-x divide-y divide-border sm:grid-cols-3 sm:divide-y-0 lg:grid-cols-6">
          {items.map((it) => (
            <Tile key={it.key} item={it} />
          ))}
        </div>
      </div>
    </div>
  );
}

interface Stats {
  clinvar: number;
  drugs: number;
  criticalDrugs: number;
  prsHigh: number;
  prsVeryHigh: number;
  prsTotal: number;
  traitsOk: number;
  traitsTotal: number;
  fRoh: number;
}

type PointTone = "danger" | "warn" | "accent";

interface ConclusionPoint {
  tone: PointTone;
  label: string; // short category tag, e.g. "Santé"
  prefix: string; // lowercase lead-in, e.g. "3 variantes P/LP :"
  entities: string[]; // bolded names
  extraCount?: number; // when truncated, show "(+N)"
  suffix?: string; // trailing info in muted
}

interface Conclusion {
  tone: "danger" | "warn" | "ok";
  headline: string;
  points: ConclusionPoint[];
  fallback?: string; // when no points to list
  cta?: string;
}

function overallConclusion(s: Stats, result: AnalysisResult): Conclusion {
  const hasClinvar = s.clinvar > 0;
  const hasCritical = s.criticalDrugs > 0;
  const hasRohHigh = s.fRoh >= 0.0625;
  const hasPrsVeryHigh = s.prsVeryHigh > 0;
  const hasPharmaMild = s.drugs > 0 && !hasCritical;
  const hasPrsMild = s.prsHigh > 0 && !hasPrsVeryHigh;
  const hasRohMid = s.fRoh >= 0.0156 && !hasRohHigh;

  const MAX = 3;
  const clinvarAll = result.clinvar.map((f) => cleanLabel(f.entry.condition || f.entry.gene));
  const clinvarNames = clinvarAll.slice(0, MAX);
  const criticalDrugsAll = result.pharma.byDrug
    .filter((d) => d.severity === "high")
    .map((d) => d.drug.toLowerCase());
  const criticalDrugs = criticalDrugsAll.slice(0, MAX);
  const prsVeryHigh = result.prs
    .filter((p) => p.percentile >= 90)
    .map((p) => p.rule.trait);
  const prsMild = result.prs
    .filter((p) => p.percentile >= 75 && p.percentile < 90)
    .map((p) => p.rule.trait);

  const points: ConclusionPoint[] = [];

  if (hasClinvar) {
    points.push({
      tone: "danger",
      label: "Santé",
      prefix: `${s.clinvar} variante${s.clinvar > 1 ? "s" : ""} pathogène${s.clinvar > 1 ? "s" : ""} —`,
      entities: clinvarNames,
      extraCount: clinvarAll.length - clinvarNames.length,
    });
  }

  if (hasCritical) {
    points.push({
      tone: "danger",
      label: "Pharmaco",
      prefix: "réaction critique à",
      entities: criticalDrugs,
      extraCount: criticalDrugsAll.length - criticalDrugs.length,
    });
  } else if (hasPharmaMild) {
    points.push({
      tone: "warn",
      label: "Pharmaco",
      prefix: `${s.drugs} médicament${s.drugs > 1 ? "s" : ""} à mentionner au médecin`,
      entities: [],
    });
  }

  if (hasPrsVeryHigh) {
    points.push({
      tone: "warn",
      label: "Risque",
      prefix: "score polygénique très élevé pour",
      entities: prsVeryHigh,
    });
  } else if (hasPrsMild) {
    points.push({
      tone: "warn",
      label: "Risque",
      prefix: "légèrement au-dessus de la moyenne pour",
      entities: prsMild,
    });
  }

  if (hasRohHigh) {
    points.push({
      tone: "danger",
      label: "Parenté",
      prefix: `parents probablement apparentés (F_ROH ${(s.fRoh * 100).toFixed(1)}%)`,
      entities: [],
    });
  } else if (hasRohMid) {
    points.push({
      tone: "warn",
      label: "Parenté",
      prefix: `signal léger de cousinage dans la lignée (F_ROH ${(s.fRoh * 100).toFixed(1)}%)`,
      entities: [],
    });
  }

  if (hasClinvar || hasCritical || hasRohHigh) {
    const ctas: string[] = [];
    if (hasClinvar) ctas.push("consulter un généticien pour les variantes dominantes");
    if (hasCritical) ctas.push("montrer la liste pharmaco à votre médecin avant prescription");
    if (hasRohHigh) ctas.push("évoquer le F_ROH avec un médecin");
    return {
      tone: "danger",
      headline: "Points à discuter avec un médecin",
      points,
      cta: ctas.join(" · "),
    };
  }

  if (hasPrsVeryHigh || hasPharmaMild || hasPrsMild || hasRohMid) {
    return {
      tone: "warn",
      headline: "Quelques points d'attention",
      points,
      cta: hasPrsVeryHigh
        ? "ouvrir l'onglet Risque : chaque carte rouge détaille ce qu'il faut surveiller au quotidien"
        : hasPharmaMild
          ? "mentionner cette liste à votre pharmacien/médecin lors d'une prescription concernée"
          : undefined,
    };
  }

  return {
    tone: "ok",
    headline: "Bilan rassurant",
    points: [],
    fallback:
      "Aucune variante pathogène, aucune alerte médicamenteuse, scores de risque dans la moyenne et pas de signe d'apparentement parental.",
    cta: "rien de particulier à signaler — continuez d'entretenir votre santé",
  };
}

function cleanLabel(raw: string): string {
  if (!raw) return "";
  const trimmed = raw.trim();
  // "Inborn genetic diseases" → "maladie génétique" could be too aggressive; just lowercase if fully capitalized sentence fragments
  if (/^[A-Z][a-z ]+$/.test(trimmed) && !/^[A-Z][a-z]+$/.test(trimmed)) {
    // Sentence fragment like "Inborn genetic diseases" → lowercase for inline use
    return trimmed.toLowerCase();
  }
  return trimmed;
}

function PointRow({ point }: { point: ConclusionPoint }) {
  const tagStyle =
    point.tone === "danger"
      ? "border-danger/40 bg-danger/10 text-danger"
      : point.tone === "warn"
        ? "border-warn/40 bg-warn/10 text-warn"
        : "border-accent/40 bg-accent/10 text-accent";
  return (
    <li className="flex flex-wrap items-baseline gap-x-2 gap-y-1 leading-relaxed">
      <span
        className={`inline-flex shrink-0 items-center rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${tagStyle}`}
      >
        {point.label}
      </span>
      <span className="text-fg-muted">{point.prefix}</span>
      {point.entities.length > 0 && (
        <span className="font-semibold text-fg">{joinFr(point.entities)}</span>
      )}
      {point.extraCount && point.extraCount > 0 ? (
        <span className="text-fg-muted/70">(+{point.extraCount})</span>
      ) : null}
      {point.suffix && <span className="text-fg-muted">{point.suffix}</span>}
    </li>
  );
}

function joinFr(items: string[]): string {
  if (items.length === 0) return "";
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} et ${items[1]}`;
  return `${items.slice(0, -1).join(", ")} et ${items[items.length - 1]}`;
}

function scopedConclusionPoints(
  s: Stats,
  result: AnalysisResult,
  scope: Props["active"],
): ConclusionPoint[] {
  const MAX = 4;
  switch (scope) {
    case "health": {
      if (s.clinvar === 0)
        return [
          {
            tone: "accent",
            label: "Santé",
            prefix: "aucune variante pathogène dans la base curée",
            entities: [],
          },
        ];
      const names = result.clinvar.map((f) => cleanLabel(f.entry.condition || f.entry.gene));
      const shown = names.slice(0, MAX);
      return [
        {
          tone: "danger",
          label: "Santé",
          prefix: `${s.clinvar} variante${s.clinvar > 1 ? "s" : ""} P/LP pour`,
          entities: shown,
          extraCount: names.length - shown.length,
        },
      ];
    }
    case "pharma": {
      if (s.drugs === 0)
        return [
          {
            tone: "accent",
            label: "Pharmaco",
            prefix: "aucune alerte CPIC / DPWG",
            entities: [],
          },
        ];
      const points: ConclusionPoint[] = [];
      if (s.criticalDrugs > 0) {
        const critical = result.pharma.byDrug
          .filter((d) => d.severity === "high")
          .map((d) => d.drug.toLowerCase());
        const shown = critical.slice(0, MAX);
        points.push({
          tone: "danger",
          label: "Critique",
          prefix: "sensibilité à",
          entities: shown,
          extraCount: critical.length - shown.length,
          suffix: "— à signaler au médecin",
        });
      }
      const mild = result.pharma.byDrug
        .filter((d) => d.severity !== "high")
        .map((d) => d.drug.toLowerCase());
      if (mild.length > 0) {
        const shown = mild.slice(0, MAX);
        points.push({
          tone: "warn",
          label: "Mineur",
          prefix: `${mild.length} médicament${mild.length > 1 ? "s" : ""} à mentionner :`,
          entities: shown,
          extraCount: mild.length - shown.length,
        });
      }
      return points;
    }
    case "risk": {
      if (s.prsTotal === 0) return [];
      const veryHigh = result.prs
        .filter((p) => p.percentile >= 90)
        .map((p) => p.rule.trait);
      const mild = result.prs
        .filter((p) => p.percentile >= 75 && p.percentile < 90)
        .map((p) => p.rule.trait);
      const points: ConclusionPoint[] = [];
      if (veryHigh.length > 0) {
        points.push({
          tone: "warn",
          label: "Top 10%",
          prefix: "risque élevé pour",
          entities: veryHigh,
        });
      }
      if (mild.length > 0) {
        points.push({
          tone: "warn",
          label: "> moyenne",
          prefix: "légèrement élevé pour",
          entities: mild,
        });
      }
      if (points.length === 0) {
        return [
          {
            tone: "accent",
            label: "Risque",
            prefix: `${s.prsTotal} scores dans la moyenne`,
            entities: [],
          },
        ];
      }
      return points;
    }
    case "traits": {
      const undetermined = s.traitsTotal - s.traitsOk;
      return [
        {
          tone: "accent",
          label: "Traits",
          prefix: `${s.traitsOk}/${s.traitsTotal} déterminés${undetermined > 0 ? ` · ${undetermined} non-déterminés (SNPs absents de la puce)` : ""}`,
          entities: [],
        },
      ];
    }
    default:
      return [];
  }
}

function pickWorstTone(points: ConclusionPoint[]): PointTone {
  if (points.some((p) => p.tone === "danger")) return "danger";
  if (points.some((p) => p.tone === "warn")) return "warn";
  return "accent";
}

type Tone = "danger" | "warn" | "accent" | "muted";
interface Item {
  key: string;
  label: string;
  value: string | number;
  sub?: string;
  tone?: Tone;
}

function Tile({ item, highlighted }: { item: Item; highlighted?: boolean }) {
  const toneColor =
    item.tone === "danger"
      ? "text-danger"
      : item.tone === "warn"
        ? "text-warn"
        : item.tone === "accent"
          ? "text-accent"
          : "text-fg";
  return (
    <div
      className={`flex flex-col gap-0.5 p-3 transition ${
        highlighted ? "bg-accent/5" : ""
      }`}
    >
      <div className="text-[9px] font-medium uppercase tracking-wider text-fg-muted">
        {item.label}
      </div>
      <div className={`text-xl font-bold tabular-nums leading-tight ${toneColor}`}>
        {item.value}
      </div>
      {item.sub && (
        <div className="text-[10px] text-fg-muted">{item.sub}</div>
      )}
    </div>
  );
}

function formatInt(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + "M";
  if (n >= 1000) return (n / 1000).toFixed(0) + "k";
  return String(n);
}

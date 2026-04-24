"use client";

import { useMemo, useState } from "react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { explainPRS } from "@/lib/prs-explain";
import { PRSRadar } from "@/components/viz/PRSRadar";
import { PRSDistribution } from "@/components/viz/PRSDistribution";
import type { PRSFinding } from "@/lib/types";
import { S, tr, trTpl } from "@/lib/i18n/strings";
import type { Lang } from "@/lib/i18n/lang";

const CATEGORY_LABEL: Record<PRSFinding["rule"]["category"], string> = {
  metabolic: "Métabolique",
  cardio: "Cardio",
  neuro: "Neuro",
  cancer: "Cancer",
  anthropometric: "Morpho",
  longevity: "Longévité",
};

const CATEGORY_COLOR: Record<PRSFinding["rule"]["category"], string> = {
  metabolic: "rgb(236 196 92)",
  cardio: "rgb(247 110 110)",
  neuro: "rgb(170 140 255)",
  cancer: "rgb(255 140 180)",
  anthropometric: "rgb(120 180 255)",
  longevity: "rgb(120 220 160)",
};

interface PRSProps {
  findings: PRSFinding[];
  lang?: Lang;
}

export function PRSSection({ findings, lang = "fr" }: PRSProps) {
  const [openId, setOpenId] = useState<string | null>(null);

  const sorted = useMemo(() => {
    return [...findings].sort((a, b) => {
      const ra = riskRank(a.percentile);
      const rb = riskRank(b.percentile);
      if (ra !== rb) return rb - ra;
      return b.percentile - a.percentile;
    });
  }, [findings]);

  if (findings.length === 0) {
    return (
      <Card>
        <div className="py-4 text-center text-sm text-fg-muted">
          Aucun score polygénique calculé.
        </div>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
      {sorted.length >= 3 && (
        <Card className="md:col-span-12">
          <CardHeader
            title={tr(S.prs.radarTitle, lang)}
            subtitle={trTpl(S.prs.radarSubtitleTpl, lang, sorted.length)}
          />
          <PRSRadar findings={sorted} />
        </Card>
      )}

      <Card className="md:col-span-12">
        <div className="rounded-xl border border-warn/30 bg-warn/5 p-4 text-sm">
          <div className="font-semibold text-warn">{tr(S.prs.disclaimerTitle, lang)}</div>
          <p className="mt-1 text-fg-muted">
            {tr(S.prs.disclaimerBody, lang)} Les percentiles se lisent{" "}
            <span className="text-fg">par rapport à une population de référence</span>{" "}
            (HWE + fréquences alléliques européennes).
          </p>
        </div>
      </Card>

      {sorted.map((f) => {
        const exp = explainPRS(f);
        return (
        <Card key={f.rule.id} className="md:col-span-6">
          <CardHeader
            title={<span>{f.rule.trait}</span>}
            right={
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className="inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium"
                  style={{
                    borderColor: `${CATEGORY_COLOR[f.rule.category]}55`,
                    color: CATEGORY_COLOR[f.rule.category],
                    background: `${CATEGORY_COLOR[f.rule.category]}12`,
                  }}
                >
                  {CATEGORY_LABEL[f.rule.category]}
                </span>
                <RiskBadge p={f.percentile} />
              </div>
            }
          />
          <p className="text-sm text-fg-muted">{exp.what}</p>
          <div className="mt-3 rounded-lg border border-border/60 bg-surface-2/30 p-2">
            <PRSDistribution
              zScore={f.zScore}
              percentile={f.percentile}
              color={CATEGORY_COLOR[f.rule.category]}
            />
            <div className="mt-1 px-1 text-[10px] text-fg-muted">
              Courbe = distribution du score dans la population de référence.
              Votre position relative est marquée.
            </div>
          </div>
          <PercentileBar percentile={f.percentile} color={CATEGORY_COLOR[f.rule.category]} />
          <div
            className="mt-4 rounded-lg border p-3 text-sm"
            style={{
              borderColor: `${CATEGORY_COLOR[f.rule.category]}33`,
              background: `${CATEGORY_COLOR[f.rule.category]}0A`,
            }}
          >
            <div className="text-[10px] font-semibold uppercase tracking-wider text-fg-muted">
              Ce que ça veut dire pour vous
            </div>
            <p className="mt-1 text-fg">{exp.meaning}</p>
            {exp.note && (
              <p className="mt-2 text-xs text-fg-muted">{exp.note}</p>
            )}
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2 text-[11px] text-fg-muted">
            <Stat label="Percentile" value={`${f.percentile.toFixed(1)}%`} />
            <Stat label="Z-score" value={f.zScore.toFixed(2)} />
            <Stat
              label="Couverture"
              value={`${f.matched}/${f.total}`}
              tone={f.coverage < 0.5 ? "warn" : "ok"}
            />
          </div>
          <details className="mt-3 text-xs text-fg-muted">
            <summary className="cursor-pointer select-none text-accent hover:underline">
              Détails techniques
            </summary>
            <p className="mt-2">
              <span className="text-fg-muted">Loci mesurés :</span> {f.rule.description}
            </p>
            <p className="mt-1">
              <span className="text-fg-muted">Source :</span> {f.rule.source} ·{" "}
              <span className="text-fg-muted">Unités :</span> {f.rule.units}
            </p>
            <p className="mt-1">
              Le <strong>z-score</strong> = écart standardisé par rapport à la moyenne
              de la population ; le <strong>percentile</strong> traduit ce z en
              classement sur 100. <strong>Couverture</strong> = SNPs du score
              effectivement présents sur votre chip.
            </p>
          </details>
          <button
            type="button"
            onClick={() => setOpenId(openId === f.rule.id ? null : f.rule.id)}
            className="mt-3 text-xs text-accent hover:underline"
          >
            {openId === f.rule.id ? "− Masquer les SNPs" : "+ Détail par SNP"}
          </button>
          {openId === f.rule.id && (
            <div className="mt-3 space-y-1 rounded-lg border border-border bg-surface-2/40 p-3 text-xs">
              <div className="grid grid-cols-12 gap-2 border-b border-border/50 pb-1 text-[10px] uppercase tracking-wider text-fg-muted">
                <div className="col-span-3">rsID</div>
                <div className="col-span-2">Effect</div>
                <div className="col-span-2">Poids</div>
                <div className="col-span-2">Observé</div>
                <div className="col-span-1">Dose</div>
                <div className="col-span-2 text-right">Contrib.</div>
              </div>
              {f.contributors.map((c) => (
                <div
                  key={c.rsid}
                  className={`grid grid-cols-12 gap-2 tabular-nums ${c.observed ? "" : "text-fg-muted/60"}`}
                >
                  <div className="col-span-3 font-mono text-[11px]">{c.rsid}</div>
                  <div className="col-span-2">{c.effect}</div>
                  <div
                    className={`col-span-2 ${c.weight < 0 ? "text-ok" : "text-fg"}`}
                  >
                    {c.weight.toFixed(2)}
                  </div>
                  <div className="col-span-2 font-mono">{c.observed ?? "—"}</div>
                  <div className="col-span-1">{c.dosage ?? "·"}</div>
                  <div
                    className={`col-span-2 text-right ${c.contribution > 0 ? "text-warn" : "text-ok"}`}
                  >
                    {c.contribution > 0 ? "+" : ""}
                    {c.contribution.toFixed(2)}
                  </div>
                </div>
              ))}
              <div className="mt-2 pt-2 border-t border-border/50 text-[10px] text-fg-muted">
                {f.rule.units} · source: {f.rule.source}
              </div>
            </div>
          )}
        </Card>
        );
      })}
    </div>
  );
}

function riskRank(p: number): number {
  if (p >= 90) return 3;
  if (p >= 75) return 2;
  if (p >= 25) return 1;
  return 0;
}

function RiskBadge({ p }: { p: number }) {
  if (p >= 90) return <Badge variant="danger">Très élevé</Badge>;
  if (p >= 75) return <Badge variant="warn">Au-dessus moy.</Badge>;
  if (p >= 25) return <Badge variant="neutral">Moyenne</Badge>;
  if (p >= 10) return <Badge variant="ok">En dessous moy.</Badge>;
  return <Badge variant="ok">Très bas</Badge>;
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "warn" | "ok";
}) {
  const color = tone === "warn" ? "text-warn" : tone === "ok" ? "text-ok" : "text-fg";
  return (
    <div className="rounded-lg border border-border bg-surface-2/40 p-2 text-center">
      <div className="text-[9px] uppercase tracking-wider text-fg-muted">{label}</div>
      <div className={`text-sm font-bold tabular-nums ${color}`}>{value}</div>
    </div>
  );
}

function PercentileBar({
  percentile,
  color,
}: {
  percentile: number;
  color: string;
}) {
  const p = Math.min(100, Math.max(0, percentile));
  return (
    <div className="mt-4">
      <div className="relative h-3 overflow-hidden rounded-full border border-border bg-surface-2">
        <div
          className="absolute inset-y-0 left-0 shadow-[0_0_8px_var(--glow)]"
          style={
            {
              width: `${p}%`,
              background: color,
              transition: "width 600ms ease",
              ["--glow" as string]: `${color}99`,
            } as React.CSSProperties
          }
        />
        <div
          className="absolute inset-y-0 w-px bg-fg/40"
          style={{ left: "50%" }}
          title="Médiane population"
        />
      </div>
      <div className="mt-1 flex justify-between text-[9px] uppercase tracking-wider text-fg-muted">
        <span>0</span>
        <span>25</span>
        <span>50</span>
        <span>75</span>
        <span>100</span>
      </div>
    </div>
  );
}

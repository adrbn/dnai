"use client";

import { useMemo } from "react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Karyogram } from "@/components/viz/Karyogram";
import { DensityHeatmap } from "@/components/viz/DensityHeatmap";
import { ROHCard } from "@/components/viz/ROHCard";
import type { AnalysisResult, PharmaByDrug, PositionIndex } from "@/lib/types";

interface OverviewSectionProps {
  result: AnalysisResult;
  positions?: PositionIndex | null;
}

export function OverviewSection({ result, positions }: OverviewSectionProps) {
  const topClinvar = useMemo(() => result.clinvar.slice(0, 4), [result.clinvar]);
  const topPharma = useMemo(() => {
    const rank = { high: 0, medium: 1, low: 2 } as const;
    return [...result.pharma.byDrug]
      .sort((a, b) => rank[a.severity] - rank[b.severity])
      .slice(0, 4);
  }, [result.pharma.byDrug]);
  const topPrs = useMemo(
    () => [...result.prs].sort((a, b) => b.percentile - a.percentile).slice(0, 4),
    [result.prs],
  );

  const markers = useMemo(() => {
    const out: { chr: string; pos: number; color: string; label: string; id: string }[] = [];
    if (!positions) return out;
    for (const f of result.clinvar) {
      const p = positions[f.entry.rs];
      if (!p) continue;
      out.push({
        chr: p.chr,
        pos: p.pos,
        color: "rgb(var(--danger))",
        label: `${f.entry.gene} · ${f.entry.rs} (${f.observed})`,
        id: `clinvar-${f.entry.rs}`,
      });
    }
    for (const f of result.pharma.findings) {
      if (f.zygosity === "ref/ref" || f.zygosity === "nocall" || f.zygosity === "ambiguous") continue;
      const p = positions[f.rule.rsid];
      if (!p) continue;
      out.push({
        chr: p.chr,
        pos: p.pos,
        color: "rgb(var(--warn))",
        label: `${f.rule.gene} · ${f.rule.rsid}`,
        id: `pharma-${f.rule.rsid}`,
      });
    }
    return out;
  }, [result, positions]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <TopFindingsCard
          tone="danger"
          icon={<IconHeart />}
          title="Santé"
          totalLabel="variantes P/LP"
          total={result.clinvar.length}
          emptyLabel="Aucune variante pathogène détectée sur les gènes curés."
          items={topClinvar.map((f) => ({
            key: f.entry.rs,
            primary: cleanLabel(f.entry.condition) || f.entry.gene,
            secondary: `${f.entry.gene} · ${f.entry.rs} · ${f.observed}`,
            level: f.entry.sig === "P" ? "critical" : "high",
            tag: f.entry.sig === "P" ? "P" : "LP",
          }))}
          overflow={result.clinvar.length - topClinvar.length}
        />

        <TopFindingsCard
          tone="warn"
          icon={<IconPill />}
          title="Pharmaco"
          totalLabel="médicaments concernés"
          total={result.pharma.byDrug.length}
          emptyLabel="Pas d'alerte CPIC / DPWG pour les SNPs lus."
          items={topPharma.map((d) => ({
            key: d.drug,
            primary: d.drug,
            secondary: d.contributors
              .map((c) => `${c.gene} ${c.phenotype}`)
              .slice(0, 2)
              .join(" · "),
            level: d.severity === "high" ? "critical" : d.severity === "medium" ? "high" : "warn",
            tag: severityTag(d.severity),
          }))}
          overflow={result.pharma.byDrug.length - topPharma.length}
        />

        <TopFindingsCard
          tone="accent"
          icon={<IconActivity />}
          title="Risque polygénique"
          totalLabel="scores calculés"
          total={result.prs.length}
          emptyLabel="Aucun score polygénique à afficher."
          items={topPrs.map((p) => ({
            key: p.rule.trait,
            primary: p.rule.trait,
            secondary: `z = ${p.zScore.toFixed(2)} · ${p.matched}/${p.total} SNPs`,
            level:
              p.percentile >= 90
                ? "critical"
                : p.percentile >= 75
                  ? "high"
                  : p.percentile <= 10
                    ? "low"
                    : "ok",
            tag: `P${p.percentile.toFixed(0)}`,
          }))}
          overflow={Math.max(0, result.prs.length - topPrs.length)}
        />
      </div>

      <FileStrip result={result} />
      {result.imputation && result.imputation.imputed > 0 && (
        <ImputationNote imputation={result.imputation} />
      )}

      <Card>
        <CardHeader
          title="Karyogramme"
          subtitle="Cartographie des chromosomes (GRCh37) · rouge = ClinVar P/LP · orange = pharmaco"
        />
        <Karyogram markers={markers} />
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Densité de SNPs"
            subtitle="Couverture par chromosome · bins 1 Mb, échelle log"
          />
          <DensityHeatmap density={result.density} />
        </Card>
        <Card>
          <CardHeader
            title="Segments homozygotes"
            subtitle="Estimateur F_ROH de consanguinité · segments ≥ 1 Mb"
          />
          <ROHCard roh={result.roh} />
        </Card>
      </div>
    </div>
  );
}

type Level = "critical" | "high" | "warn" | "ok" | "low";

interface FindingItem {
  key: string;
  primary: string;
  secondary?: string;
  level: Level;
  tag: string;
}

function TopFindingsCard({
  tone,
  icon,
  title,
  totalLabel,
  total,
  items,
  emptyLabel,
  overflow,
}: {
  tone: "danger" | "warn" | "accent";
  icon: React.ReactNode;
  title: string;
  totalLabel: string;
  total: number;
  items: FindingItem[];
  emptyLabel: string;
  overflow: number;
}) {
  const toneText =
    tone === "danger" ? "text-danger" : tone === "warn" ? "text-warn" : "text-accent";
  const toneRing =
    tone === "danger"
      ? "border-danger/30 bg-danger/[0.04]"
      : tone === "warn"
        ? "border-warn/30 bg-warn/[0.04]"
        : "border-accent/30 bg-accent/[0.04]";
  const empty = items.length === 0;

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border ${toneRing} p-5 shadow-xl shadow-black/40`}
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div
            className={`flex h-9 w-9 items-center justify-center rounded-xl bg-bg/60 ${toneText}`}
          >
            {icon}
          </div>
          <div>
            <div className="text-sm font-semibold text-fg">{title}</div>
            <div className="text-[11px] text-fg-muted">{totalLabel}</div>
          </div>
        </div>
        <div className={`text-4xl font-bold tabular-nums leading-none ${toneText}`}>{total}</div>
      </div>

      {empty ? (
        <p className="text-sm text-fg-muted">{emptyLabel}</p>
      ) : (
        <ul className="space-y-2">
          {items.map((it) => (
            <FindingRow key={it.key} item={it} />
          ))}
          {overflow > 0 && (
            <li className="pt-1 text-[11px] text-fg-muted/70">
              et {overflow} autre{overflow > 1 ? "s" : ""}…
            </li>
          )}
        </ul>
      )}
    </div>
  );
}

function FindingRow({ item }: { item: FindingItem }) {
  const tag =
    item.level === "critical"
      ? "border-danger/40 bg-danger/15 text-danger"
      : item.level === "high"
        ? "border-warn/40 bg-warn/15 text-warn"
        : item.level === "low"
          ? "border-accent/40 bg-accent/15 text-accent"
          : item.level === "ok"
            ? "border-ok/40 bg-ok/15 text-ok"
            : "border-border bg-surface text-fg-muted";
  return (
    <li className="flex items-center gap-3 rounded-lg border border-border/50 bg-surface/40 px-3 py-2">
      <span
        className={`inline-flex shrink-0 items-center rounded-md border px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase ${tag}`}
      >
        {item.tag}
      </span>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium text-fg">{item.primary}</div>
        {item.secondary && (
          <div className="mt-0.5 truncate font-mono text-[10px] text-fg-muted">
            {item.secondary}
          </div>
        )}
      </div>
    </li>
  );
}

function FileStrip({ result }: { result: AnalysisResult }) {
  const callRate =
    result.meta.totalSNPs === 0 ? 0 : 1 - result.meta.noCalls / result.meta.totalSNPs;
  const items = [
    { label: "Fichier", value: result.meta.filename, mono: true },
    { label: "Build", value: result.meta.build },
    { label: "SNPs", value: result.meta.totalSNPs.toLocaleString("fr-FR") },
    {
      label: "Call rate",
      value: `${(callRate * 100).toFixed(2)}%`,
      extra: `${result.meta.noCalls.toLocaleString("fr-FR")} nocall`,
    },
    {
      label: "Parsé",
      value: new Date(result.meta.parsedAt).toLocaleString("fr-FR", {
        dateStyle: "short",
        timeStyle: "short",
      }),
    },
    {
      label: "Empreinte",
      value: `${result.meta.fileHash.slice(0, 10)}…`,
      mono: true,
    },
  ];
  return (
    <div className="rounded-2xl border border-border bg-surface/40 px-4 py-3">
      <div className="grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-3 lg:grid-cols-6">
        {items.map((it) => (
          <div key={it.label} className="min-w-0">
            <div className="text-[9px] font-semibold uppercase tracking-wider text-fg-muted">
              {it.label}
            </div>
            <div
              className={`truncate text-xs text-fg ${it.mono ? "font-mono" : ""}`}
              title={it.value}
            >
              {it.value}
            </div>
            {it.extra && (
              <div className="truncate text-[10px] text-fg-muted/80">{it.extra}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function severityTag(s: PharmaByDrug["severity"]): string {
  if (s === "high") return "!!!";
  if (s === "medium") return "!!";
  return "!";
}

function cleanLabel(raw: string | undefined): string {
  if (!raw) return "";
  return raw.trim();
}

// ----- inline icons (no new deps) -----

function IconHeart() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7Z" />
    </svg>
  );
}

function IconPill() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z" />
      <path d="m8.5 8.5 7 7" />
    </svg>
  );
}

function IconActivity() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  );
}


function ImputationNote({
  imputation,
}: {
  imputation: NonNullable<AnalysisResult["imputation"]>;
}) {
  const imputed = imputation.entries.filter((e) => e.source === "imputed");
  return (
    <Card className="border-accent/30 bg-accent/5">
      <CardHeader
        title="Imputation LD (proxies)"
        subtitle={`${imputation.imputed} variant(s) reconstitué(s) via tag SNPs en LD serrée (r² ≥ 0.85)`}
      />
      <p className="text-sm text-fg-muted">
        Certains variants absents de votre chip ont été <em>imputés</em> depuis un
        SNP voisin en déséquilibre de liaison (référence EUR). C&apos;est une
        approximation honnête — utile pour ne pas perdre un trait à cause d&apos;une
        puce incomplète, mais moins fiable qu&apos;un génotypage direct.
      </p>
      {imputed.length > 0 && (
        <ul className="mt-3 space-y-1 font-mono text-[11px] text-fg/80">
          {imputed.map((e) => (
            <li key={e.target} className="flex flex-wrap gap-x-3 gap-y-0.5">
              <span className="text-accent">{e.target}</span>
              <span className="text-fg-muted">
                ← {e.proxy} ({e.proxyObserved}) → {e.imputedAs}
              </span>
              <span className="text-fg-muted/70">r²={e.r2.toFixed(2)}</span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

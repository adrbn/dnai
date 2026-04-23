"use client";

import { useMemo } from "react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Karyogram } from "@/components/viz/Karyogram";
import { SeverityBars } from "@/components/viz/SeverityBars";
import { DensityHeatmap } from "@/components/viz/DensityHeatmap";
import { ROHCard } from "@/components/viz/ROHCard";
import type { AnalysisResult, PositionIndex, Severity } from "@/lib/types";

interface OverviewSectionProps {
  result: AnalysisResult;
  positions?: PositionIndex | null;
}

export function OverviewSection({ result, positions }: OverviewSectionProps) {
  const severityCounts: Record<Severity, number> = useMemo(() => {
    const c: Record<Severity, number> = { low: 0, medium: 0, high: 0 };
    for (const d of result.pharma.byDrug) c[d.severity]++;
    return c;
  }, [result]);

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
    for (const d of result.pharma.byDrug) {
      for (const c of d.contributors) {
        if (c.zygosity === "ref/ref" || c.zygosity === "nocall") continue;
        // find rsid from gene? pharma findings carry rsid in result.pharma.findings
      }
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

  const callRate = result.meta.totalSNPs === 0
    ? 0
    : 1 - result.meta.noCalls / result.meta.totalSNPs;

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
      <Card className="md:col-span-4">
        <CardHeader title="Fichier" subtitle="Résumé technique" />
        <dl className="space-y-2 text-sm">
          <Row label="Nom" value={result.meta.filename} mono />
          <Row label="Build" value={result.meta.build} />
          <Row label="SNPs totaux" value={result.meta.totalSNPs.toLocaleString("fr-FR")} />
          <Row
            label="Call rate"
            value={`${(callRate * 100).toFixed(2)}%`}
            right={
              <Badge variant={callRate > 0.98 ? "ok" : callRate > 0.95 ? "warn" : "danger"}>
                {result.meta.noCalls.toLocaleString("fr-FR")} nocall
              </Badge>
            }
          />
          <Row label="Parsé le" value={new Date(result.meta.parsedAt).toLocaleString("fr-FR")} />
          <Row label="Empreinte" value={result.meta.fileHash} mono />
        </dl>
      </Card>

      <Card className="md:col-span-4">
        <CardHeader title="Pharmaco" subtitle="Médicaments concernés" />
        <SeverityBars counts={severityCounts} />
      </Card>

      <Card className="md:col-span-4">
        <CardHeader title="Découvertes" subtitle="Aperçu rapide" />
        <div className="space-y-2">
          <Tile
            value={result.clinvar.length}
            label="Variants ClinVar"
            sub="Pathogènes ou probablement path."
            tone="danger"
          />
          <Tile
            value={result.pharma.byDrug.length}
            label="Médicaments concernés"
            sub={`sur ${result.pharma.findings.length} règles PGx`}
            tone="warn"
          />
          <Tile
            value={result.traits.filter((t) => t.result).length}
            label="Traits déterminés"
            sub={`sur ${result.traits.length} analysés`}
            tone="accent"
          />
          <Tile
            value={result.prs.filter((p) => p.percentile >= 75).length}
            label="Scores élevés (PRS)"
            sub={`sur ${result.prs.length} conditions évaluées`}
            tone="warn"
          />
        </div>
      </Card>

      <Card className="md:col-span-12">
        <CardHeader
          title="Karyogramme"
          subtitle="Cartographie des chromosomes (GRCh37) · rouge = ClinVar P/LP · orange = pharmaco"
        />
        <Karyogram markers={markers} />
      </Card>

      <Card className="md:col-span-12">
        <CardHeader
          title="Densité de SNPs"
          subtitle="Couverture du génotypage par chromosome (bins de 1 Mb, échelle log)"
        />
        <DensityHeatmap density={result.density} />
      </Card>

      <Card className="md:col-span-12">
        <CardHeader
          title="Segments homozygotes"
          subtitle="Segments ≥ 1 Mb et ≥ 30 SNPs · estimateur F_ROH de consanguinité"
        />
        <ROHCard roh={result.roh} />
      </Card>
    </div>
  );
}

function Row({
  label,
  value,
  mono,
  right,
}: {
  label: string;
  value: string;
  mono?: boolean;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-2 border-b border-border/50 pb-1.5 last:border-0">
      <dt className="text-fg-muted">{label}</dt>
      <dd className={`flex items-center gap-2 ${mono ? "font-mono text-xs" : ""}`}>
        <span className="truncate text-right">{value}</span>
        {right}
      </dd>
    </div>
  );
}

function Tile({
  value,
  label,
  sub,
  tone,
}: {
  value: number;
  label: string;
  sub?: string;
  tone: "danger" | "warn" | "accent";
}) {
  const color =
    tone === "danger"
      ? "text-danger"
      : tone === "warn"
        ? "text-warn"
        : "text-accent";
  const ring =
    tone === "danger"
      ? "border-danger/30"
      : tone === "warn"
        ? "border-warn/30"
        : "border-accent/30";
  const bar =
    tone === "danger"
      ? "bg-danger"
      : tone === "warn"
        ? "bg-warn"
        : "bg-accent";
  return (
    <div
      className={`flex items-center gap-3 overflow-hidden rounded-xl border ${ring} bg-surface-2/40 p-3`}
    >
      <div className={`h-10 w-1 shrink-0 rounded-full ${bar}`} />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className={`text-2xl font-bold tabular-nums leading-none ${color}`}>
            {value}
          </span>
          <span className="truncate text-xs text-fg">{label}</span>
        </div>
        {sub && <div className="mt-0.5 truncate text-[10px] text-fg-muted">{sub}</div>}
      </div>
    </div>
  );
}

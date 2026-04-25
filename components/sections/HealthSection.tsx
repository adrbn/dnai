"use client";

import { useState } from "react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ProteinViewer } from "@/components/viz/ProteinViewer";
import { SectionDisclaimer } from "@/components/SectionDisclaimer";
import { uniprotForGene } from "@/lib/gene-uniprot";
import type { ClinVarFinding } from "@/lib/types";
import { S, tr } from "@/lib/i18n/strings";
import type { Lang } from "@/lib/i18n/lang";

interface HealthSectionProps {
  findings: ClinVarFinding[];
  lang?: Lang;
}

const STARS = ["—", "✱", "✱✱", "✱✱✱", "✱✱✱✱"];

function sigLabel(sig: string, lang: Lang): string {
  if (sig === "P") return tr(S.health.sigP, lang);
  if (sig === "LP") return tr(S.health.sigLP, lang);
  if (sig === "P/LP") return tr(S.health.sigPLP, lang);
  return sig;
}

export function HealthSection({ findings, lang = "fr" }: HealthSectionProps) {
  const [openGene, setOpenGene] = useState<string | null>(null);

  if (findings.length === 0) {
    return (
      <Card>
        <CardHeader
          title={tr(S.health.emptyTitle, lang)}
          subtitle={tr(S.health.emptySubtitle, lang)}
        />
        <div className="rounded-xl border border-ok/30 bg-ok/5 p-8 text-center">
          <div className="text-5xl">✅</div>
          <p className="mt-3 text-sm text-fg-muted">{tr(S.health.emptyBody, lang)}</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <SectionDisclaimer kind="health" lang={lang} />
      <div className="rounded-xl border border-warn/30 bg-warn/5 p-4 text-sm">
        <div className="mb-1 flex items-center gap-2 font-semibold text-warn">
          {tr(S.health.mustRead, lang)}
        </div>
        <p className="text-fg-muted">{tr(S.health.mustReadBody, lang)}</p>
      </div>

      {findings.map((f) => (
        <Card key={f.entry.rs}>
          <CardHeader
            title={f.entry.gene}
            subtitle={f.entry.condition}
            right={
              <div className="flex gap-2">
                <Badge variant="danger">{sigLabel(f.entry.sig, lang)}</Badge>
                <Badge variant={f.zygosity === "alt/alt" ? "danger" : "warn"}>
                  {f.zygosity === "alt/alt"
                    ? tr(S.health.zygHom, lang)
                    : tr(S.health.zygHet, lang)}
                </Badge>
              </div>
            }
          />
          <div className="grid gap-3 text-sm md:grid-cols-3">
            <Info label={tr(S.health.labelRsid, lang)} value={f.entry.rs} mono />
            <Info
              label={tr(S.health.labelObserved, lang)}
              value={f.observed}
              mono
              right={
                <span className="text-[10px] text-fg-muted">
                  (ref {f.entry.ref} / alt {f.entry.alt})
                </span>
              }
            />
            <Info
              label={tr(S.health.labelReview, lang)}
              value={STARS[Math.min(f.entry.rev, 4)]}
              right={<span className="text-xs text-fg-muted">({f.entry.rev}/4)</span>}
            />
          </div>
          {f.entry.note && (
            <p className="mt-3 text-sm text-fg-muted">{f.entry.note}</p>
          )}
          <div className="mt-3 flex flex-wrap gap-3 text-xs">
            {f.entry.href && (
              <a
                href={f.entry.href}
                target="_blank"
                rel="noreferrer"
                className="text-accent hover:underline"
              >
                {tr(S.health.linkClinvar, lang)}
              </a>
            )}
            {uniprotForGene(f.entry.gene) && (
              <button
                type="button"
                onClick={() =>
                  setOpenGene(openGene === f.entry.gene ? null : f.entry.gene)
                }
                className="text-accent hover:underline"
              >
                {openGene === f.entry.gene
                  ? tr(S.health.link3dClose, lang)
                  : tr(S.health.link3dOpen, lang)}
              </button>
            )}
          </div>
          {openGene === f.entry.gene && (
            <div className="mt-3">
              <ProteinViewer gene={f.entry.gene} onClose={() => setOpenGene(null)} />
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}

function Info({ label, value, mono, right }: { label: string; value: string; mono?: boolean; right?: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-surface-2/40 p-3">
      <div className="text-[10px] uppercase tracking-wider text-fg-muted">{label}</div>
      <div className={`mt-1 flex items-center gap-2 ${mono ? "font-mono text-sm" : "text-sm"}`}>
        <span>{value}</span>
        {right}
      </div>
    </div>
  );
}

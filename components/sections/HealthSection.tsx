"use client";

import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import type { ClinVarFinding } from "@/lib/types";

interface HealthSectionProps {
  findings: ClinVarFinding[];
}

const SIG_LABEL: Record<string, string> = {
  P: "Pathogène",
  LP: "Probablement path.",
  "P/LP": "P / LP",
};

const STARS = ["—", "✱", "✱✱", "✱✱✱", "✱✱✱✱"];

export function HealthSection({ findings }: HealthSectionProps) {
  if (findings.length === 0) {
    return (
      <Card>
        <CardHeader
          title="Aucune variante cliniquement significative détectée"
          subtitle="Parmi la base ClinVar curée (P/LP, review ≥ 2 étoiles). Absence ≠ garantie — la base v1 est limitée."
        />
        <div className="rounded-xl border border-ok/30 bg-ok/5 p-8 text-center">
          <div className="text-5xl">✅</div>
          <p className="mt-3 text-sm text-fg-muted">
            Votre génotype ne correspond à aucune des variantes pathogènes de la base seed.
            Une analyse étendue (ClinVar complète) est prévue en v2.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-warn/30 bg-warn/5 p-4 text-sm">
        <div className="mb-1 flex items-center gap-2 font-semibold text-warn">⚠ À lire impérativement</div>
        <p className="text-fg-muted">
          Ces variantes sont classées pathogènes ou probablement pathogènes par ClinVar, mais
          elles ne valent <em>pas diagnostic</em>. Un test génétique clinique est nécessaire pour
          confirmer. Consultez un professionnel.
        </p>
      </div>

      {findings.map((f) => (
        <Card key={f.entry.rs}>
          <CardHeader
            title={f.entry.gene}
            subtitle={f.entry.condition}
            right={
              <div className="flex gap-2">
                <Badge variant="danger">{SIG_LABEL[f.entry.sig] ?? f.entry.sig}</Badge>
                <Badge variant={f.zygosity === "alt/alt" ? "danger" : "warn"}>
                  {f.zygosity === "alt/alt" ? "Homozygote" : "Hétérozygote"}
                </Badge>
              </div>
            }
          />
          <div className="grid gap-3 text-sm md:grid-cols-3">
            <Info label="rsID" value={f.entry.rs} mono />
            <Info label="Génotype observé" value={`${f.entry.ref}${f.entry.alt}`} mono />
            <Info
              label="Qualité review"
              value={STARS[Math.min(f.entry.rev, 4)]}
              right={<span className="text-xs text-fg-muted">({f.entry.rev}/4)</span>}
            />
          </div>
          {f.entry.note && (
            <p className="mt-3 text-sm text-fg-muted">{f.entry.note}</p>
          )}
          {f.entry.href && (
            <a
              href={f.entry.href}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-block text-xs text-accent hover:underline"
            >
              → Fiche ClinVar
            </a>
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

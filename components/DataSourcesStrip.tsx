import type { Lang } from "@/lib/i18n/lang";

/**
 * Versioned data-source strip shown at the bottom of the report.
 * Keep versions in sync with the actual data snapshots shipped in /public/data.
 * Update DATA_SOURCES whenever a dataset is refreshed.
 */
const DATA_SOURCES: { label: string; version: string; href?: string }[] = [
  { label: "ClinVar", version: "2026-03", href: "https://www.ncbi.nlm.nih.gov/clinvar/" },
  { label: "CPIC", version: "guidelines v2025", href: "https://cpicpgx.org/" },
  { label: "DPWG", version: "2025", href: "https://www.knmp.nl/dpwg" },
  { label: "PGS Catalog", version: "2026-Q1", href: "https://www.pgscatalog.org/" },
  { label: "UniProt / AlphaFold", version: "2025.03", href: "https://alphafold.ebi.ac.uk/" },
];

const COPY: Record<Lang, { heading: string; tagline: string; contact: string }> = {
  fr: {
    heading: "Sources de données",
    tagline: "Les interprétations s'appuient sur les snapshots ci-dessous. Aucune requête réseau pendant l'analyse.",
    contact: "contact@dnai.health",
  },
  en: {
    heading: "Data sources",
    tagline: "Interpretations are based on the snapshots below. No network calls during analysis.",
    contact: "contact@dnai.health",
  },
};

export function DataSourcesStrip({ lang = "fr" }: { lang?: Lang }) {
  const c = COPY[lang];
  return (
    <footer className="mx-auto mt-10 max-w-6xl border-t border-border px-4 py-6 text-[11px] text-fg-muted sm:px-6">
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ink/55">
          {c.heading}
        </span>
        <a href={`mailto:${c.contact}`} className="text-accent hover:underline">
          {c.contact}
        </a>
      </div>
      <p className="mb-3 leading-relaxed">{c.tagline}</p>
      <ul className="flex flex-wrap gap-x-4 gap-y-1 font-mono">
        {DATA_SOURCES.map((s) => (
          <li key={s.label}>
            {s.href ? (
              <a href={s.href} target="_blank" rel="noreferrer" className="hover:text-ink hover:underline">
                {s.label} · {s.version}
              </a>
            ) : (
              <span>
                {s.label} · {s.version}
              </span>
            )}
          </li>
        ))}
      </ul>
    </footer>
  );
}

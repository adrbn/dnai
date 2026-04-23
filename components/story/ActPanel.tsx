"use client";

import Link from "next/link";
import type { Act } from "@/lib/story/acts";

const SEV_COLOR = {
  high: "text-[#f76e6e] border-[#f76e6e]/40 bg-[#f76e6e]/10",
  medium: "text-[#ecc45c] border-[#ecc45c]/40 bg-[#ecc45c]/10",
  low: "text-[#78dca0] border-[#78dca0]/40 bg-[#78dca0]/10",
};

const SIG_LABEL: Record<string, string> = {
  P: "Pathogène",
  LP: "Probablement pathogène",
  "P/LP": "Pathogène / probablement pathogène",
};

const SEV_LABEL = { high: "Critique", medium: "Modéré", low: "Mineur" };

export function ActPanel({ act }: { act: Act }) {
  return (
    <div className="pointer-events-auto w-full max-w-xl rounded-2xl border border-white/10 bg-black/45 p-6 text-white shadow-[0_30px_80px_-30px_rgba(0,0,0,0.9)] backdrop-blur-md sm:p-8">
      <Chapter act={act} />
      <Body act={act} />
    </div>
  );
}

function Chapter({ act }: { act: Act }) {
  const labels: Record<Act["kind"], string> = {
    intro: "Chapitre 1 — Le code",
    "health-intro": "Chapitre 2 — Santé",
    clinvar: "Santé",
    "pharma-intro": "Chapitre 3 — Pharmaco",
    pharma: "Pharmaco",
    "prs-intro": "Chapitre 4 — Risque",
    prs: "Risque",
    traits: "Chapitre 5 — Traits",
    roh: "Chapitre 6 — Homozygotie",
    outro: "Épilogue",
  };
  return (
    <div className="mb-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/50">
      {labels[act.kind]}
    </div>
  );
}

function Body({ act }: { act: Act }) {
  switch (act.kind) {
    case "intro":
      return <IntroBody act={act} />;
    case "health-intro":
      return <HealthIntroBody count={act.count} />;
    case "clinvar":
      return <ClinVarBody act={act} />;
    case "pharma-intro":
      return <PharmaIntroBody count={act.drugCount} />;
    case "pharma":
      return <PharmaBody act={act} />;
    case "prs-intro":
      return <PRSIntroBody count={act.count} />;
    case "prs":
      return <PRSBody act={act} />;
    case "traits":
      return <TraitsBody act={act} />;
    case "roh":
      return <ROHBody act={act} />;
    case "outro":
      return <OutroBody act={act} />;
  }
}

function IntroBody({ act }: { act: Extract<Act, { kind: "intro" }> }) {
  return (
    <>
      <h2 className="text-3xl font-bold leading-[1.1] tracking-tight sm:text-4xl">
        Votre génome,
        <br />
        <span className="bg-gradient-to-r from-[#7c9cff] to-[#c7b2ff] bg-clip-text text-transparent">
          lu comme une histoire.
        </span>
      </h2>
      <p className="mt-4 text-sm leading-relaxed text-white/75 sm:text-base">
        {act.primer} Nous allons vous emmener sur les variants qui comptent, chromosome par chromosome.
      </p>
      <div className="mt-5 flex flex-wrap gap-2 text-xs">
        <Pill>{act.sourceLabel}</Pill>
        <Pill>{act.filename}</Pill>
      </div>
      <p className="mt-5 text-xs text-white/40">Faites défiler pour commencer</p>
    </>
  );
}

function HealthIntroBody({ count }: { count: number }) {
  return (
    <>
      <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Santé</h2>
      <p className="mt-3 text-sm leading-relaxed text-white/75 sm:text-base">
        {count === 0
          ? "Aucune variante pathogène détectée dans les bases cliniques (ClinVar P/LP)."
          : count === 1
            ? "Une variante pathogène a été trouvée dans les bases cliniques."
            : `${count} variantes pathogènes ou probablement pathogènes ont été trouvées.`}
      </p>
      <p className="mt-3 text-xs text-white/50">
        Nous allons nous arrêter sur les plus importantes.
      </p>
    </>
  );
}

function ClinVarBody({ act }: { act: Extract<Act, { kind: "clinvar" }> }) {
  const f = act.finding;
  return (
    <>
      <div className="mb-2 flex items-center gap-2">
        <span
          className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${SEV_COLOR.high}`}
        >
          {SIG_LABEL[f.entry.sig]}
        </span>
        <span className="text-xs text-white/40">
          {act.rank}/{act.totalRanked}
        </span>
      </div>
      <h2 className="font-mono text-3xl font-bold tracking-tight sm:text-4xl">{f.entry.gene}</h2>
      {f.entry.condition && (
        <p className="mt-2 text-sm text-white/75 sm:text-base">{f.entry.condition}</p>
      )}
      <div className="mt-4 rounded-lg border border-white/10 bg-white/[0.03] p-3 text-xs text-white/70">
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          <Stat label="Génotype" value={f.observed} />
          <Stat label="Zygotie" value={f.zygosity} />
          <Stat label="rsID" value={f.entry.rs} />
          {act.locus && <Stat label="Position" value={`chr${act.locus.chr}:${act.locus.pos.toLocaleString("fr-FR")}`} />}
        </div>
      </div>
      {f.entry.note && (
        <p className="mt-3 text-xs italic text-white/55">{f.entry.note}</p>
      )}
    </>
  );
}

function PharmaIntroBody({ count }: { count: number }) {
  return (
    <>
      <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Pharmacogénomique</h2>
      <p className="mt-3 text-sm leading-relaxed text-white/75 sm:text-base">
        {count === 0
          ? "Aucune règle CPIC/DPWG déclenchée avec votre génotype."
          : `${count} médicaments sont potentiellement affectés par vos variants.`}
      </p>
      <p className="mt-3 text-xs text-white/50">
        Nous allons regarder les plus cliniquement pertinents.
      </p>
    </>
  );
}

function PharmaBody({ act }: { act: Extract<Act, { kind: "pharma" }> }) {
  const d = act.drug;
  return (
    <>
      <div className="mb-2 flex items-center gap-2">
        <span
          className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${SEV_COLOR[d.severity]}`}
        >
          {SEV_LABEL[d.severity]}
        </span>
        <span className="text-xs text-white/40">Rang {act.rank}</span>
      </div>
      <h2 className="text-2xl font-bold capitalize tracking-tight sm:text-3xl">{d.drug}</h2>
      {d.drug_class && <p className="mt-1 text-xs text-white/50">{d.drug_class}</p>}
      <p className="mt-3 text-sm leading-relaxed text-white/80 sm:text-base">{d.effect}</p>
      <div className="mt-4 space-y-1.5">
        {d.contributors.map((c, i) => (
          <div
            key={i}
            className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs"
          >
            <span className="font-mono text-[#7c9cff]">{c.gene}</span>
            <span className="text-white/60">{c.phenotype}</span>
            <span className="rounded border border-white/15 bg-white/5 px-1.5 py-0.5 font-mono text-white/70">
              {c.zygosity}
            </span>
          </div>
        ))}
      </div>
    </>
  );
}

function PRSIntroBody({ count }: { count: number }) {
  return (
    <>
      <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Scores polygéniques</h2>
      <p className="mt-3 text-sm leading-relaxed text-white/75 sm:text-base">
        Additionner des milliers de petites variations pour positionner votre risque par rapport à la
        population. {count} traits évalués.
      </p>
    </>
  );
}

function PRSBody({ act }: { act: Extract<Act, { kind: "prs" }> }) {
  const p = act.finding;
  const highside = p.percentile > 50;
  const distance = Math.abs(p.percentile - 50);
  const tone = distance > 30 ? "high" : distance > 15 ? "medium" : "low";
  return (
    <>
      <div className="mb-2 flex items-center gap-2">
        <span
          className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${SEV_COLOR[tone]}`}
        >
          Percentile {p.percentile.toFixed(0)}
        </span>
      </div>
      <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{p.rule.trait}</h2>
      <p className="mt-2 text-xs text-white/50">{p.rule.description}</p>
      <div className="mt-4 rounded-lg border border-white/10 bg-white/[0.03] p-4">
        <div className="relative h-2 w-full rounded-full bg-white/10">
          <div
            className="absolute h-2 rounded-full bg-gradient-to-r from-[#7c9cff] to-[#c7b2ff]"
            style={{ width: `${Math.max(2, Math.min(100, p.percentile))}%` }}
          />
          <div
            className="absolute -top-1 h-4 w-0.5 bg-white"
            style={{ left: `${Math.max(0, Math.min(100, p.percentile))}%` }}
          />
        </div>
        <div className="mt-2 flex justify-between text-[10px] text-white/45">
          <span>0</span>
          <span>50 (médiane)</span>
          <span>100</span>
        </div>
      </div>
      <p className="mt-3 text-xs text-white/60">
        {highside
          ? `Au-dessus de la médiane (+${(p.percentile - 50).toFixed(0)} points).`
          : `En-dessous de la médiane (-${(50 - p.percentile).toFixed(0)} points).`}{" "}
        Couverture {Math.round(p.coverage * 100)}% ({p.matched}/{p.total} SNPs).
      </p>
    </>
  );
}

function TraitsBody({ act }: { act: Extract<Act, { kind: "traits" }> }) {
  return (
    <>
      <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Vos traits</h2>
      <p className="mt-2 text-sm text-white/60">
        Quelques signatures observables portées par votre génome.
      </p>
      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {act.traits.map((t, i) => (
          <div
            key={i}
            className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm"
          >
            <div className="flex items-center gap-2">
              {t.result?.emoji && <span className="text-lg">{t.result.emoji}</span>}
              <span className="font-medium text-white">{t.rule.title}</span>
            </div>
            <div className="mt-1 text-xs text-white/70">{t.result?.label}</div>
          </div>
        ))}
      </div>
    </>
  );
}

function ROHBody({ act }: { act: Extract<Act, { kind: "roh" }> }) {
  return (
    <>
      <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Homozygotie</h2>
      <div className="mt-4 flex items-baseline gap-3">
        <div className="font-mono text-5xl font-bold tabular-nums">
          {(act.fRoh * 100).toFixed(2)}
          <span className="text-2xl text-white/40">%</span>
        </div>
        <div className="text-xs text-white/50">
          {act.segments} segment{act.segments > 1 ? "s" : ""}
        </div>
      </div>
      <p className="mt-4 text-sm leading-relaxed text-white/75 sm:text-base">{act.interpretation}</p>
    </>
  );
}

function OutroBody({ act }: { act: Extract<Act, { kind: "outro" }> }) {
  return (
    <>
      <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">C'est votre génome.</h2>
      <p className="mt-3 text-sm leading-relaxed text-white/75 sm:text-base">
        {act.clinvarTotal} alerte{act.clinvarTotal > 1 ? "s" : ""} santé ·{" "}
        {act.pharmaTotal} médicament{act.pharmaTotal > 1 ? "s" : ""} ·{" "}
        {act.prsTotal} score{act.prsTotal > 1 ? "s" : ""} · {act.traitsTotal} trait{act.traitsTotal > 1 ? "s" : ""}.
      </p>
      <p className="mt-3 text-xs text-white/50">
        Pour une vue détaillée, chaque variant et chaque règle est explorable dans le rapport
        complet.
      </p>
      <Link
        href="/report"
        className="mt-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:border-white/40 hover:bg-white/20"
      >
        Voir le rapport détaillé →
      </Link>
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <span>
      <span className="text-white/40">{label}</span>{" "}
      <span className="font-mono text-white/85">{value}</span>
    </span>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-white/70">
      {children}
    </span>
  );
}

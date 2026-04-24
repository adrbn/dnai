"use client";

import Link from "next/link";
import type { Act } from "@/lib/story/acts";
import { WorldAncestryMap } from "./WorldAncestryMap";

const SEV_COLOR = {
  high: "text-oxblood border-oxblood/40 bg-oxblood/8",
  medium: "text-amber border-amber/40 bg-amber/10",
  low: "text-sage border-sage/40 bg-sage/10",
};

const SIG_LABEL: Record<string, string> = {
  P: "Pathogène",
  LP: "Probablement pathogène",
  "P/LP": "Pathogène / probablement pathogène",
};

const SEV_LABEL = { high: "Pertinence haute", medium: "Pertinence modérée", low: "Pertinence faible" };

export function ActPanel({ act }: { act: Act }) {
  return (
    <div className="pointer-events-auto w-full max-w-xl rounded-sm border border-ink/12 bg-paper p-7 text-ink shadow-[0_30px_80px_-20px_rgba(21,20,16,0.55)] sm:p-9">
      <div className="mb-4">
        <Chapter act={act} />
      </div>
      <Body act={act} />
    </div>
  );
}

function Chapter({ act }: { act: Act }) {
  const labels: Record<Act["kind"], string> = {
    intro: "Chapitre 1 — Le code",
    ancestry: "Chapitre 2 — Origines",
    "haplogroup-y": "Lignée paternelle",
    "haplogroup-mt": "Lignée maternelle",
    neanderthal: "Néandertal",
    "health-intro": "Chapitre 3 — Santé",
    clinvar: "Santé",
    actionable: "Variants documentés",
    carriers: "Dépistage de porteurs",
    "pharma-intro": "Chapitre 4 — Pharmaco",
    pharma: "Pharmaco",
    "prs-intro": "Chapitre 5 — Risque",
    prs: "Risque",
    traits: "Chapitre 6 — Traits",
    roh: "Chapitre 7 — Homozygotie",
    fun: "ADN créatif",
    outro: "Épilogue",
  };
  return (
    <div className="text-[10px] font-semibold uppercase tracking-[0.28em] text-oxblood">
      {labels[act.kind]}
    </div>
  );
}

function Body({ act }: { act: Act }) {
  switch (act.kind) {
    case "intro":
      return <IntroBody act={act} />;
    case "ancestry":
      return <AncestryBody act={act} />;
    case "haplogroup-y":
      return <HaplogroupYBody act={act} />;
    case "haplogroup-mt":
      return <HaplogroupMtBody act={act} />;
    case "neanderthal":
      return <NeanderthalBody act={act} />;
    case "health-intro":
      return <HealthIntroBody count={act.count} />;
    case "clinvar":
      return <ClinVarBody act={act} />;
    case "actionable":
      return <ActionableBody act={act} />;
    case "carriers":
      return <CarriersBody act={act} />;
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
    case "fun":
      return <FunBody act={act} />;
    case "outro":
      return <OutroBody act={act} />;
  }
}

function IntroBody({ act }: { act: Extract<Act, { kind: "intro" }> }) {
  return (
    <>
      <h2 className="font-serif text-[40px] font-medium leading-[1.05] tracking-[-0.02em] sm:text-[52px]">
        Votre génome,
        <br />
        <span className="bg-gradient-to-r from-cobalt to-oxblood bg-clip-text text-transparent">
          lu comme une histoire.
        </span>
      </h2>
      <p className="mt-4 text-sm leading-relaxed text-ink/80 sm:text-base">
        {act.primer} Nous allons vous emmener sur les variants qui comptent, chromosome par chromosome.
      </p>
      <div className="mt-5 flex flex-wrap gap-2 text-xs">
        <Pill>{act.sourceLabel}</Pill>
        <Pill>{act.filename}</Pill>
      </div>
      <p className="mt-5 text-xs text-ink/50">Faites défiler pour commencer</p>
    </>
  );
}

function HealthIntroBody({ count }: { count: number }) {
  return (
    <>
      <h2 className="font-serif text-[28px] font-medium tracking-[-0.01em] sm:text-[34px]">Santé</h2>
      <p className="mt-3 text-sm leading-relaxed text-ink/80 sm:text-base">
        {count === 0
          ? "Aucune variante pathogène détectée dans les bases cliniques (ClinVar P/LP)."
          : count === 1
            ? "Une variante pathogène a été trouvée dans les bases cliniques."
            : `${count} variantes pathogènes ou probablement pathogènes ont été trouvées.`}
      </p>
      <p className="mt-3 text-xs text-ink/55">
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
        <span className="text-xs text-ink/50">
          {act.rank}/{act.totalRanked}
        </span>
      </div>
      <h2 className="font-mono text-3xl font-bold tracking-tight sm:text-4xl">{f.entry.gene}</h2>
      {f.entry.condition && (
        <p className="mt-2 text-sm text-ink/80 sm:text-base">{f.entry.condition}</p>
      )}
      <div className="mt-4 rounded-lg border border-ink/10 bg-ink/[0.03] p-3 text-xs text-ink/75">
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          <Stat label="Génotype" value={f.observed} />
          <Stat label="Zygotie" value={f.zygosity} />
          <Stat label="rsID" value={f.entry.rs} />
          {act.locus && <Stat label="Position" value={`chr${act.locus.chr}:${act.locus.pos.toLocaleString("fr-FR")}`} />}
        </div>
      </div>
      {f.entry.note && (
        <p className="mt-3 text-xs italic text-ink/60">{f.entry.note}</p>
      )}
    </>
  );
}

function PharmaIntroBody({ count }: { count: number }) {
  return (
    <>
      <h2 className="font-serif text-[28px] font-medium tracking-[-0.01em] sm:text-[34px]">Pharmacogénomique</h2>
      <p className="mt-3 text-sm leading-relaxed text-ink/80 sm:text-base">
        {count === 0
          ? "Aucune règle CPIC/DPWG déclenchée avec votre génotype."
          : `${count} médicaments sont potentiellement affectés par vos variants.`}
      </p>
      <p className="mt-3 text-xs text-ink/55">
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
        <span className="text-xs text-ink/50">Rang {act.rank}</span>
      </div>
      <h2 className="font-serif text-[28px] font-medium capitalize tracking-[-0.01em] sm:text-[34px]">{d.drug}</h2>
      {d.drug_class && <p className="mt-1 text-xs text-ink/55">{d.drug_class}</p>}
      <p className="mt-3 text-sm leading-relaxed text-ink/85 sm:text-base">{d.effect}</p>
      <div className="mt-4 space-y-1.5">
        {d.contributors.map((c, i) => (
          <div
            key={i}
            className="flex items-center justify-between rounded-lg border border-ink/10 bg-ink/[0.03] px-3 py-2 text-xs"
          >
            <span className="font-mono text-cobalt">{c.gene}</span>
            <span className="text-ink/65">{c.phenotype}</span>
            <span className="rounded border border-ink/15 bg-ink/5 px-1.5 py-0.5 font-mono text-ink/75">
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
      <h2 className="font-serif text-[28px] font-medium tracking-[-0.01em] sm:text-[34px]">Scores polygéniques</h2>
      <p className="mt-3 text-sm leading-relaxed text-ink/80 sm:text-base">
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
      <h2 className="font-serif text-[28px] font-medium tracking-[-0.01em] sm:text-[34px]">{p.rule.trait}</h2>
      <p className="mt-2 text-xs text-ink/55">{p.rule.description}</p>
      <div className="mt-4 rounded-lg border border-ink/10 bg-ink/[0.03] p-4">
        <div className="relative h-2 w-full rounded-full bg-ink/8">
          <div
            className="absolute h-2 rounded-full"
            style={{
              width: `${Math.max(2, Math.min(100, p.percentile))}%`,
              background:
                "linear-gradient(to right, #7c9cff 0%, #c7b2ff 50%, #f76e6e 85%, #dc2626 100%)",
            }}
          />
          <div
            className="absolute -top-1 h-4 w-0.5 bg-ink"
            style={{ left: `${Math.max(0, Math.min(100, p.percentile))}%` }}
          />
        </div>
        <div className="mt-2 flex justify-between text-[10px] text-ink/45">
          <span>0</span>
          <span>50 (médiane)</span>
          <span>100</span>
        </div>
      </div>
      <p className="mt-3 text-xs text-ink/65">
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
      <h2 className="font-serif text-[28px] font-medium tracking-[-0.01em] sm:text-[34px]">Vos traits</h2>
      <p className="mt-2 text-sm text-ink/65">
        Quelques signatures observables portées par votre génome.
      </p>
      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {act.traits.map((t, i) => (
          <div
            key={i}
            className="rounded-lg border border-ink/10 bg-ink/[0.03] px-3 py-2.5 text-sm"
          >
            <div className="flex items-center gap-2">
              {t.result?.emoji && <span className="text-lg">{t.result.emoji}</span>}
              <span className="font-medium text-ink">{t.rule.title}</span>
            </div>
            <div className="mt-1 text-xs text-ink/75">{t.result?.label}</div>
          </div>
        ))}
      </div>
    </>
  );
}

function ROHBody({ act }: { act: Extract<Act, { kind: "roh" }> }) {
  return (
    <>
      <h2 className="font-serif text-[28px] font-medium tracking-[-0.01em] sm:text-[34px]">Homozygotie</h2>
      <div className="mt-4 flex items-baseline gap-3">
        <div className="font-mono text-5xl font-bold tabular-nums">
          {(act.fRoh * 100).toFixed(2)}
          <span className="text-2xl text-ink/50">%</span>
        </div>
        <div className="text-xs text-ink/55">
          {act.segments} segment{act.segments > 1 ? "s" : ""}
        </div>
      </div>
      <p className="mt-4 text-sm leading-relaxed text-ink/80 sm:text-base">{act.interpretation}</p>
    </>
  );
}

function OutroBody({ act }: { act: Extract<Act, { kind: "outro" }> }) {
  return (
    <>
      <h2 className="font-serif text-[28px] font-medium tracking-[-0.01em] sm:text-[34px]">C'est votre génome.</h2>
      <p className="mt-3 text-sm leading-relaxed text-ink/80 sm:text-base">
        {act.clinvarTotal} alerte{act.clinvarTotal > 1 ? "s" : ""} santé ·{" "}
        {act.pharmaTotal} médicament{act.pharmaTotal > 1 ? "s" : ""} ·{" "}
        {act.prsTotal} score{act.prsTotal > 1 ? "s" : ""} · {act.traitsTotal} trait{act.traitsTotal > 1 ? "s" : ""}.
      </p>
      <p className="mt-3 text-xs text-ink/55">
        Pour une vue détaillée, chaque variant et chaque règle est explorable dans le rapport
        complet.
      </p>
      <Link
        href="/report"
        className="mt-5 inline-flex items-center gap-2 rounded-sm border border-ink/25 bg-ink px-4 py-2 text-sm font-medium text-paper transition hover:bg-ink/90"
      >
        Voir le rapport détaillé →
      </Link>
    </>
  );
}

const REGION_COLOR: Record<string, string> = {
  AFR: "#f3a76b",
  EUR: "#7c9cff",
  EAS: "#ecc45c",
  SAS: "#c879d6",
  AMR: "#78dca0",
};

function AncestryBody({ act }: { act: Extract<Act, { kind: "ancestry" }> }) {
  const a = act.ancestry;
  const top = a.topRegion;
  const secondary = a.components.filter((c) => c.region !== top.region && c.percent >= 3);
  const coveragePct = (a.coverage * 100).toFixed(0);
  return (
    <>
      <h2 className="font-serif text-[28px] font-medium tracking-[-0.01em] sm:text-[34px]">Vos origines</h2>
      <p className="mt-2 text-[13px] leading-relaxed text-ink/70">
        Votre ADN a été projeté sur un panel de {a.total} marqueurs continentaux (AIMs).
        {" "}
        {a.matched}/{a.total} ont pu être lus dans votre fichier ({coveragePct}% de couverture).
        La composante dominante est{" "}
        <strong className="text-ink">{top.label}</strong> à {top.percent.toFixed(1)}%.
      </p>

      <WorldAncestryMap ancestry={a} />

      {/* Contextual detail block */}
      <div className="mt-4 rounded-sm border border-ink/10 bg-ink/[0.03] p-4 text-[12.5px] leading-relaxed text-ink/75">
        <div className="mb-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-oxblood">
          Comment c&apos;est calculé
        </div>
        <p>
          Pour chaque marqueur, on compare vos deux allèles aux fréquences observées dans cinq groupes
          continentaux (1000 Genomes, ALFA, panels Kidd AISNP). Un maximum de vraisemblance
          déterminant la composition la plus probable, puis une normalisation softmax donne les
          pourcentages ci-dessous.
        </p>
        {secondary.length > 0 && (
          <p className="mt-2">
            Composantes secondaires significatives :{" "}
            {secondary.map((c, i) => (
              <span key={c.region}>
                <strong className="text-ink">{c.label}</strong> ({c.percent.toFixed(1)}%)
                {i < secondary.length - 1 ? ", " : ""}
              </span>
            ))}
            . Cela peut refléter une ascendance mixte récente ou un partage ancien de fréquences
            alléliques entre régions.
          </p>
        )}
      </div>

      {/* Migration timeline */}
      <div className="mt-4 grid grid-cols-3 gap-2 text-center text-[11px] text-ink/65">
        <div className="rounded-sm border border-ink/10 bg-paper p-2.5">
          <div className="font-serif text-[18px] text-ink">70k</div>
          <div>ans — sortie d&apos;Afrique</div>
        </div>
        <div className="rounded-sm border border-ink/10 bg-paper p-2.5">
          <div className="font-serif text-[18px] text-ink">45k</div>
          <div>ans — peuplement de l&apos;Eurasie</div>
        </div>
        <div className="rounded-sm border border-ink/10 bg-paper p-2.5">
          <div className="font-serif text-[18px] text-ink">15k</div>
          <div>ans — arrivée aux Amériques</div>
        </div>
      </div>

      <p className="mt-4 text-[11px] italic text-ink/45">
        Estimation indicative, pour information — les panels cliniques d&apos;ascendance utilisent
        des milliers de marqueurs et ne peuvent résoudre des différences sub-continentales fines.
      </p>
    </>
  );
}

function HaplogroupYBody({ act }: { act: Extract<Act, { kind: "haplogroup-y" }> }) {
  return <HaplogroupBody hap={act.hap} title="Votre lignée paternelle" subtitle="Chromosome Y hérité de père en fils." />;
}

function HaplogroupMtBody({ act }: { act: Extract<Act, { kind: "haplogroup-mt" }> }) {
  return <HaplogroupBody hap={act.hap} title="Votre lignée maternelle" subtitle="ADN mitochondrial hérité de mère en fille." />;
}

function HaplogroupBody({
  hap,
  title,
  subtitle,
}: {
  hap: Extract<Act, { kind: "haplogroup-y" }>["hap"];
  title: string;
  subtitle: string;
}) {
  return (
    <>
      <h2 className="font-serif text-[28px] font-medium tracking-[-0.01em] sm:text-[34px]">{title}</h2>
      <p className="mt-1 text-xs text-ink/60">{subtitle}</p>
      <div className="mt-4 rounded-lg border border-ink/10 bg-ink/[0.03] p-4">
        <div className="font-mono text-4xl font-bold text-ink">{hap.assigned}</div>
        <p className="mt-2 text-sm text-ink/80">{hap.description}</p>
        {hap.migration && (
          <p className="mt-2 text-xs italic text-ink/60">{hap.migration}</p>
        )}
      </div>
      {hap.path.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[10px]">
          {hap.path.map((b, i) => (
            <span key={i} className="inline-flex items-center gap-1">
              <span className="rounded-full border border-ink/15 bg-ink/5 px-2 py-0.5 font-mono text-ink/75">
                {b.id}
              </span>
              {i < hap.path.length - 1 && <span className="text-ink/30">→</span>}
            </span>
          ))}
        </div>
      )}
    </>
  );
}

function NeanderthalBody({ act }: { act: Extract<Act, { kind: "neanderthal" }> }) {
  const n = act.neanderthal;
  return (
    <>
      <h2 className="font-serif text-[28px] font-medium tracking-[-0.01em] sm:text-[34px]">Héritage néandertalien</h2>
      <div className="mt-4 flex items-baseline gap-3">
        <div className="font-mono text-5xl font-bold tabular-nums text-amber">
          {n.percent.toFixed(2)}
          <span className="text-2xl text-ink/50">%</span>
        </div>
        <div className="text-xs text-ink/55">
          {n.archaicDosage}/{n.maxDosage} copies archaïques
        </div>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-ink/80">
        Il y a ~50 000 ans, vos ancêtres ont croisé des Néandertaliens. Ces fragments persistent : souvent ~2% pour les Eurasiens, plus élevés à l'Est.
      </p>
      {n.topHits.length > 0 && (
        <div className="mt-4 space-y-1.5">
          <div className="text-[10px] uppercase tracking-wider text-ink/50">Traces détectées</div>
          {n.topHits.map((h) => (
            <div
              key={h.rsid}
              className="rounded-lg border border-ink/10 bg-ink/[0.03] px-3 py-2 text-xs"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-amber">{h.gene}</span>
                <span className="text-ink/55">{h.dosage === 2 ? "hom." : "hét."}</span>
              </div>
              <p className="mt-0.5 text-ink/75">{h.note}</p>
            </div>
          ))}
        </div>
      )}
      <p className="mt-3 text-[11px] italic text-ink/45">
        Panel illustratif ({n.matchedSnps}/{n.totalSnps}). Les estimations cliniques utilisent plus de 100k SNPs.
      </p>
    </>
  );
}

const ACTIONABLE_RISK_COLOR: Record<string, string> = {
  high: "text-oxblood border-oxblood/40 bg-oxblood/10",
  moderate: "text-amber border-amber/40 bg-amber/10",
  low: "text-sage border-sage/40 bg-sage/10",
  neutral: "text-ink/65 border-ink/15 bg-ink/5",
};

function ActionableBody({ act }: { act: Extract<Act, { kind: "actionable" }> }) {
  return (
    <>
      <h2 className="font-serif text-[28px] font-medium tracking-[-0.01em] sm:text-[34px]">Variants documentés</h2>
      <p className="mt-2 text-xs text-ink/65">
        Variants simples associés à une signification clinique dans la littérature.
      </p>
      <div className="mt-4 space-y-2">
        {act.findings.map((f) => (
          <div
            key={f.id}
            className="rounded-lg border border-ink/10 bg-ink/[0.03] p-3 text-sm"
          >
            <div className="flex items-center justify-between gap-2">
              <div>
                <div className="font-medium text-ink">{f.name}</div>
                <div className="font-mono text-[10px] text-ink/45">{f.gene}</div>
              </div>
              <span
                className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${ACTIONABLE_RISK_COLOR[f.risk]}`}
              >
                {f.call}
              </span>
            </div>
            <p className="mt-1.5 text-xs text-ink/75">{f.note}</p>
          </div>
        ))}
      </div>
    </>
  );
}

function CarriersBody({ act }: { act: Extract<Act, { kind: "carriers" }> }) {
  return (
    <>
      <h2 className="font-serif text-[28px] font-medium tracking-[-0.01em] sm:text-[34px]">Dépistage de porteurs</h2>
      <p className="mt-2 text-xs text-ink/65">
        Variants récessifs sans symptôme chez vous mais transmissibles.
      </p>
      <div className="mt-4 space-y-2">
        {act.findings.map((f, i) => (
          <div
            key={i}
            className="flex items-start justify-between gap-3 rounded-lg border border-ink/10 bg-ink/[0.03] p-3 text-sm"
          >
            <div className="min-w-0 flex-1">
              <div className="font-medium text-ink">{f.condition}</div>
              <div className="font-mono text-[10px] text-ink/45">
                {f.gene} · {f.inheritance} · {f.rsid}
              </div>
              <p className="mt-1 text-xs text-ink/75">{f.note}</p>
            </div>
            <span
              className={`inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                f.status === "affected"
                  ? ACTIONABLE_RISK_COLOR.high
                  : ACTIONABLE_RISK_COLOR.moderate
              }`}
            >
              {f.status === "affected" ? "Atteint" : "Porteur"}
            </span>
          </div>
        ))}
      </div>
    </>
  );
}

function FunBody({ act }: { act: Extract<Act, { kind: "fun" }> }) {
  const f = act.fun;
  const centroid = "100 100";
  return (
    <>
      <h2 className="font-serif text-[28px] font-medium tracking-[-0.01em] sm:text-[34px]">Votre ADN créatif</h2>
      <p className="mt-2 text-xs text-ink/65">
        Trois signatures uniques générées depuis l'empreinte de votre fichier.
      </p>

      <div className="mt-4 rounded-lg border border-ink/10 bg-ink/[0.03] p-4">
        <div className="text-[10px] uppercase tracking-wider text-ink/50">Votre mélodie</div>
        <div className="mt-2 flex items-end gap-1">
          {f.music.notes.map((n, i) => {
            const height = ((n - 55) / 30) * 48 + 8;
            return (
              <div
                key={i}
                className="w-2 rounded-sm"
                style={{
                  height: `${Math.max(6, height)}px`,
                  background: `hsl(${210 + (i * 8) % 150} 70% ${50 + (i % 3) * 8}%)`,
                }}
              />
            );
          })}
        </div>
        <div className="mt-2 text-[10px] text-ink/55">
          {f.music.key} · {f.music.tempo} BPM · 16 notes
        </div>
      </div>

      <div className="mt-3 flex gap-3">
        <div className="rounded-lg border border-ink/10 bg-ink/[0.03] p-3">
          <div className="text-[10px] uppercase tracking-wider text-ink/50">Sigil ADN</div>
          <svg viewBox="0 0 200 200" className="mt-2 h-28 w-28">
            <defs>
              <radialGradient id={`gfun-${f.art.seed}`}>
                <stop offset="0%" stopColor={f.art.palette[0]} />
                <stop offset="100%" stopColor={f.art.palette[3]} />
              </radialGradient>
            </defs>
            <circle cx="100" cy="100" r="80" fill={`url(#gfun-${f.art.seed})`} opacity="0.3" />
            <path d={f.art.shapes} fill={f.art.palette[1]} opacity="0.65" />
            <path d={f.art.shapes} fill="none" stroke={f.art.palette[2]} strokeWidth="1.2" />
            <circle cx={centroid.split(" ")[0]} cy={centroid.split(" ")[1]} r="3" fill="#fff" />
          </svg>
        </div>
        <div className="flex-1 rounded-lg border border-ink/10 bg-ink/[0.03] p-3">
          <div className="text-[10px] uppercase tracking-wider text-ink/50">Jumeaux historiques</div>
          <div className="mt-2 space-y-1.5">
            {f.twins.map((t) => (
              <div key={t.name} className="text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-ink/85">{t.name}</span>
                  <span className="font-mono text-ink/65">{t.similarity.toFixed(0)}%</span>
                </div>
                <div className="text-[10px] text-ink/45">{t.era}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <p className="mt-3 text-[11px] italic text-ink/45">
        Générées depuis l'empreinte SHA-256 — purement ludique.
      </p>
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <span>
      <span className="text-ink/50">{label}</span>{" "}
      <span className="font-mono text-ink/85">{value}</span>
    </span>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-ink/15 bg-ink/5 px-2.5 py-1 text-ink/75">
      {children}
    </span>
  );
}

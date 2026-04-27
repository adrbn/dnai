"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { ProgressOverlay } from "@/components/ui/ProgressOverlay";
import { runAnalysis } from "@/lib/analyzer-client";
import { useAnalysis } from "@/lib/store/analysis";
import { useConsent } from "@/lib/store/consent";
import { DisclaimerModal } from "@/components/DisclaimerModal";
import { useLang, type Lang as I18nLang } from "@/lib/i18n/lang";

// ——————————————————————————————————————————————————————————————
// Direction 1 · CLINIQUE — medical-grade second opinion.
// Paper-white, serif display, clinical severity accents (oxblood / amber / cobalt).
// No gradient, no emoji. A real specimen report peeks from the hero so the user
// sees what the product outputs before they upload.
// ——————————————————————————————————————————————————————————————

const CL = {
  paper: "#f3efe8",
  paperDeep: "#e9e3d7",
  paperLight: "#fdfcf8",
  ink: "#151410",
  ink2: "#3b3a34",
  ink3: "#6a675d",
  rule: "#d4cdbc",
  oxblood: "#8e2a23", // pathogenic
  amber: "#a66a12", // likely pathogenic
  cobalt: "#1e3a8a", // pharmaco / PGS
  sage: "#3d5a45", // confirmed / trait
};

type Lang = "fr" | "en";

type Strings = {
  nav: { tagline: string; method: string; sample: string; privacy: string; source: string };
  hero: {
    eyebrow: string;
    headline: React.ReactNode;
    lede: string;
    fullRead: string;
    price: string;
    priceSub: string;
    cta: string;
    ctaBusy: string;
    sample: string;
    testimony: string;
    testimonyAuthor: string;
    trust: string[];
  };
  specimen: {
    ribbon: string;
    title: string;
    meta: string;
    severityHeadline: string;
    findingNote: string;
    footerLeft: string;
    pathogenic: string;
    likely: string;
    pharma: string;
    polygenic: string;
  };
  method: { eyebrow: string; heading: string; rows: { n: string; ttl: string; src: string; body: string }[] };
  sample: { eyebrow: string; heading: string; health: string; pharma: string };
  outro: { eyebrow: string; headline: React.ReactNode; cta: string; footnote: string };
  footer: { copy: string };
};

const STRINGS: Record<Lang, Strings> = {
  fr: {
    nav: {
      tagline: "Analyse génomique clinique",
      method: "Méthode",
      sample: "Exemple de rapport",
      privacy: "Confidentialité",
      source: "Code source",
    },
    hero: {
      eyebrow: "Un second avis génomique · depuis votre navigateur",
      headline: (
        <>
          Le rapport
          <br />
          que votre
          <br />
          <em className="font-serif italic" style={{ color: CL.oxblood }}>
            médecin
          </em>
          <br />
          ne vous a pas
          <br />
          encore lu.
        </>
      ),
      lede: "Déposez le fichier brut de votre test ADN grand public. DNAI annote vos variantes selon ClinVar, CPIC et DPWG — les mêmes bases qu'un généticien — puis produit un rapport structuré, lisible et imprimable.",
      fullRead: "Lecture complète",
      price: "29 €",
      priceSub: "Un fichier · rapport à vie",
      cta: "Déposer mon fichier",
      ctaBusy: "Analyse en cours…",
      sample: "Voir un rapport témoin",
      testimony: "« En 3 minutes, j'ai vu des variants dont mon généticien ne m'avait jamais parlé. »",
      testimonyAuthor: "— A. M., porteuse Facteur V Leiden",
      trust: ["Analyse locale", "ClinVar · CPIC · DPWG", "702 k variantes / 3 s", "Code source ouvert"],
    },
    specimen: {
      ribbon: "Rapport génomique · confidentiel",
      title: "Résultats cliniquement significatifs",
      meta: "my_heritage_export_2024.csv · 702 154 SNPs · GRCh37",
      severityHeadline: "PATHOGÈNE · DISCUTER AVEC UN SPÉCIALISTE",
      findingNote: "Prédisposition héréditaire au cancer sein-ovaire. Consultation oncogénétique recommandée.",
      footerLeft: "Annotation ClinVar · CPIC · DPWG",
      pathogenic: "Pathogenic",
      likely: "Likely pathogenic",
      pharma: "Pharmacogenomic",
      polygenic: "Polygenic",
    },
    method: {
      eyebrow: "Méthode",
      heading: "Quatre lectures successives, dans votre navigateur.",
      rows: [
        {
          n: "01",
          ttl: "Lecture clinique",
          src: "ClinVar v2024-10",
          body: "Annotation des variantes pathogènes et probablement pathogènes. Seulement les résultats exploitables apparaissent.",
        },
        {
          n: "02",
          ttl: "Pharmacogénomique",
          src: "CPIC · DPWG",
          body: "15 médicaments courants. Allèles en étoile CYP2C19, CYP2D6, VKORC1, SLCO1B1, DPYD, HLA-B.",
        },
        {
          n: "03",
          ttl: "Scores polygéniques",
          src: "PGS Catalog",
          body: "Percentile vs population de référence. Interprétation brute — à lire avec vos antécédents familiaux.",
        },
        {
          n: "04",
          ttl: "F-ROH & qualité",
          src: "Calculs internes",
          body: "Coefficient de consanguinité par runs d'homozygotie. Taux d'appel et hétérozygotie pour valider la qualité du fichier.",
        },
      ],
    },
    sample: {
      eyebrow: "Pages 4–5 d'un rapport type",
      heading:
        "Du rsID\nau paragraphe lisible.",
      health: "Santé · clinvar",
      pharma: "Pharmacogénomique",
    },
    outro: {
      eyebrow: "Votre fichier — lu en 3 secondes",
      headline: (
        <>
          Le code était là
          <br />
          depuis toujours.
          <br />
          <em className="font-serif italic" style={{ color: CL.paperDeep }}>
            Lisez-le.
          </em>
        </>
      ),
      cta: "Déposer mon fichier · 29 €",
      footnote:
        "Paiement Stripe. Le fichier ne quitte jamais votre navigateur. Rapport PDF exportable. Outil éducatif — discutez toute découverte avec un professionnel de santé.",
    },
    footer: {
      copy: "DNAI · GRCh37/38 · ClinVar · CPIC · DPWG · PGS Catalog — par Adrien Robino",
    },
  },
  en: {
    nav: {
      tagline: "Clinical genomic analysis",
      method: "Method",
      sample: "Sample report",
      privacy: "Privacy",
      source: "Source code",
    },
    hero: {
      eyebrow: "A second genomic opinion · from your browser",
      headline: (
        <>
          The report
          <br />
          your doctor
          <br />
          <em className="font-serif italic" style={{ color: CL.oxblood }}>
            hasn&apos;t
          </em>
          <br />
          read to you
          <br />
          yet.
        </>
      ),
      lede: "Drop the raw file from your consumer DNA test. DNAI annotates your variants against ClinVar, CPIC and DPWG — the same databases a geneticist uses — then produces a structured, readable, printable report.",
      fullRead: "Full read",
      price: "€29",
      priceSub: "One file · lifetime report",
      cta: "Drop my file",
      ctaBusy: "Analysing…",
      sample: "See a sample",
      testimony: "“In three minutes, I saw variants my geneticist had never mentioned.”",
      testimonyAuthor: "— A. M., Factor V Leiden carrier",
      trust: ["Local analysis", "ClinVar · CPIC · DPWG", "702k variants / 3 s", "Open source"],
    },
    specimen: {
      ribbon: "Genomic report · confidential",
      title: "Clinically significant findings",
      meta: "my_heritage_export_2024.csv · 702,154 SNPs · GRCh37",
      severityHeadline: "PATHOGENIC · DISCUSS WITH A SPECIALIST",
      findingNote: "Hereditary breast-ovarian cancer predisposition. Oncogenetic counseling recommended.",
      footerLeft: "ClinVar · CPIC · DPWG annotation",
      pathogenic: "Pathogenic",
      likely: "Likely pathogenic",
      pharma: "Pharmacogenomic",
      polygenic: "Polygenic",
    },
    method: {
      eyebrow: "Method",
      heading: "Four successive reads, in your browser.",
      rows: [
        {
          n: "01",
          ttl: "Clinical read",
          src: "ClinVar v2024-10",
          body: "Annotates pathogenic and likely-pathogenic variants. Only actionable results surface.",
        },
        {
          n: "02",
          ttl: "Pharmacogenomics",
          src: "CPIC · DPWG",
          body: "15 common drugs. Star haplotypes: CYP2C19, CYP2D6, VKORC1, SLCO1B1, DPYD, HLA-B.",
        },
        {
          n: "03",
          ttl: "Polygenic scores",
          src: "PGS Catalog",
          body: "Percentile vs reference population. Raw interpretation — read alongside family history.",
        },
        {
          n: "04",
          ttl: "F-ROH & QC",
          src: "Internal",
          body: "Inbreeding coefficient by runs of homozygosity. Call rate and heterozygosity to validate file quality.",
        },
      ],
    },
    sample: {
      eyebrow: "Pages 4–5 of a sample report",
      heading: "From rsID\nto readable paragraph.",
      health: "Health · clinvar",
      pharma: "Pharmacogenomics",
    },
    outro: {
      eyebrow: "Your file — read in 3 seconds",
      headline: (
        <>
          The code was
          <br />
          always there.
          <br />
          <em className="font-serif italic" style={{ color: CL.paperDeep }}>
            Read it.
          </em>
        </>
      ),
      cta: "Drop my file · €29",
      footnote:
        "Stripe checkout. Your file never leaves your browser. Exportable PDF report. Educational tool — discuss any finding with a healthcare professional.",
    },
    footer: {
      copy: "DNAI · GRCh37/38 · ClinVar · CPIC · DPWG · PGS Catalog — by Adrien Robino",
    },
  },
};

// Sample findings for the "Pages 4–5" spread
const SAMPLE_CLINVAR: {
  gene: string;
  rsid: string;
  chr: number;
  position: number;
  genotype: string;
  zygosity: string;
  clinsig: Record<Lang, string>;
  freq: number;
  consequence: string;
  condition: Record<Lang, string>;
  note: Record<Lang, string>;
}[] = [
  {
    gene: "F5",
    rsid: "rs6025",
    chr: 1,
    position: 169519049,
    genotype: "A/G",
    zygosity: "het",
    clinsig: { fr: "Pathogène", en: "Pathogenic" },
    freq: 0.025,
    consequence: "missense_variant · R506Q (Leiden)",
    condition: {
      fr: "Thrombophilie — Facteur V Leiden.",
      en: "Thrombophilia — Factor V Leiden.",
    },
    note: {
      fr: "Hétérozygote. Risque thrombo-embolique modéré — éviter œstrogènes, prudence péri-opératoire.",
      en: "Heterozygous. Moderate thromboembolic risk — avoid estrogens, peri-op caution.",
    },
  },
  {
    gene: "MTHFR",
    rsid: "rs1801133",
    chr: 1,
    position: 11856378,
    genotype: "C/T",
    zygosity: "het",
    clinsig: { fr: "Facteur de risque", en: "Risk factor" },
    freq: 0.312,
    consequence: "missense_variant · A222V (C677T)",
    condition: {
      fr: "Métabolisme des folates — homocystéine.",
      en: "Folate metabolism — homocysteine.",
    },
    note: {
      fr: "Variant commun. Surveillance homocystéine si facteurs associés ; apports en folates adéquats.",
      en: "Common variant. Monitor homocysteine if co-factors present ; maintain folate intake.",
    },
  },
];

const SAMPLE_PHARMA: {
  drug: Record<Lang, string>;
  gene: string;
  phenotype: Record<Lang, string>;
  star: string;
  severity: "high" | "moderate" | "info";
  source: string;
  advice: Record<Lang, string>;
}[] = [
  {
    drug: { fr: "Clopidogrel", en: "Clopidogrel" },
    gene: "CYP2C19",
    phenotype: { fr: "Métaboliseur intermédiaire", en: "Intermediate metabolizer" },
    star: "*1/*2",
    severity: "moderate",
    source: "CPIC Level A",
    advice: {
      fr: "Activation partielle. Envisager prasugrel ou ticagrélor selon contexte clinique.",
      en: "Partial activation. Consider prasugrel or ticagrelor depending on clinical context.",
    },
  },
  {
    drug: { fr: "Simvastatine", en: "Simvastatin" },
    gene: "SLCO1B1",
    phenotype: { fr: "Fonction diminuée", en: "Decreased function" },
    star: "rs4149056 · C/T",
    severity: "moderate",
    source: "CPIC Level A",
    advice: {
      fr: "Risque myopathie à forte dose. Limiter à 20 mg/j ou préférer rosuvastatine.",
      en: "Myopathy risk at high dose. Cap at 20 mg/day or prefer rosuvastatin.",
    },
  },
  {
    drug: { fr: "Codéine", en: "Codeine" },
    gene: "CYP2D6",
    phenotype: { fr: "Métaboliseur normal", en: "Normal metabolizer" },
    star: "*1/*1",
    severity: "info",
    source: "CPIC Level A",
    advice: {
      fr: "Conversion en morphine attendue. Posologie standard adaptée à la douleur.",
      en: "Expected morphine conversion. Standard dosing appropriate for pain.",
    },
  },
];

export default function Home() {
  const router = useRouter();
  const { setStatus, setProgress, setData, setError, reset, status } = useAnalysis();
  const [lang, setLang, langHydrated] = useLang();
  const inputRef = useRef<HTMLInputElement>(null);
  const lastFileRef = useRef<File | null>(null);
  const busy = status === "running";

  const onFile = useCallback(
    async (file: File) => {
      lastFileRef.current = file;
      reset();
      setStatus("running");
      try {
        const data = await runAnalysis(file, { onProgress: setProgress });
        setData(data);
        router.push("/story");
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Erreur inconnue";
        setError(msg);
      }
    },
    [reset, setStatus, setProgress, setData, setError, router],
  );

  const handleRetry = useCallback(() => {
    const f = lastFileRef.current;
    if (f) onFile(f);
  }, [onFile]);

  const handleDismiss = useCallback(() => {
    reset();
    lastFileRef.current = null;
  }, [reset]);

  // ——— Consent gate : must acknowledge disclaimer before any analysis runs
  const { accepted, hydrated, hydrate } = useConsent();
  const [modalOpen, setModalOpen] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  useEffect(() => {
    if (!hydrated) hydrate();
  }, [hydrated, hydrate]);

  const maybeRunFile = useCallback(
    (f: File) => {
      if (accepted) {
        onFile(f);
      } else {
        setPendingFile(f);
        setModalOpen(true);
      }
    },
    [accepted, onFile],
  );

  const pickFile = useCallback(() => {
    if (busy) return;
    if (!accepted) {
      setModalOpen(true);
      return;
    }
    inputRef.current?.click();
  }, [busy, accepted]);

  const onDrop = useCallback(
    (ev: React.DragEvent<HTMLDivElement>) => {
      ev.preventDefault();
      if (busy) return;
      const f = ev.dataTransfer.files?.[0];
      if (f) maybeRunFile(f);
    },
    [maybeRunFile, busy],
  );

  const onAccepted = useCallback(() => {
    setModalOpen(false);
    if (pendingFile) {
      onFile(pendingFile);
      setPendingFile(null);
    } else {
      inputRef.current?.click();
    }
  }, [pendingFile, onFile]);

  const s = STRINGS[lang];

  // Avoid the FR→EN flash on reload when the user's stored preference is EN:
  // useLang returns "fr" until hydrated. Render a neutral skeleton until then.
  if (!langHydrated) {
    return (
      <main
        className="relative min-h-screen"
        style={{ background: CL.paper, color: CL.ink }}
        aria-hidden
      />
    );
  }

  return (
    <main
      className="relative min-h-screen"
      style={{
        background: CL.paper,
        color: CL.ink,
        fontFamily: "var(--font-sans), Inter, system-ui, sans-serif",
      }}
      onDragOver={(e) => {
        if (!busy) e.preventDefault();
      }}
      onDrop={onDrop}
    >
      <ProgressOverlay
        onRetry={lastFileRef.current ? handleRetry : undefined}
        onDismiss={handleDismiss}
      />

      {/* hidden file input drives the CTA buttons */}
      <input
        ref={inputRef}
        type="file"
        accept=".zip,.csv,.gz,.vcf,.vcf.gz"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) maybeRunFile(f);
        }}
      />

      <DisclaimerModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setPendingFile(null);
        }}
        onAccepted={onAccepted}
        lang={lang}
      />

      <div className="mx-auto max-w-[1440px]">
        <Nav lang={lang} onLang={setLang} strings={s.nav} />
        <Hero lang={lang} strings={s} onPick={pickFile} busy={busy} />
        <Methodology strings={s.method} />
        <SampleSpread strings={s.sample} lang={lang} />
        <CtaFooter strings={s.outro} onPick={pickFile} busy={busy} busyLabel={s.hero.ctaBusy} />
        <Footer strings={s.footer} />
      </div>
    </main>
  );
}

// ——————————————————————————————————————————————————————————————
// NAV
// ——————————————————————————————————————————————————————————————
function Nav({
  lang,
  onLang,
  strings,
}: {
  lang: Lang;
  onLang: (l: Lang) => void;
  strings: Strings["nav"];
}) {
  return (
    <div
      className="flex items-center justify-between gap-4 px-6 py-5 sm:px-10 sm:py-6 lg:px-14"
      style={{ borderBottom: `1px solid ${CL.rule}` }}
    >
      <div className="flex items-baseline gap-4">
        <div
          className="font-serif text-2xl font-medium tracking-tight sm:text-[26px]"
          style={{ color: CL.ink, letterSpacing: "-0.01em" }}
        >
          dnai<span style={{ color: CL.oxblood }}>.</span>
        </div>
        <div
          className="hidden text-[11px] uppercase tracking-[0.16em] sm:block"
          style={{ color: CL.ink3, fontFamily: "var(--font-sans)" }}
        >
          {strings.tagline}
        </div>
      </div>
      <div className="relative z-20 flex items-center gap-1 text-[13px] sm:gap-2" style={{ color: CL.ink2 }}>
        <a
          href="#method"
          className="hidden rounded-sm px-3 py-2 hover:underline sm:inline-block"
          style={{ color: CL.ink2 }}
        >
          {strings.method}
        </a>
        <a
          href="#sample"
          className="hidden rounded-sm px-3 py-2 hover:underline md:inline-block"
          style={{ color: CL.ink2 }}
        >
          {strings.sample}
        </a>
        <a
          href="https://github.com/adrbn/dnai"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden rounded-sm px-3 py-2 hover:underline lg:inline-block"
          style={{ color: CL.ink2 }}
        >
          {strings.source}
        </a>
        <div className="flex overflow-hidden" style={{ border: `1px solid ${CL.rule}`, borderRadius: 2 }}>
          {(["fr", "en"] as Lang[]).map((l) => (
            <button
              key={l}
              onClick={() => onLang(l)}
              type="button"
              className="inline-flex min-w-[44px] items-center justify-center px-3.5 py-2 text-[11px] uppercase tracking-[0.1em] transition"
              style={{
                background: lang === l ? CL.ink : "transparent",
                color: lang === l ? CL.paper : CL.ink2,
                fontFamily: "var(--font-sans)",
              }}
            >
              {l}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ——————————————————————————————————————————————————————————————
// HERO
// ——————————————————————————————————————————————————————————————
function Hero({
  lang,
  strings,
  onPick,
  busy,
}: {
  lang: Lang;
  strings: Strings;
  onPick: () => void;
  busy: boolean;
}) {
  return (
    <section
      className="relative flex min-h-[calc(100vh-1px)] flex-col overflow-hidden px-6 pb-10 pt-12 sm:px-10 sm:pb-12 sm:pt-16 lg:px-14 lg:pb-14 lg:pt-20"
      style={{ borderBottom: `1px solid ${CL.rule}` }}
    >
      {/* subtle grid watermark */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-35"
        style={{
          backgroundImage: `linear-gradient(${CL.paperDeep} 1px, transparent 1px), linear-gradient(90deg, ${CL.paperDeep} 1px, transparent 1px)`,
          backgroundSize: "80px 80px",
          maskImage: "radial-gradient(ellipse at 20% 30%, black, transparent 70%)",
          WebkitMaskImage: "radial-gradient(ellipse at 20% 30%, black, transparent 70%)",
        }}
      />

      <div className="relative grid grid-cols-1 items-center gap-12 lg:grid-cols-[1.15fr_1fr] lg:gap-14">
        {/* copy */}
        <div>
          <div
            className="flex items-center gap-3 text-[11px] uppercase tracking-[0.2em]"
            style={{ color: CL.ink3 }}
          >
            <span className="h-px w-7" style={{ background: CL.ink3 }} />
            <span>{strings.hero.eyebrow}</span>
          </div>
          <h1
            className="mt-5 font-serif"
            style={{
              fontFamily: "var(--font-serif), ui-serif, Georgia, serif",
              fontSize: "clamp(40px, 6.5vw, 68px)",
              lineHeight: 0.98,
              letterSpacing: "-0.028em",
              fontWeight: 400,
              color: CL.ink,
            }}
          >
            {strings.hero.headline}
          </h1>
          <p
            className="mt-5 max-w-[520px]"
            style={{
              fontFamily: "var(--font-serif), ui-serif, Georgia, serif",
              fontSize: 19,
              lineHeight: 1.5,
              color: CL.ink2,
            }}
          >
            {strings.hero.lede}
          </p>

          {/* pricing panel */}
          <div
            className="mt-7 grid max-w-[520px] grid-cols-1 sm:grid-cols-2"
            style={{ border: `1px solid ${CL.rule}`, background: CL.paperLight }}
          >
            <div
              className="p-6"
              style={{ borderRight: `1px solid ${CL.rule}` }}
            >
              <div
                className="text-[10px] uppercase tracking-[0.18em]"
                style={{ color: CL.ink3, fontFamily: "var(--font-sans)" }}
              >
                {strings.hero.fullRead}
              </div>
              <div
                className="mt-2 font-serif"
                style={{
                  fontFamily: "var(--font-serif)",
                  fontSize: 34,
                  color: CL.ink,
                  letterSpacing: "-0.02em",
                }}
              >
                {strings.hero.price}
              </div>
              <div
                className="mt-1 text-[12px]"
                style={{ color: CL.ink3, fontFamily: "var(--font-sans)" }}
              >
                {strings.hero.priceSub}
              </div>
              <button
                onClick={onPick}
                disabled={busy}
                className="mt-5 inline-flex w-full items-center justify-center gap-2 whitespace-nowrap px-4 py-3 text-[12px] uppercase tracking-[0.06em] transition disabled:opacity-60 sm:text-[13px]"
                style={{
                  background: CL.ink,
                  color: CL.paper,
                  fontFamily: "var(--font-sans)",
                  cursor: busy ? "wait" : "pointer",
                }}
              >
                {busy ? strings.hero.ctaBusy : `${strings.hero.cta} →`}
              </button>
            </div>
            <div className="p-6" style={{ background: CL.paperDeep }}>
              <div
                className="text-[10px] uppercase tracking-[0.18em]"
                style={{ color: CL.ink3, fontFamily: "var(--font-sans)" }}
              >
                {strings.hero.sample}
              </div>
              <div
                className="mt-2 italic"
                style={{
                  fontFamily: "var(--font-serif)",
                  fontSize: 15,
                  lineHeight: 1.5,
                  color: CL.ink,
                }}
              >
                {strings.hero.testimony}
              </div>
              <div
                className="mt-2 text-[11px]"
                style={{ color: CL.ink3, fontFamily: "var(--font-sans)" }}
              >
                {strings.hero.testimonyAuthor}
              </div>
            </div>
          </div>

          {/* trust row */}
          <div
            className="mt-6 flex flex-wrap gap-6 text-[11px] uppercase tracking-[0.1em]"
            style={{ color: CL.ink3, fontFamily: "var(--font-sans)" }}
          >
            <span className="flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden>
                <path
                  d="M7 1L2 3v4c0 3 2.2 5.5 5 6 2.8-0.5 5-3 5-6V3L7 1z"
                  fill="none"
                  stroke={CL.ink2}
                  strokeWidth="1.2"
                />
                <path d="M4.5 7l1.8 1.8L9.5 5.5" fill="none" stroke={CL.oxblood} strokeWidth="1.2" />
              </svg>
              {strings.hero.trust[0]}
            </span>
            <span>{strings.hero.trust[1]}</span>
            <span>{strings.hero.trust[2]}</span>
            <span>{strings.hero.trust[3]}</span>
          </div>
        </div>

        {/* specimen + helix card */}
        <div className="relative hidden min-h-[520px] items-center justify-center lg:flex">
          <div
            className="absolute"
            style={{
              top: 0,
              right: -20,
              width: 320,
              height: 420,
              background: CL.ink,
              color: CL.paper,
              padding: 28,
              transform: "rotate(-4deg)",
              boxShadow: "0 30px 80px -30px rgba(21,20,16,0.4)",
              zIndex: 1,
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <div>
              <div
                className="text-[10px] uppercase tracking-[0.18em]"
                style={{ opacity: 0.6, fontFamily: "var(--font-sans)" }}
              >
                DNA · profile
              </div>
              <div
                className="mt-2"
                style={{ fontFamily: "var(--font-serif)", fontSize: 22, letterSpacing: "-0.01em" }}
              >
                rs6025
              </div>
            </div>
            <HelixSvg />
            <div
              className="text-[10px] tracking-[0.08em]"
              style={{ opacity: 0.6, fontFamily: "var(--font-mono)" }}
            >
              F5 · chr1 · R506Q
            </div>
          </div>
          <div
            className="absolute"
            style={{
              top: 40,
              left: 0,
              right: 0,
              bottom: 40,
              display: "flex",
              justifyContent: "center",
              zIndex: 2,
            }}
          >
            <SpecimenReport lang={lang} strings={strings.specimen} />
          </div>
        </div>

        {/* mobile specimen */}
        <div className="lg:hidden">
          <SpecimenReport lang={lang} strings={strings.specimen} />
        </div>
      </div>
    </section>
  );
}

// ——————————————————————————————————————————————————————————————
// SPECIMEN REPORT CARD
// ——————————————————————————————————————————————————————————————
function SpecimenReport({ lang, strings }: { lang: Lang; strings: Strings["specimen"] }) {
  const rows: { sev: string; color: string; gene: string; cond: string; tag: string }[] = [
    {
      sev: "P",
      color: CL.oxblood,
      gene: "HFE",
      cond: lang === "fr" ? "Hémochromatose, C282Y hét." : "Hemochromatosis, C282Y het.",
      tag: strings.pathogenic,
    },
    {
      sev: "LP",
      color: CL.amber,
      gene: "F5",
      cond: lang === "fr" ? "Facteur V Leiden, thrombophilie" : "Factor V Leiden, thrombophilia",
      tag: strings.likely,
    },
    {
      sev: "Rx",
      color: CL.cobalt,
      gene: "CYP2C19",
      cond: lang === "fr" ? "Clopidogrel · métaboliseur lent" : "Clopidogrel · poor metabolizer",
      tag: strings.pharma,
    },
    {
      sev: "Rx",
      color: CL.cobalt,
      gene: "VKORC1",
      cond: lang === "fr" ? "Warfarine · dose abaissée" : "Warfarin · lower dose",
      tag: strings.pharma,
    },
    {
      sev: "↑",
      color: CL.ink2,
      gene: "PGS 000014",
      cond: lang === "fr" ? "Diabète type 2 · 88ᵉ percentile" : "Type 2 diabetes · 88th percentile",
      tag: strings.polygenic,
    },
  ];
  return (
    <div
      className="w-full max-w-[520px]"
      style={{
        background: CL.paperLight,
        border: `1px solid ${CL.rule}`,
        boxShadow:
          "0 60px 120px -40px rgba(21,20,16,0.35), 0 18px 36px -18px rgba(21,20,16,0.18)",
        transform: "rotate(1.5deg)",
        color: CL.ink,
      }}
    >
      {/* masthead */}
      <div className="px-6 pb-3.5 pt-5 sm:px-7" style={{ borderBottom: `1px solid ${CL.rule}` }}>
        <div className="flex items-baseline justify-between gap-3">
          <div
            className="text-[10px] uppercase tracking-[0.18em]"
            style={{ color: CL.ink3, fontFamily: "var(--font-sans)" }}
          >
            {strings.ribbon}
          </div>
          <div className="text-[10px]" style={{ color: CL.ink3, fontFamily: "var(--font-mono)" }}>
            DNAI-2024-1114-A
          </div>
        </div>
        <div
          className="mt-2"
          style={{
            fontFamily: "var(--font-serif)",
            fontSize: 22,
            fontWeight: 500,
            letterSpacing: "-0.01em",
          }}
        >
          {strings.title}
        </div>
        <div
          className="mt-1 text-[11px]"
          style={{ color: CL.ink3, fontFamily: "var(--font-sans)" }}
        >
          {strings.meta}
        </div>
      </div>

      {/* headline finding */}
      <div
        className="px-6 py-5 sm:px-7"
        style={{ borderBottom: `1px solid ${CL.rule}`, background: "#f8f4ea" }}
      >
        <div className="flex items-start gap-3.5">
          <div className="w-1 self-stretch" style={{ background: CL.oxblood }} />
          <div className="flex-1">
            <div
              className="text-[10px] font-semibold uppercase tracking-[0.2em]"
              style={{ color: CL.oxblood, fontFamily: "var(--font-sans)" }}
            >
              {strings.severityHeadline}
            </div>
            <div
              className="mt-1"
              style={{
                fontFamily: "var(--font-serif)",
                fontSize: 30,
                fontWeight: 500,
                lineHeight: 1.1,
                letterSpacing: "-0.015em",
              }}
            >
              F5 &nbsp;
              <span className="italic" style={{ color: CL.ink3 }}>
                R506Q
              </span>
            </div>
            <div
              className="mt-1.5"
              style={{
                fontFamily: "var(--font-serif)",
                fontSize: 14,
                lineHeight: 1.45,
                color: CL.ink2,
              }}
            >
              {strings.findingNote}
            </div>
            <div
              className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[10px] tracking-[0.04em]"
              style={{ color: CL.ink3, fontFamily: "var(--font-mono)" }}
            >
              <span>rs6025</span>
              <span>chr1 : 169,519,049</span>
              <span>A/G · het</span>
              <span>AF 2.5 %</span>
            </div>
          </div>
        </div>
      </div>

      {/* rows */}
      {rows.map((r, i) => (
        <div
          key={i}
          className="grid items-center gap-3.5 px-6 py-3 sm:px-7"
          style={{
            gridTemplateColumns: "44px 1fr auto",
            borderBottom: i < rows.length - 1 ? `1px solid ${CL.rule}` : "none",
          }}
        >
          <div
            className="pl-2 text-[10px] font-bold uppercase tracking-[0.1em]"
            style={{
              color: r.color,
              borderLeft: `3px solid ${r.color}`,
              fontFamily: "var(--font-sans)",
            }}
          >
            {r.sev}
          </div>
          <div
            style={{
              fontFamily: "var(--font-serif)",
              fontSize: 15,
              fontWeight: 500,
            }}
          >
            {r.gene}{" "}
            <span className="italic" style={{ color: CL.ink3, fontSize: 13 }}>
              · {r.cond}
            </span>
          </div>
          <div
            className="hidden text-[10px] uppercase tracking-[0.08em] sm:block"
            style={{ color: CL.ink3, fontFamily: "var(--font-sans)" }}
          >
            {r.tag}
          </div>
        </div>
      ))}

      {/* footer */}
      <div
        className="flex justify-between px-6 py-3.5 text-[10px] uppercase tracking-[0.08em] sm:px-7"
        style={{
          background: CL.paperDeep,
          color: CL.ink3,
          fontFamily: "var(--font-sans)",
        }}
      >
        <div>{strings.footerLeft}</div>
        <div>p. 1 / 14</div>
      </div>
    </div>
  );
}

// ——————————————————————————————————————————————————————————————
// HELIX SVG (back card)
// ——————————————————————————————————————————————————————————————
function HelixSvg() {
  const lines = Array.from({ length: 28 }, (_, i) => {
    const y = 20 + i * 6;
    const a1 = Math.sin(i * 0.45) * 70 + 100;
    const a2 = Math.sin(i * 0.45 + Math.PI) * 70 + 100;
    return { y, a1, a2, highlight: i === 14 };
  });
  return (
    <svg viewBox="0 0 200 200" className="h-[200px] w-full" aria-hidden>
      {lines.map((l, i) => (
        <g key={i}>
          <line
            x1={l.a1}
            y1={l.y}
            x2={l.a2}
            y2={l.y}
            stroke={CL.paper}
            strokeOpacity={0.25}
            strokeWidth={0.8}
          />
          <circle cx={l.a1} cy={l.y} r={2} fill={l.highlight ? CL.oxblood : CL.paper} />
          <circle cx={l.a2} cy={l.y} r={2} fill={l.highlight ? CL.oxblood : CL.paper} />
        </g>
      ))}
    </svg>
  );
}

// ——————————————————————————————————————————————————————————————
// METHODOLOGY
// ——————————————————————————————————————————————————————————————
function Methodology({ strings }: { strings: Strings["method"] }) {
  return (
    <section
      id="method"
      className="px-6 py-16 sm:px-10 sm:py-20 lg:px-14"
      style={{
        borderBottom: `1px solid ${CL.rule}`,
        background: CL.paperLight,
      }}
    >
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_2.2fr] lg:gap-12">
        <div>
          <div
            className="text-[11px] uppercase tracking-[0.2em]"
            style={{ color: CL.ink3, fontFamily: "var(--font-sans)" }}
          >
            {strings.eyebrow}
          </div>
          <div
            className="mt-3"
            style={{
              fontFamily: "var(--font-serif)",
              fontSize: "clamp(30px, 4vw, 44px)",
              lineHeight: 1.05,
              letterSpacing: "-0.02em",
              color: CL.ink,
            }}
          >
            {strings.heading}
          </div>
        </div>
        <div>
          {strings.rows.map((r) => (
            <div
              key={r.n}
              className="grid items-baseline gap-6 py-6"
              style={{
                gridTemplateColumns: "minmax(48px, 64px) 1fr auto",
                borderTop: `1px solid ${CL.rule}`,
              }}
            >
              <div
                className="text-[18px]"
                style={{ color: CL.ink3, fontFamily: "var(--font-mono)" }}
              >
                {r.n}
              </div>
              <div>
                <div
                  style={{
                    fontFamily: "var(--font-serif)",
                    fontSize: 22,
                    letterSpacing: "-0.01em",
                    color: CL.ink,
                  }}
                >
                  {r.ttl}
                </div>
                <div
                  className="mt-1.5 max-w-[560px]"
                  style={{
                    fontFamily: "var(--font-serif)",
                    fontSize: 15,
                    lineHeight: 1.55,
                    color: CL.ink2,
                  }}
                >
                  {r.body}
                </div>
              </div>
              <div
                className="text-right text-[11px] uppercase tracking-[0.1em]"
                style={{ color: CL.ink3, fontFamily: "var(--font-sans)" }}
              >
                {r.src}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ——————————————————————————————————————————————————————————————
// SAMPLE PAGE SPREAD
// ——————————————————————————————————————————————————————————————
function SampleSpread({ strings, lang }: { strings: Strings["sample"]; lang: Lang }) {
  return (
    <section
      id="sample"
      className="px-6 py-16 sm:px-10 sm:py-20 lg:px-14"
      style={{ borderBottom: `1px solid ${CL.rule}` }}
    >
      <div
        className="text-[11px] uppercase tracking-[0.2em]"
        style={{ color: CL.ink3, fontFamily: "var(--font-sans)" }}
      >
        {strings.eyebrow}
      </div>
      <div
        className="mt-3 max-w-[760px] whitespace-pre-line"
        style={{
          fontFamily: "var(--font-serif)",
          fontSize: "clamp(28px, 4.5vw, 56px)",
          lineHeight: 1.05,
          letterSpacing: "-0.025em",
          color: CL.ink,
        }}
      >
        {strings.heading}
      </div>

      <div
        className="mt-10 grid grid-cols-1 gap-px lg:grid-cols-2"
        style={{ background: CL.ink, border: `1px solid ${CL.ink}` }}
      >
        {/* page 4 */}
        <div className="px-8 py-9 sm:px-10" style={{ background: CL.paperLight, minHeight: 520 }}>
          <div
            className="flex justify-between text-[10px] uppercase tracking-[0.14em]"
            style={{ color: CL.ink3, fontFamily: "var(--font-sans)" }}
          >
            <span>{strings.health}</span>
            <span>4</span>
          </div>
          {SAMPLE_CLINVAR.slice(0, 2).map((v, i) => (
            <div
              key={i}
              className="mt-7"
              style={{
                borderTop: i > 0 ? `1px solid ${CL.rule}` : "none",
                paddingTop: i > 0 ? 28 : 0,
              }}
            >
              <div
                className="text-[10px] font-bold uppercase tracking-[0.16em]"
                style={{
                  color: v.clinsig[lang].toLowerCase().includes("likely") || v.clinsig[lang].toLowerCase().includes("probable") ? CL.amber : CL.oxblood,
                  fontFamily: "var(--font-sans)",
                }}
              >
                {v.clinsig[lang]}
              </div>
              <div
                className="mt-1.5"
                style={{
                  fontFamily: "var(--font-serif)",
                  fontSize: 28,
                  letterSpacing: "-0.015em",
                  color: CL.ink,
                }}
              >
                {v.gene}{" "}
                <span className="italic" style={{ fontSize: 18, color: CL.ink3 }}>
                  · {v.consequence.split("·")[1]?.trim()}
                </span>
              </div>
              <div
                className="mt-2"
                style={{ fontFamily: "var(--font-serif)", fontSize: 15, lineHeight: 1.55, color: CL.ink2 }}
              >
                {v.condition[lang]}
              </div>
              <div
                className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-[10px] tracking-[0.04em]"
                style={{ color: CL.ink3, fontFamily: "var(--font-mono)" }}
              >
                <span>{v.rsid}</span>
                <span>
                  chr{v.chr} : {v.position.toLocaleString("fr-FR")}
                </span>
                <span>
                  {v.genotype} · {v.zygosity}
                </span>
                <span>AF {(v.freq * 100).toFixed(3)}%</span>
              </div>
              <div
                className="mt-3.5 italic"
                style={{
                  fontFamily: "var(--font-serif)",
                  fontSize: 14,
                  lineHeight: 1.55,
                  color: CL.ink2,
                  paddingLeft: 16,
                  borderLeft: `2px solid ${CL.rule}`,
                }}
              >
                {v.note[lang]}
              </div>
            </div>
          ))}
        </div>

        {/* page 5 */}
        <div className="px-8 py-9 sm:px-10" style={{ background: CL.paperLight, minHeight: 520 }}>
          <div
            className="flex justify-between text-[10px] uppercase tracking-[0.14em]"
            style={{ color: CL.ink3, fontFamily: "var(--font-sans)" }}
          >
            <span>{strings.pharma}</span>
            <span>5</span>
          </div>
          <div className="mt-6">
            {SAMPLE_PHARMA.map((p, i) => {
              const sevColor =
                p.severity === "high" ? CL.oxblood : p.severity === "moderate" ? CL.amber : CL.sage;
              const sevLabel =
                p.severity === "high"
                  ? lang === "fr"
                    ? "Pertinence haute"
                    : "High relevance"
                  : p.severity === "moderate"
                    ? lang === "fr"
                      ? "Pertinence modérée"
                      : "Moderate relevance"
                    : lang === "fr"
                      ? "Info"
                      : "Info";
              return (
                <div
                  key={i}
                  className="grid gap-5 py-4"
                  style={{
                    gridTemplateColumns: "1fr 110px",
                    borderTop: `1px solid ${CL.rule}`,
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontFamily: "var(--font-serif)",
                        fontSize: 22,
                        letterSpacing: "-0.01em",
                        color: CL.ink,
                      }}
                    >
                      {p.drug[lang]}
                    </div>
                    <div
                      className="mt-1 text-[11px] tracking-[0.04em]"
                      style={{ color: CL.ink3, fontFamily: "var(--font-sans)" }}
                    >
                      {p.gene} &nbsp;·&nbsp; {p.star} &nbsp;·&nbsp; {p.phenotype[lang]}
                    </div>
                    <div
                      className="mt-2"
                      style={{
                        fontFamily: "var(--font-serif)",
                        fontSize: 13,
                        lineHeight: 1.5,
                        color: CL.ink2,
                      }}
                    >
                      {p.advice[lang]}
                    </div>
                  </div>
                  <div className="text-right">
                    <div
                      className="inline-block text-[10px] font-bold uppercase tracking-[0.12em]"
                      style={{ color: sevColor, fontFamily: "var(--font-sans)" }}
                    >
                      {sevLabel}
                    </div>
                    <div
                      className="mt-1.5 text-[9px] tracking-[0.04em]"
                      style={{ color: CL.ink3, fontFamily: "var(--font-mono)" }}
                    >
                      {p.source}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

// ——————————————————————————————————————————————————————————————
// CTA FOOTER (dark)
// ——————————————————————————————————————————————————————————————
function CtaFooter({
  strings,
  onPick,
  busy,
  busyLabel,
}: {
  strings: Strings["outro"];
  onPick: () => void;
  busy: boolean;
  busyLabel: string;
}) {
  return (
    <section
      className="grid grid-cols-1 items-center gap-12 px-6 py-16 sm:px-10 sm:py-20 lg:grid-cols-[1.5fr_1fr] lg:gap-14 lg:px-14 lg:py-24"
      style={{ background: CL.ink, color: CL.paper }}
    >
      <div>
        <div
          className="text-[11px] uppercase tracking-[0.2em]"
          style={{ opacity: 0.55, fontFamily: "var(--font-sans)" }}
        >
          {strings.eyebrow}
        </div>
        <div
          className="mt-3"
          style={{
            fontFamily: "var(--font-serif)",
            fontSize: "clamp(40px, 6.5vw, 58px)",
            letterSpacing: "-0.025em",
            lineHeight: 1,
          }}
        >
          {strings.headline}
        </div>
      </div>
      <div>
        <button
          onClick={onPick}
          disabled={busy}
          className="w-full px-6 py-5 text-[14px] uppercase tracking-[0.1em] transition disabled:opacity-60"
          style={{
            background: CL.paper,
            color: CL.ink,
            fontFamily: "var(--font-sans)",
            cursor: busy ? "wait" : "pointer",
          }}
        >
          {busy ? busyLabel : `${strings.cta} →`}
        </button>
        <div
          className="mt-3.5 text-[11px]"
          style={{
            opacity: 0.55,
            lineHeight: 1.6,
            fontFamily: "var(--font-sans)",
          }}
        >
          {strings.footnote}
        </div>
      </div>
    </section>
  );
}

// ——————————————————————————————————————————————————————————————
// FOOTER
// ——————————————————————————————————————————————————————————————
function Footer({ strings }: { strings: Strings["footer"] }) {
  return (
    <footer
      className="border-t px-6 py-7 text-center text-[11px] sm:px-10 lg:px-14"
      style={{ color: CL.ink3, fontFamily: "var(--font-sans)", borderColor: CL.rule }}
    >
      <div className="mx-auto max-w-3xl space-y-3">
        <p className="uppercase tracking-[0.1em]">{strings.copy}</p>
        <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1 text-[11px] tracking-wide">
          <a href="/legal/terms" className="underline underline-offset-4 hover:text-ink">Conditions</a>
          <a href="/legal/privacy" className="underline underline-offset-4 hover:text-ink">Confidentialité</a>
          <a href="/legal/notice" className="underline underline-offset-4 hover:text-ink">Mentions légales</a>
        </nav>
        <p className="mx-auto max-w-2xl pt-2 text-[11px] normal-case leading-relaxed text-ink/55">
          DNAI est un outil éducatif — pas un dispositif médical. Les informations proviennent de bases publiques
          (ClinVar, CPIC, DPWG, PGS Catalog) et ne remplacent ni un diagnostic, ni un test génétique clinique accrédité.
        </p>
      </div>
    </footer>
  );
}

<div align="center">

# DNAI

### A second genomic opinion, in your browser.

**Drop a MyHeritage / 23andMe / AncestryDNA / Living DNA / FTDNA / VCF export.
Get a health · pharmaco · ancestry · polygenic-risk report in ~3 seconds.
Your file never leaves your browser.**

[![Live](https://img.shields.io/badge/live-dnai.health-0a0a0a?style=flat-square)](https://www.dnai.health)
[![Next.js](https://img.shields.io/badge/Next.js-16-000?style=flat-square&logo=nextdotjs)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![License: MIT](https://img.shields.io/badge/license-MIT-green?style=flat-square)](./LICENSE)
[![No backend](https://img.shields.io/badge/backend-none-8a8a8a?style=flat-square)]()
[![100% client-side](https://img.shields.io/badge/parsing-100%25%20client--side-8a8a8a?style=flat-square)]()

[**→ Try it on dnai.health**](https://www.dnai.health) · [French README](./README.fr.md)

</div>

---

> ⚠️ **Educational tool — not a medical device.**
> DNAI does not diagnose, does not replace a medical consultation or an accredited clinical genetic test, and does not prescribe anything. Every result is presented descriptively and cited from the public literature. See [`/legal/terms`](https://www.dnai.health/legal/terms) and [`/legal/notice`](https://www.dnai.health/legal/notice).

---

## Why this exists

Consumer DNA labs hand you a pie chart of your "ethnicity", three folklore traits (bitter taste, earwax, freckles), and then they stop. Your `.zip` sits in an email, unused — while the same ~700,000 SNPs they read could tell you a lot more *descriptively*, if someone cross-referenced them with the public clinical literature.

That's all DNAI does. It opens the file **you already have**, annotates it against the same public databases clinicians cite (ClinVar, CPIC, DPWG, PGS Catalog, GWAS Catalog), and hands you back an editorial report — **on your machine, in your RAM, never on a server**.

No account. No upload. No "premium unlock for your own data". Just your file, opened properly.

## What you get

| Chapter | Source | What it does |
|---|---|---|
| **Health** | ClinVar (NCBI) | Pathogenic / likely-pathogenic variants, filtered by review status |
| **Pharmacogenomics** | CPIC + DPWG | Documented drug sensitivity across ~100 molecules |
| **Ancestry** | AIM panel + world map | Projection on ancestry-informative markers, 5 continental groups |
| **Lineages** | Y-DNA + mtDNA | Paternal & maternal haplogroups + Neanderthal fragment |
| **Polygenic risk** | PGS Catalog | Percentile for T2 diabetes, cardiovascular, LDL, BMI… |
| **Traits** | GWAS Catalog + SNPedia | Caffeine, lactose, alcohol, bitter taste, eye color, etc. |
| **Homozygosity** | ROH segments | Inbreeding coefficient estimate |
| **Animated narrative** | Three.js | 3D genome fly-through, chapter by chapter |
| **PDF export** | — | A4 clinical-style report with cover, sections, legal block |

## Privacy, by construction

Not a promise — an architecture.

- **No upload.** Parsing & annotation run in a Web Worker, in browser memory.
- **Local-only persistence.** The raw file is freed as soon as parsing finishes. The structured report (annotations, percentiles, narrative inputs) is cached in **IndexedDB on your device** so refresh, tab close and a return visit tomorrow don't force a re-import. Nothing crosses the network — clearing browser data wipes it.
- **Works offline.** Turn off Wi-Fi after the page loads — the whole pipeline keeps running.
- **No genetic telemetry.** We embed Vercel Analytics (page views, country, referrer). It **never** sees your file's content.

You can audit this yourself: open DevTools → Network, run an analysis, watch zero requests go out.

## Supported formats

| Source | Typical chip | Build |
|---|---|---|
| MyHeritage | ~700k SNPs | GRCh37 |
| 23andMe | ~600k SNPs | GRCh37 |
| AncestryDNA | ~700k SNPs | GRCh37 |
| Living DNA | ~650k SNPs | GRCh37 |
| FamilyTreeDNA | ~700k SNPs | GRCh37 |
| VCF (WGS) | millions of variants | GRCh37 / GRCh38 |

The report adapts its copy to the detected source and the number of positions read.

## How it works

```
  DNA file (.csv / .zip / .vcf)
             │
             ▼
  ┌──────────────────────┐
  │  Web Worker          │
  │  ─ fflate (unzip)    │
  │  ─ streaming parser  │
  └──────────┬───────────┘
             ▼
  ┌──────────────────────┐   ┌─────────────────────────┐
  │  Annotation pipeline │ ← │  public/data/*.json(.gz)│
  │  ─ ClinVar slim      │   │  Pre-built from public  │
  │  ─ CPIC / DPWG       │   │  sources in scripts/    │
  │  ─ PGS scoring       │   │  (ClinVar, CPIC, PGS…)  │
  │  ─ AIM projection    │   └─────────────────────────┘
  │  ─ Y/mt haplogroups  │
  └──────────┬───────────┘
             ▼
  Report UI · 3D narrative · PDF export
```

Everything above the arrows is your data. Everything to the right ships with the app.

## Run locally

```bash
pnpm install
pnpm dev      # http://localhost:3000
pnpm test     # Vitest unit tests
pnpm build    # static export → out/
```

Pure static export: deploys on Vercel, Cloudflare Pages, Netlify, GitHub Pages, or any S3 bucket. No server, no cron, no database.

To run the end-to-end smoke test against a real DNA file:

```bash
DNAI_REAL_FILE=/path/to/my-file.zip pnpm test
```

> Uses **pnpm**, not npm. Adding a dep? `pnpm add <pkg>`.

## Stack

- **Next.js 16** App Router, static export
- **React 19** + **TypeScript strict**
- **Tailwind CSS 3** with CSS variables (Clinique paper palette)
- **Zustand** for state (analysis, consent, unlock)
- **fflate** for in-browser zip decompression
- **D3** + **Three.js** (`@react-three/fiber`, `@react-three/drei`) for visualizations
- **Vitest** for tests
- **Biome** for lint & format

Repo layout (high level):

```
app/              Next.js App Router pages (/, /story, /report, /legal/*)
components/       React components — sections/, story/, viz/
lib/
  annotation/     Pipeline modules — clinvar, pharma, prs, ancestry, haplogroups
  parsing/        Raw-file parsers (23andMe, MyHeritage, AncestryDNA, VCF…)
  store/          Zustand stores
public/data/      Pre-built JSON annotation databases
scripts/          Scripts that rebuild public/data/ from public sources
```

## Scientific sources

Annotation databases are pre-built in `scripts/` from the official public sources:

- **ClinVar** (NCBI) — clinical significance of variants
- **CPIC** — Clinical Pharmacogenetics Implementation Consortium
- **DPWG** — Dutch Pharmacogenetics Working Group
- **PGS Catalog** (EBI / NHGRI) — polygenic score models
- **GWAS Catalog** + **SNPedia** (hand-curated) — traits & phenotypes

Generated JSON files live in `public/data/`.

## Known limits

Honest about what DNA chips can and can't do:

- **Consumer chips** — up to ~40% false-positive rate on rare variants per the literature. Any significant result **must** be confirmed by an accredited lab before any clinical decision.
- **Structural variants, CNVs, long indels** — not covered by chip arrays. For a WGS VCF, only biallelic SNVs with `PASS` are annotated today.
- **Ancestry** — compact illustrative panel (5 continental groups), **not** a fine sub-continental ancestry test.
- **No diagnosis** — DNAI is neither a medical device nor a clinical genetics laboratory.

If you want a diagnosis, see a geneticist. If you want a second look at the file sitting in your drawer, use DNAI.

## Roadmap

- [x] Genes for Good & Nebula source detection
- [x] Extended PGS panel — Alzheimer, osteoporosis, rheumatoid arthritis, celiac
- [x] Carrier-status report (recessive variants — CFTR, HEXA, etc.)
- [ ] WGS VCF: multi-allelic + indel annotation (parser in, annotation pending)
- [ ] Sub-continental ancestry (K≥12 panel)
- [x] Imputation for missing positions (LD proxies)
- [x] Full i18n (French + English)

## Contributing

Issues and PRs welcome. Given the medical context, any added clinical data **must**:

1. Cite a traceable public source (DOI, official URL).
2. Be phrased **descriptively** ("the literature associates…", "CPIC describes…"), never prescriptively ("avoid", "recommended").
3. Pass `pnpm test` and `pnpm build`.

We explicitly don't accept contributions that turn DNAI into a diagnostic tool or add prescriptive medical advice. That line is what keeps the project safe, legal, and useful.

## License

[MIT](./LICENSE) — free to use, modify, and redistribute.

## Acknowledgments

DNAI stands on the shoulders of the public-science community: NCBI / ClinVar, CPIC, DPWG, EBI / PGS Catalog, GWAS Catalog, and SNPedia contributors. None of this project would be possible without their decades of open curation. Thank you.

---

<div align="center">

**Built for the file already in your drawer.**

[dnai.health](https://www.dnai.health) · [Report an issue](https://github.com/adrbn/dnai/issues)

</div>

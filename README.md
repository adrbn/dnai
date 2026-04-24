# DNAI — a second genomic opinion, in your browser

**Drop a MyHeritage / 23andMe / AncestryDNA export, get a health / pharmaco / ancestry / risk report in ~3 seconds. Your file never leaves your browser.**

DNAI is a static Next.js app that parses a consumer DNA file, cross-references it with the public ClinVar / CPIC / DPWG / PGS Catalog / GWAS Catalog databases, and produces an editorial interactive report plus a clinical-style PDF export. No backend, no upload, no genetic telemetry.

> ⚠️ **Educational tool — not a medical device.**
> DNAI does not make any diagnosis, does not replace a medical consultation or an accredited clinical genetic test, and does not prescribe anything. All information is restituted descriptively and cited from the public literature. See `/legal/terms` and `/legal/notice` in the app.

---

## Live

- Production: [dnai.health](https://www.dnai.health)
- Source code: this repository

## What it does

A `.csv` or `.zip` export from MyHeritage/23andMe/AncestryDNA contains ~600–700k SNPs. Consumer labs hand you your ethnicity chart and three folklore traits, then stop. DNAI opens the same data and annotates it:

- **Health** — ClinVar pathogenic / likely-pathogenic variants, filtered by review status
- **Pharmacogenomics** — documented sensitivity to ~100 drugs via CPIC and DPWG guidelines
- **Ancestry** — projection on an ancestry-informative-marker (AIM) panel with a world map
- **Lineages** — Y-chromosome (paternal) and mt-DNA (maternal) haplogroups + Neanderthal fragment
- **Polygenic risk scores** — percentile computed for several traits (type-2 diabetes, cardiovascular, LDL, BMI…)
- **Traits** — caffeine, lactose, alcohol, bitter taste, eye color, etc.
- **Runs of homozygosity** — inbreeding coefficient estimate via ROH segments
- **Animated narrative** — a 3D genome visualization with a narrative camera, chapter by chapter
- **PDF export** — A4 typeset report with cover page, summary, numbered sections, legal block

## Privacy

**Your DNA file is never sent to a server.** Parsing and annotation run in a Web Worker in browser memory. The file is released when the tab closes. No genetic data is persisted — only your disclaimer acceptance is stored in `localStorage`.

You can turn off Wi-Fi right after the page loads: the whole pipeline keeps working.

Anonymous visit telemetry (Vercel Analytics — page views, country, referer) is embedded. It **never sees** the content of your file.

## Supported sources

| Source | Typical chip | Build |
|---|---|---|
| MyHeritage | ~700k SNPs | GRCh37 |
| 23andMe | ~600k SNPs | GRCh37 |
| AncestryDNA | ~700k SNPs | GRCh37 |
| Living DNA | ~650k SNPs | GRCh37 |
| FamilyTreeDNA | ~700k SNPs | GRCh37 |
| VCF (WGS) | millions of variants | GRCh37 / GRCh38 |

The report adapts its copy to the detected source and the number of positions read.

## Run locally

```bash
pnpm install
pnpm dev       # http://localhost:3000
pnpm test      # Vitest unit tests
pnpm build     # static export → out/
```

Pure static export: deploys on Vercel, Cloudflare Pages, Netlify, or any S3 bucket.

To run the end-to-end smoke test against a real DNA file:

```bash
DNAI_REAL_FILE=/path/to/my-file.zip pnpm test
```

## Stack

- **Next.js 16** (App Router, static export)
- **React 19** + **TypeScript** strict
- **Tailwind CSS 3** with CSS variables for the Clinique theme
- **Zustand** for state (analysis, consent)
- **fflate** — in-browser zip decompression
- **D3**, **Three.js** (via `@react-three/fiber` + `@react-three/drei`) for visualizations
- **Vitest** for tests
- **Biome** for lint/format

## Scientific sources

Annotation databases are pre-built in `scripts/` from official public sources:

- **ClinVar** (NCBI) — clinical significance of variants
- **CPIC** — Clinical Pharmacogenetics Implementation Consortium
- **DPWG** — Dutch Pharmacogenetics Working Group
- **PGS Catalog** (EBI/NHGRI) — polygenic score models
- **GWAS Catalog** + **SNPedia** (hand-curated) — traits

Generated JSON files live in `public/data/`.

## Known limits

- **Consumer chips** — up to ~40% false positives possible on rare variants per the literature. Any significant result must be confirmed by an accredited lab before any clinical decision.
- **Structural variants, CNVs, long indels** — not covered by chip arrays. For a WGS VCF, only biallelic SNVs with PASS are annotated today.
- **Ancestry** — compact illustrative panel (5 continental groups), not a fine sub-continental ancestry test.
- **No diagnosis** — DNAI is neither a medical device nor a clinical genetics laboratory.

## License

MIT — free to use, modify, and redistribute.

## Contributing

Issues and PRs welcome. Keep in mind that any added clinical data must:
1. cite a traceable public source (DOI, official URL),
2. be phrased descriptively (“the literature associates…”, “CPIC describes…”), not prescriptively (“avoid”, “recommended”),
3. pass `pnpm test` and `pnpm build`.

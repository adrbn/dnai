# DNAI v1 — Rapport santé actionnable client-side

Design validated 2026-04-23.

## But

Prendre un fichier raw MyHeritage (CSV, ~720k SNPs, build GRCh37) et produire un rapport de santé actionnable, 100% client-side, sans exfiltration. Premier utilisateur : fichier du frère. Deuxième : les données WGS de l'utilisateur quand elles arriveront (juin 2026).

## Scope v1 (explicite)

**Incluses**
- Ingestion CSV MyHeritage (ordre legacy 720k SNPs, build 37)
- Annotation ClinVar (variants `Pathogenic` / `Likely_pathogenic` avec review ≥ criteria/multiple submitters)
- Pharmacogénomique simple (lookup variant-par-variant, ~30-40 rsIDs curés CPIC)
- Traits lifestyle (~15-20 traits curés, haute confiance)
- Rapport interactif web avec visualisations "strong" (karyogramme, 3D AlphaFold viewer, sunburst pharma, hélice hero)
- Export JSON par section + PDF via print
- Tout en français

**Exclues (renvoyées à v2+)**
- Imputation (Michigan ou locale Beagle)
- PRS (Polygenic Risk Scores)
- AlphaMissense scoring de novo
- Ancestry, haplogroupes Y/mt, admixture, Néandertal
- Star-allele calling complet (CYP2D6 CNV/duplications)
- Comparaison fratrie / multi-fichiers
- LLM/chat intégré
- i18n, auth, persistance multi-session
- Support VCF en entrée (stub prévu, activé au v2)

## Stack

- Next.js 15 (App Router), TypeScript strict, `static export`
- Tailwind CSS + shadcn/ui
- Web Worker pour parsing + annotation (non-bloquant UI)
- d3-modular, Mol* (3D protéine), three + react-three-fiber (hero), framer-motion
- pnpm, vitest, biome
- Python `uv` pour les scripts de build de données (dev-time uniquement)
- Aucun serveur runtime (tout sert en statique)

## Archi — flux de données

```
User drop CSV
    → main thread lit File
    → postMessage au Worker
        → parse streaming (progress 0-50%)
        → fetch des 3 DBs (clinvar, pgx, traits) en parallèle
        → 3 annotateurs purs en parallèle (progress 50-100%)
        → postMessage {clinvar, pharma, traits, meta} au main
    → main thread rend les sections
    → visualisations fetch AlphaFold DB à la demande (opt-in)
```

Aucun appel réseau en runtime sauf :
1. Assets statiques co-hébergés (`public/data/*.json.gz`)
2. Fetch AlphaFold DB public (opt-in toggle UI) quand viewer 3D activé

## Structure de code

```
dnai/
├── app/
│   ├── page.tsx               # landing + drop zone
│   ├── report/page.tsx        # rapport avec tabs
│   └── layout.tsx
├── components/
│   ├── FileDropper.tsx
│   ├── ReportTabs.tsx
│   ├── viz/
│   │   ├── Karyogram.tsx      # SVG + d3
│   │   ├── ProteinViewer.tsx  # Mol*
│   │   ├── PharmaSunburst.tsx # d3-hierarchy
│   │   ├── DNAHeroHelix.tsx   # r3f
│   │   └── DensityHeatmap.tsx
│   └── sections/
│       ├── OverviewSection.tsx
│       ├── HealthSection.tsx
│       ├── PharmaSection.tsx
│       ├── TraitsSection.tsx
│       └── RawLookupSection.tsx
├── lib/
│   ├── parser/
│   │   ├── myheritage.ts
│   │   └── vcf.ts             # stub v1
│   ├── annotation/
│   │   ├── clinvar.ts
│   │   ├── pharma.ts
│   │   └── traits.ts
│   ├── genotype.ts            # normalize/match/strand
│   └── types.ts
├── workers/
│   └── analyzer.worker.ts     # orchestrateur
├── public/data/               # généré par scripts/
│   ├── clinvar-slim-b37.json.gz
│   ├── pgx-rules.json
│   ├── traits-rules.json
│   └── karyogram.json
├── scripts/                   # dev-time, Python uv
│   ├── pgx_rules.yaml
│   ├── traits_rules.yaml
│   ├── build_clinvar_slim.py
│   ├── build_rules.py
│   ├── build_karyo.py
│   └── Makefile
├── tests/
│   ├── fixtures/mini.csv
│   ├── parser.test.ts
│   ├── genotype.test.ts
│   ├── clinvar.test.ts
│   ├── pharma.test.ts
│   └── traits.test.ts
├── docs/superpowers/specs/
└── package.json
```

## Pipeline d'annotation

### Normalisation génotype (`lib/genotype.ts`)
- `normalize(raw: string): Genotype | NoCall` — gère `"--"`, ordre allèles
- `matchAllele(geno, ref, alt, opts?: {tryReverseStrand}): Zygosity` — avec complémentation brin optionnelle
- Zygosity = `"ref/ref" | "ref/alt" | "alt/alt" | "nocall" | "ambiguous"`

### ClinVar
- DB slim : `{rs, chr, pos, ref, alt, gene, sig: "P"|"LP"|"P/LP", cond, rev, cv}`
- Match par rsID → normalisation génotype → matchAllele → ne garder que ref/alt et alt/alt
- Sortie : `ClinVarFinding[]` triée par prio (homo alt > hétéro, puis par gène)

### Pharmacogénomique
- Règles YAML → JSON : `{id, gene, rsid, alt_allele, cpic_ref, call: {zygosity → phenotype+star}, implications: [{drug, effect, severity}]}`
- Pour chaque règle : lookup rsID → normalize → matchAllele → sortie `{gene, phenotype, star, implications}`
- Agrégation UI : groupage par médicament à travers les gènes

### Traits
- Règles YAML → JSON : `{id, title, gene, rsids[], call_rules: [{when: {rsid: genotype}, result: {label, detail}}], confidence, sources[]}`
- Support multi-rsIDs avec `when` par AND
- Premier match gagne ; fallback "indeterminate" si aucun

## Données de référence

### ClinVar slim
- Script Python `build_clinvar_slim.py` :
  - Download `https://ftp.ncbi.nlm.nih.gov/pub/clinvar/vcf_GRCh37/clinvar.vcf.gz`
  - Filter `CLNSIG ∈ {P, LP, P/LP}` + `CLNREVSTAT ≥ criteria_provided_multiple_submitters`
  - Project → JSON compact → gzip
- Cible : < 5 Mo gzipped
- Seed commité : subset de ~100 variants actionnables (BRCA1/2, APOE, HFE, F5, CFTR, LDLR, TTR, MLH1, MSH2, etc.) pour faire tourner l'app hors-connexion

### PGx / Traits
- YAML source curés à la main, commités
- `build_rules.py` valide (pydantic) + convertit JSON minifié

### Karyogram
- `build_karyo.py` télécharge UCSC cytoBand, projette en JSON

### Versioning
- Chaque JSON de sortie contient `{version, source, build, generated_at}`
- Affiché dans le footer UI

## UI

### Landing (`/`)
- Hero : hélice ADN r3f animée
- Drop zone centrée, check obligatoire "limites non-médicales"
- Bouton "Essayer avec fichier d'exemple"
- Progress bar parse + annotate

### Rapport (`/report`)
- Tabs : Overview | Santé | Pharma | Traits | Lookup
- **Overview** : stats cards, résumé exécutif, karyogramme avec pins
- **Santé** : liste filtrable de findings ClinVar, click → modal avec viewer 3D AlphaFold (opt-in)
- **Pharma** : sunburst interactif + liste regroupée par médicament
- **Traits** : grid de cartes
- **Lookup** : input rsID → méta + génotype user
- Dark mode par défaut

### Exports
- JSON par section
- PDF via `window.print()` + CSS print dédié
- Pas d'export raw genotypes

## Tests

- Vitest unit pour `lib/*` (100% coverage cible sur annotation)
- Fixtures : mini-CSV ~30 SNPs incluant cas limites (no-call, strand flip, absent, indel)
- Tests d'intégration worker (mock CSV → résultats complets)
- `test:real` local (gitignored) sur fichier frère pour non-régression
- Tests de composants critiques (FileDropper, sections) avec testing-library

## Livrables

1. `pnpm dev` → `localhost:3000`, fonctionne out-of-the-box avec seed ClinVar
2. `make data` regénère les DB complètes (optionnel, requiert Python + réseau)
3. Seed ClinVar + YAML curés fournissent une expérience utile immédiatement
4. Tests passants (`pnpm test`)
5. Export statique (`pnpm build && pnpm start`)

## Limites honnêtes (à afficher dans l'UI)

- Rapport **indicatif**, pas diagnostic — toute décision médicale passe par un médecin
- ClinVar slim = pathogènes bien documentés uniquement ; variants d'incertitude non inclus
- Pas de star-allele complet pour CYP2D6 (nécessite WGS/phasing)
- Pas d'imputation → seuls les ~720k SNPs de la puce sont analysés
- Biais populationnels non corrigés (les variants ClinVar sont majoritairement documentés sur populations européennes)

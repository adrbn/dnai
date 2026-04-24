# DNAI — second avis génomique dans le navigateur

**Déposez un export MyHeritage / 23andMe / AncestryDNA, obtenez un rapport santé / pharmaco / origines / risques en ~3 secondes. Votre fichier ne quitte jamais votre navigateur.**

DNAI est une application Next.js statique qui parse un fichier ADN grand public, le croise avec les bases publiques ClinVar / CPIC / DPWG / PGS Catalog / GWAS Catalog, et produit un rapport éditorial interactif + un export PDF type clinique. Aucun backend, aucun upload, aucune télémétrie génétique.

> ⚠️ **Outil éducatif — pas un dispositif médical.**
> DNAI n'établit aucun diagnostic, ne remplace ni une consultation ni un test génétique clinique accrédité, et ne prescrit rien. Toute information est restituée à titre descriptif et citée depuis la littérature publique. Voir `/legal/terms` et `/legal/notice` dans l'app.

---

## Démo

- Production : [dnai.health](https://www.dnai.health)
- Code source : ce dépôt

## Ce que ça fait

Un fichier `.csv` ou `.zip` MyHeritage/23andMe/AncestryDNA contient ~600–700 k SNPs. Les laboratoires grand public vous rendent votre carte ethnique et trois traits folkloriques, puis ils s'arrêtent. DNAI ouvre ces mêmes données et les annote :

- **Santé** — variants ClinVar pathogènes / probablement pathogènes, filtrés par niveau de revue
- **Pharmacogénomique** — sensibilité documentée à ~100 médicaments via les guidelines CPIC et DPWG
- **Origines** — projection sur un panel de marqueurs informatifs (AIMs) avec carte du monde
- **Lignées** — haplogroupes Y (paternelle) et mt (maternelle) + fragment néandertalien
- **Risques polygéniques** — percentile calculé pour plusieurs traits (diabète T2, cardiovasculaire, LDL, IMC…)
- **Traits** — caféine, lactose, alcool, amer, couleur des yeux, etc.
- **Homozygotie** — estimation du coefficient de consanguinité via les segments ROH
- **Récit animé** — une visualisation 3D du génome avec caméra narrative chapitre par chapitre
- **Export PDF** — rapport A4 typographié avec page de garde, synthèse, sections numérotées, bloc légal

## Confidentialité

**Votre fichier ADN n'est jamais transmis à un serveur.** Le parsing et l'annotation tournent dans un Web Worker, en mémoire du navigateur. Le fichier est libéré à la fermeture de l'onglet. Aucune donnée génétique n'est persistée — seule l'acceptation du disclaimer est stockée en `localStorage`.

Vous pouvez couper le wifi juste après le chargement de la page : tout le pipeline continue.

Une télémétrie de fréquentation anonyme (Vercel Analytics — page views, country, referer) est embarquée. Elle **ne voit jamais** le contenu de votre fichier.

## Sources de données supportées

| Source | Puce typique | Build |
|---|---|---|
| MyHeritage | ~700 k SNPs | GRCh37 |
| 23andMe | ~600 k SNPs | GRCh37 |
| AncestryDNA | ~700 k SNPs | GRCh37 |
| Living DNA | ~650 k SNPs | GRCh37 |
| FamilyTreeDNA | ~700 k SNPs | GRCh37 |
| VCF (WGS) | millions de variants | GRCh37 / GRCh38 |

Le rapport adapte ses textes en fonction de la source détectée et du nombre de positions lues.

## Démarrer en local

```bash
pnpm install
pnpm dev       # http://localhost:3000
pnpm test      # tests unitaires Vitest
pnpm build     # export statique → out/
```

Export statique pur : se déploie sur Vercel, Cloudflare Pages, Netlify, ou un simple bucket S3.

Pour lancer le smoke test de bout en bout avec un vrai fichier ADN :

```bash
DNAI_REAL_FILE=/chemin/vers/mon-fichier.zip pnpm test
```

## Stack

- **Next.js 16** (App Router, export statique)
- **React 19** + **TypeScript** strict
- **Tailwind CSS 3** avec variables CSS pour le thème Clinique
- **Zustand** pour le state (analyse, consent)
- **fflate** — décompression zip dans le navigateur
- **D3**, **Three.js** (via `@react-three/fiber` + `@react-three/drei`) pour les visualisations
- **Vitest** pour les tests
- **Biome** pour le lint/format

## Sources scientifiques

Les bases annotatives sont pré-construites dans `scripts/` à partir des sources publiques officielles :

- **ClinVar** (NCBI) — significance clinique des variants
- **CPIC** — Clinical Pharmacogenetics Implementation Consortium
- **DPWG** — Dutch Pharmacogenetics Working Group
- **PGS Catalog** (EBI/NHGRI) — modèles de scores polygéniques
- **GWAS Catalog** + **SNPedia** (curés à la main) — traits

Les fichiers JSON générés vivent dans `public/data/`.

## Limites connues

- **Puces grand public** — jusqu'à ~40 % de faux positifs possibles sur les variants rares selon la littérature. Tout résultat significatif doit être confirmé par un laboratoire accrédité avant toute décision clinique.
- **Variants structuraux, CNV, indels longs** — non couverts par les puces. Pour un VCF WGS, seuls les SNVs bialléliques PASS sont annotés aujourd'hui.
- **Ancestry** — panel compact illustratif (5 groupes continentaux), pas un test d'ascendance sub-continental fin.
- **Pas de diagnostic** — DNAI n'est ni un dispositif médical, ni un laboratoire de génétique clinique.

## Licence

MIT — code libre d'usage, de modification et de redistribution.

## Contribuer

Issues et PRs bienvenues. Gardez à l'esprit que tout ajout de données cliniques doit :
1. citer une source publique traçable (DOI, URL officielle),
2. être formulé en langage descriptif (« la littérature associe… », « CPIC décrit… ») et non prescriptif (« évitez », « recommandé »),
3. passer `pnpm test` et `pnpm build`.

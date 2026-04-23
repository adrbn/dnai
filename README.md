# DNAI — Analyse ADN dans votre navigateur

**Importez votre fichier MyHeritage, 23andMe, AncestryDNA… obtenez un rapport santé / pharmaco / risques en 10 secondes. Tout reste sur votre machine.**

DNAI est une app web statique qui parse vos données ADN brutes, les croise avec ClinVar / CPIC / DPWG / PGS Catalog, et rend un rapport PDF de qualité clinique — sans jamais envoyer votre génome nulle part.

---

## Pourquoi

Les rapports ADN grand public (MyHeritage, 23andMe) vous rendent deux choses : votre carte ethnique et trois traits folkloriques. Vous partez avec un zip de ~700 000 SNPs… et aucun moyen simple d'en tirer les informations de santé qu'il contient pourtant.

DNAI fait ça, localement :

- **Santé** — variantes pathogènes / probablement-pathogènes annotées ClinVar
- **Pharmacogénomique** — réponse probable à une centaine de médicaments (CPIC / DPWG)
- **Scores polygéniques** — percentile calculé pour des traits de risque (diabète type 2, maladies cardiovasculaires, LDL, IMC…)
- **Traits** — caféine, lactose, alcool, goût amer, etc.
- **Segments homozygotes (ROH)** — estimation du coefficient de consanguinité
- **Export PDF** — rapport formaté A4 avec page de garde, synthèse, sections numérotées, disclaimer médical

## Confidentialité

**Aucune donnée ne quitte votre navigateur.** Il n'y a pas de backend. Pas d'analytics. Pas de télémétrie. Le parsing et l'annotation tournent dans un Web Worker. Le fichier est ouvert en mémoire et libéré à la fin.

Vous pouvez littéralement couper votre wifi après avoir chargé la page.

## Sources de données supportées

Le parser détecte automatiquement :

| Source | Puce typique | Build |
|---|---|---|
| MyHeritage | ~700 k SNPs | GRCh37 |
| 23andMe | ~600 k SNPs | GRCh37 |
| AncestryDNA | ~700 k SNPs | GRCh37 |
| Living DNA | ~650 k SNPs | GRCh37 |
| FamilyTreeDNA | ~700 k SNPs | GRCh37 |

Le rapport adapte ses textes en fonction de la source détectée et du nombre de positions lues.

## Démarrer en local

```bash
pnpm install
pnpm dev       # localhost:3000
pnpm test      # unit tests
pnpm build     # static export → out/
```

Export statique pur : peut se déployer sur Vercel, Netlify, Cloudflare Pages, ou même un bucket S3.

Pour lancer le smoke test de bout en bout avec un vrai fichier :

```bash
DNAI_REAL_FILE=/chemin/vers/votre.zip pnpm test
```

## Stack technique

- **Next.js 15** (App Router, static export)
- **React 19** + **TypeScript** strict
- **Tailwind CSS 3** + CSS variables pour le thème
- **Zustand** pour le state
- **fflate** pour décompresser les zips MyHeritage dans le navigateur
- **Mol\***, **D3**, **Three.js** pour les visus
- **Vitest** pour les tests

## Sources scientifiques

Les bases sont pré-construites dans `scripts/` à partir des sources publiques officielles :

- **ClinVar** (NCBI) — variantes cliniques P/LP
- **CPIC** et **DPWG** — recommandations pharmacogénomiques
- **PGS Catalog** — modèles de scores polygéniques
- **GWAS Catalog** + **SNPedia** (curé à la main) — traits

Les fichiers JSON générés vivent dans `public/data/`.

## Ce qui n'est pas couvert

- **Ancestry / ethnicité** — ce serait redondant avec ce que donnent déjà les labos.
- **WGS (séquençage complet)** — le parser VCF n'est pas branché. Les puces grand public suffisent pour 95 % du contenu utile aux médecins aujourd'hui.
- **Variants structuraux, CNV, indels longs** — non couverts par les puces.
- **Diagnostic médical** — DNAI ne remplace pas un généticien clinicien. Toute variante importante doit être validée en labo.

## Avertissement médical

Ce logiciel est un outil éducatif. Il n'établit aucun diagnostic. Les variants ADN ont une pénétrance variable, les bases publiques peuvent contenir des erreurs, et les puces grand public ne lisent qu'une fraction du génome : un variant absent d'un rapport DNAI ne garantit pas son absence réelle. **Discutez toujours un résultat important avec un professionnel de santé.**

## Licence

MIT — voir `LICENSE` si présent, sinon code libre d'usage personnel et dérivation.

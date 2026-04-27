/**
 * Plain-language explainer for ClinVar findings.
 *
 * The bulk ClinVar dump ships zero free-text notes for end-users — only
 * gene / condition / classification codes. This module produces a structured
 * 3-part lay explanation so the report card stops reading like a SNP
 * coordinate dump.
 *
 * Strategy:
 *   1. Curated `GENE_LORE` for the top genes most users will see (BRCA1/2,
 *      MTHFR, HFE, CFTR, APOE, …) — hand-written 1-sentence descriptions of
 *      what the gene does + a known mode of inheritance.
 *   2. Templated fallback for unknown genes: synthesises a paragraph from
 *      (gene, condition, zygosity, inferred inheritance).
 *   3. A `CONDITION_PRETTY` map to translate ClinVar's vague umbrella labels
 *      ("Inborn genetic diseases", "not provided", …) into something the
 *      reader can actually parse.
 *
 * Tone is descriptive, never prescriptive — DNAI never says "consult a doctor"
 * imperatively. We say "à partager avec un médecin si symptômes" / "worth
 * raising with a clinician if symptoms appear".
 */
import type { ClinVarFinding } from "../types";
import type { Lang } from "../i18n/lang";

export type Inheritance =
  | "AR"   // autosomal recessive — both copies needed
  | "AD"   // autosomal dominant — one copy expresses
  | "XL"   // X-linked (recessive in practice for most disease)
  | "mito" // mitochondrial
  | "somatic"
  | "unknown";

export interface ClinVarExplanation {
  /** What the gene/condition is, in lay language. */
  what: string;
  /** What this zygosity means for the carrier given the inheritance. */
  zygosity: string;
  /** False-positive caveat + what to do without being prescriptive. */
  caveat: string;
}

interface GeneLore {
  fr: string;
  en: string;
  inheritance: Inheritance;
}

/**
 * Curated 1–2 sentence descriptions of the most-frequent ClinVar genes.
 * Inheritance follows OMIM / GeneReviews consensus for the headline disorder.
 */
const GENE_LORE: Record<string, GeneLore> = {
  BRCA1: {
    fr: "BRCA1 répare l'ADN endommagé. Une perte de fonction augmente fortement le risque de cancers du sein et de l'ovaire (syndrome HBOC).",
    en: "BRCA1 repairs damaged DNA. Loss-of-function strongly raises breast and ovarian cancer risk (HBOC syndrome).",
    inheritance: "AD",
  },
  BRCA2: {
    fr: "BRCA2 répare l'ADN par recombinaison homologue. Mutations associées au syndrome HBOC : sein, ovaire, prostate, pancréas.",
    en: "BRCA2 repairs DNA via homologous recombination. Mutations linked to HBOC syndrome: breast, ovarian, prostate, pancreatic cancer.",
    inheritance: "AD",
  },
  PALB2: {
    fr: "PALB2 est un partenaire de BRCA2 dans la réparation de l'ADN. Variants pathogènes augmentent le risque de cancer du sein.",
    en: "PALB2 partners with BRCA2 in DNA repair. Pathogenic variants raise breast cancer risk.",
    inheritance: "AD",
  },
  ATM: {
    fr: "ATM coordonne la réponse aux cassures double-brin de l'ADN. Deux copies mutées causent l'ataxie-télangiectasie ; une copie augmente modérément le risque de cancers.",
    en: "ATM coordinates the DNA double-strand break response. Two mutated copies cause ataxia-telangiectasia; one copy moderately raises cancer risk.",
    inheritance: "AR",
  },
  TP53: {
    fr: "TP53 est le « gardien du génome » : il déclenche réparation ou apoptose des cellules endommagées. Mutations associées au syndrome de Li-Fraumeni (cancers multiples précoces).",
    en: "TP53 is the « guardian of the genome » — it triggers repair or apoptosis in damaged cells. Mutations are linked to Li-Fraumeni syndrome (early multi-cancer).",
    inheritance: "AD",
  },
  MLH1: {
    fr: "MLH1 corrige les erreurs d'appariement de l'ADN. Variants pathogènes causent le syndrome de Lynch (cancers colorectaux et utérins précoces).",
    en: "MLH1 fixes DNA mismatch errors. Pathogenic variants cause Lynch syndrome (early colorectal and uterine cancers).",
    inheritance: "AD",
  },
  MSH2: {
    fr: "MSH2 détecte les mésappariements d'ADN. Mutations responsables du syndrome de Lynch.",
    en: "MSH2 detects DNA mismatches. Mutations cause Lynch syndrome.",
    inheritance: "AD",
  },
  MSH6: {
    fr: "MSH6 partenaire de MSH2 dans la réparation des mésappariements. Mutations causent une forme atténuée de syndrome de Lynch.",
    en: "MSH6 partners with MSH2 in mismatch repair. Mutations cause an attenuated form of Lynch syndrome.",
    inheritance: "AD",
  },
  PMS2: {
    fr: "PMS2 complète le complexe de réparation des mésappariements. Mutations associées au syndrome de Lynch (souvent forme tardive).",
    en: "PMS2 completes the mismatch repair complex. Mutations linked to Lynch syndrome (often late onset).",
    inheritance: "AD",
  },
  APC: {
    fr: "APC contrôle la prolifération des cellules intestinales. Mutations causent la polypose adénomateuse familiale (FAP) — centaines de polypes coliques, risque cancéreux quasi-certain sans suivi.",
    en: "APC controls intestinal cell growth. Mutations cause familial adenomatous polyposis (FAP) — hundreds of colon polyps, near-certain cancer without surveillance.",
    inheritance: "AD",
  },
  PTEN: {
    fr: "PTEN freine la croissance cellulaire. Mutations causent le syndrome de Cowden (cancers sein/thyroïde + lésions cutanées).",
    en: "PTEN brakes cell growth. Mutations cause Cowden syndrome (breast/thyroid cancers + skin lesions).",
    inheritance: "AD",
  },
  CDH1: {
    fr: "CDH1 (E-cadhérine) maintient l'adhésion cellulaire. Mutations associées au cancer gastrique diffus héréditaire et au cancer du sein lobulaire.",
    en: "CDH1 (E-cadherin) maintains cell adhesion. Mutations linked to hereditary diffuse gastric cancer and lobular breast cancer.",
    inheritance: "AD",
  },
  CHEK2: {
    fr: "CHEK2 active la réponse aux dommages de l'ADN. Variants augmentent modérément le risque de cancer du sein.",
    en: "CHEK2 activates DNA damage response. Variants moderately raise breast cancer risk.",
    inheritance: "AD",
  },
  CFTR: {
    fr: "CFTR transporte le chlorure à travers les membranes. Deux copies mutées causent la mucoviscidose ; une copie est asymptomatique mais transmissible.",
    en: "CFTR shuttles chloride across cell membranes. Two mutated copies cause cystic fibrosis; one copy is asymptomatic but transmissible.",
    inheritance: "AR",
  },
  HFE: {
    fr: "HFE régule l'absorption intestinale du fer. Deux copies mutées (souvent C282Y) causent l'hémochromatose génétique : surcharge en fer, atteinte hépatique.",
    en: "HFE regulates intestinal iron uptake. Two mutated copies (often C282Y) cause hereditary hemochromatosis: iron overload, liver damage.",
    inheritance: "AR",
  },
  LDLR: {
    fr: "LDLR est le récepteur du « mauvais cholestérol » LDL. Mutations causent l'hypercholestérolémie familiale : LDL très élevé dès l'enfance, risque cardiovasculaire précoce.",
    en: "LDLR is the LDL (« bad cholesterol ») receptor. Mutations cause familial hypercholesterolemia: very high LDL from childhood, early cardiovascular risk.",
    inheritance: "AD",
  },
  APOB: {
    fr: "APOB compose les lipoprotéines LDL. Mutations causent une hypercholestérolémie familiale (risque cardiovasculaire précoce).",
    en: "APOB makes up LDL particles. Mutations cause familial hypercholesterolemia (early cardiovascular risk).",
    inheritance: "AD",
  },
  PCSK9: {
    fr: "PCSK9 régule la dégradation du récepteur LDL. Variants gain-de-fonction → hypercholestérolémie ; variants perte-de-fonction → LDL bas, cardio-protection.",
    en: "PCSK9 regulates LDL receptor breakdown. Gain-of-function variants → high cholesterol; loss-of-function → low LDL, cardio-protective.",
    inheritance: "AD",
  },
  F2: {
    fr: "F2 code la prothrombine. La variante G20210A augmente modérément le risque de thromboses veineuses (phlébite, embolie pulmonaire).",
    en: "F2 encodes prothrombin. The G20210A variant moderately raises venous thrombosis risk (DVT, pulmonary embolism).",
    inheritance: "AD",
  },
  F5: {
    fr: "F5 (Facteur V Leiden) modifie la coagulation. Une copie augmente le risque thrombotique ×3-7, deux copies ×30-80.",
    en: "F5 (Factor V Leiden) alters clotting. One copy raises thrombosis risk ×3-7, two copies ×30-80.",
    inheritance: "AD",
  },
  MTHFR: {
    fr: "MTHFR active le folate. Le variant C677T réduit l'activité enzymatique d'environ 30% (hét.) à 70% (hom.). Effet clinique modeste, surtout signal sur l'homocystéine.",
    en: "MTHFR activates folate. The C677T variant cuts enzyme activity by ~30% (het.) to 70% (hom.). Clinical effect is mild, mostly an homocysteine signal.",
    inheritance: "AR",
  },
  APOE: {
    fr: "APOE transporte le cholestérol dans le cerveau. L'allèle ε4 est le plus fort facteur de risque génétique commun pour la maladie d'Alzheimer tardive.",
    en: "APOE shuttles cholesterol in the brain. The ε4 allele is the strongest common genetic risk factor for late-onset Alzheimer's.",
    inheritance: "AD",
  },
  SCN1A: {
    fr: "SCN1A code un canal sodium neuronal. Mutations causent le syndrome de Dravet (épilepsie sévère du nourrisson).",
    en: "SCN1A encodes a neuronal sodium channel. Mutations cause Dravet syndrome (severe infantile epilepsy).",
    inheritance: "AD",
  },
  RYR1: {
    fr: "RYR1 libère le calcium dans le muscle. Mutations associées à l'hyperthermie maligne (réaction grave à certains anesthésiques) et myopathies.",
    en: "RYR1 releases calcium in muscle. Mutations linked to malignant hyperthermia (severe reaction to some anesthetics) and myopathies.",
    inheritance: "AD",
  },
  FBN1: {
    fr: "FBN1 forme la fibrilline (matrice extracellulaire). Mutations causent le syndrome de Marfan : grande taille, atteinte cardiovasculaire (aorte) et oculaire.",
    en: "FBN1 makes fibrillin (extracellular matrix). Mutations cause Marfan syndrome: tall stature, cardiovascular (aortic) and ocular involvement.",
    inheritance: "AD",
  },
  COL1A1: {
    fr: "COL1A1 produit le collagène de type I. Mutations causent l'ostéogenèse imparfaite (« maladie des os de verre »).",
    en: "COL1A1 makes type I collagen. Mutations cause osteogenesis imperfecta (« brittle bone disease »).",
    inheritance: "AD",
  },
  COL1A2: {
    fr: "COL1A2 partenaire de COL1A1 pour le collagène de type I. Mutations → ostéogenèse imparfaite ou Ehlers-Danlos.",
    en: "COL1A2 partners with COL1A1 for type I collagen. Mutations → osteogenesis imperfecta or Ehlers-Danlos.",
    inheritance: "AD",
  },
  DMD: {
    fr: "DMD code la dystrophine, qui stabilise la fibre musculaire. Mutations causent la myopathie de Duchenne (grave) ou Becker (modérée), liées à l'X.",
    en: "DMD encodes dystrophin, which stabilises muscle fibers. Mutations cause Duchenne (severe) or Becker (milder) muscular dystrophy, X-linked.",
    inheritance: "XL",
  },
  GLA: {
    fr: "GLA dégrade certains glycolipides. Une carence cause la maladie de Fabry (douleurs, atteinte rénale et cardiaque), liée à l'X.",
    en: "GLA breaks down certain glycolipids. Deficiency causes Fabry disease (pain, kidney and heart involvement), X-linked.",
    inheritance: "XL",
  },
  GAA: {
    fr: "GAA dégrade le glycogène. Sa carence cause la maladie de Pompe (faiblesse musculaire, atteinte cardiaque chez le nourrisson).",
    en: "GAA breaks down glycogen. Its deficiency causes Pompe disease (muscle weakness, infant cardiac involvement).",
    inheritance: "AR",
  },
  ATP7B: {
    fr: "ATP7B exporte le cuivre du foie. Sa perte cause la maladie de Wilson : surcharge en cuivre, atteinte hépatique et neurologique.",
    en: "ATP7B exports copper from the liver. Its loss causes Wilson disease: copper overload, liver and neurological damage.",
    inheritance: "AR",
  },
  PAH: {
    fr: "PAH dégrade la phénylalanine. Une carence cause la phénylcétonurie : accumulation toxique pour le cerveau, dépistée à la naissance.",
    en: "PAH breaks down phenylalanine. Deficiency causes phenylketonuria: brain-toxic build-up, screened at birth.",
    inheritance: "AR",
  },
  MYBPC3: {
    fr: "MYBPC3 stabilise la contraction cardiaque. Mutations première cause génétique de cardiomyopathie hypertrophique.",
    en: "MYBPC3 stabilises cardiac contraction. Mutations are the leading genetic cause of hypertrophic cardiomyopathy.",
    inheritance: "AD",
  },
  MYH7: {
    fr: "MYH7 est la myosine lourde du muscle cardiaque. Mutations associées à cardiomyopathie hypertrophique ou dilatée.",
    en: "MYH7 is cardiac heavy-chain myosin. Mutations linked to hypertrophic or dilated cardiomyopathy.",
    inheritance: "AD",
  },
  KCNQ1: {
    fr: "KCNQ1 contrôle la repolarisation cardiaque. Mutations causent le syndrome du QT long (risque de syncope, arythmie).",
    en: "KCNQ1 controls cardiac repolarisation. Mutations cause long QT syndrome (risk of syncope, arrhythmia).",
    inheritance: "AD",
  },
  KCNH2: {
    fr: "KCNH2 (hERG) contrôle la repolarisation cardiaque. Mutations associées au syndrome du QT long de type 2.",
    en: "KCNH2 (hERG) controls cardiac repolarisation. Mutations linked to long QT syndrome type 2.",
    inheritance: "AD",
  },
  LMNA: {
    fr: "LMNA forme la lamine, charpente du noyau cellulaire. Mutations responsables d'un éventail très large : cardiomyopathie, dystrophie musculaire, lipodystrophie, progéria.",
    en: "LMNA makes lamin, the cell nucleus scaffold. Mutations cover a very broad range: cardiomyopathy, muscular dystrophy, lipodystrophy, progeria.",
    inheritance: "AD",
  },
  TTN: {
    fr: "TTN code la titine, plus grande protéine du corps, ressort du sarcomère. Mutations associées à cardiomyopathie dilatée et myopathies.",
    en: "TTN encodes titin, the body's largest protein, the sarcomere's spring. Mutations linked to dilated cardiomyopathy and myopathies.",
    inheritance: "AD",
  },
  NF1: {
    fr: "NF1 freine la voie RAS de croissance cellulaire. Mutations causent la neurofibromatose de type 1 : taches café-au-lait, neurofibromes, risque tumoral.",
    en: "NF1 brakes the RAS growth pathway. Mutations cause neurofibromatosis type 1: café-au-lait spots, neurofibromas, tumor risk.",
    inheritance: "AD",
  },
  PNPT1: {
    fr: "PNPT1 dégrade l'ARN dans la mitochondrie. Mutations rares associées à des surdités combinées à des troubles neurologiques sévères.",
    en: "PNPT1 degrades RNA inside mitochondria. Rare mutations associated with combined deafness and severe neurological disorders.",
    inheritance: "AR",
  },
  ABCA4: {
    fr: "ABCA4 recycle les pigments visuels. Mutations causent la maladie de Stargardt (perte de vision centrale chez l'adolescent/adulte jeune).",
    en: "ABCA4 recycles visual pigments. Mutations cause Stargardt disease (central vision loss in adolescents and young adults).",
    inheritance: "AR",
  },
  USH2A: {
    fr: "USH2A maintient les cellules ciliées de l'oreille interne et les photorécepteurs. Mutations causent le syndrome d'Usher (surdité + rétinite).",
    en: "USH2A maintains inner-ear hair cells and photoreceptors. Mutations cause Usher syndrome (deafness + retinitis pigmentosa).",
    inheritance: "AR",
  },
  PKD1: {
    fr: "PKD1 code la polycystine-1. Mutations responsables de la polykystose rénale dominante (kystes rénaux multiples, insuffisance rénale progressive).",
    en: "PKD1 encodes polycystin-1. Mutations cause autosomal dominant polycystic kidney disease (many kidney cysts, progressive kidney failure).",
    inheritance: "AD",
  },
  PKHD1: {
    fr: "PKHD1 code la fibrocystine. Mutations responsables de la polykystose rénale récessive (forme sévère, néonatale).",
    en: "PKHD1 encodes fibrocystin. Mutations cause autosomal recessive polycystic kidney disease (severe, neonatal form).",
    inheritance: "AR",
  },
  TSC2: {
    fr: "TSC2 freine la voie mTOR. Mutations causent la sclérose tubéreuse de Bourneville (lésions cérébrales, cutanées, rénales).",
    en: "TSC2 brakes the mTOR pathway. Mutations cause tuberous sclerosis (brain, skin, kidney lesions).",
    inheritance: "AD",
  },
  GCK: {
    fr: "GCK est le « senseur de glucose » des cellules β. Mutations causent un MODY 2 : hyperglycémie modérée à jeun stable toute la vie.",
    en: "GCK is the β-cell glucose sensor. Mutations cause MODY 2: stable mild fasting hyperglycemia throughout life.",
    inheritance: "AD",
  },
  HNF1A: {
    fr: "HNF1A régule l'expression dans le foie et le pancréas. Mutations causent un MODY 3 (diabète monogénique adulte jeune, sensible aux sulfonylurées).",
    en: "HNF1A regulates liver/pancreas expression. Mutations cause MODY 3 (young-adult monogenic diabetes, sulfonylurea-responsive).",
    inheritance: "AD",
  },
  // === Cancer predisposition (additional) ===
  VHL: {
    fr: "VHL freine la réponse à l'hypoxie. Mutations causent la maladie de von Hippel-Lindau : hémangioblastomes, cancer du rein à cellules claires, phéochromocytomes.",
    en: "VHL brakes the hypoxia response. Mutations cause von Hippel-Lindau disease: hemangioblastomas, clear-cell renal cancer, pheochromocytomas.",
    inheritance: "AD",
  },
  RET: {
    fr: "RET est un récepteur tyrosine kinase. Variants gain-de-fonction → néoplasies endocriniennes multiples (MEN2A/B), cancer médullaire de la thyroïde ; perte-de-fonction → maladie de Hirschsprung.",
    en: "RET is a tyrosine kinase receptor. Gain-of-function → multiple endocrine neoplasia (MEN2A/B), medullary thyroid cancer; loss-of-function → Hirschsprung disease.",
    inheritance: "AD",
  },
  MEN1: {
    fr: "MEN1 (ménine) est un suppresseur de tumeur. Mutations causent le syndrome MEN1 : tumeurs parathyroïdiennes, hypophysaires et pancréatiques.",
    en: "MEN1 (menin) is a tumour suppressor. Mutations cause MEN1 syndrome: parathyroid, pituitary and pancreatic tumours.",
    inheritance: "AD",
  },
  RB1: {
    fr: "RB1 est le suppresseur de tumeur originel. Mutations causent le rétinoblastome (cancer rétinien de l'enfant) et augmentent le risque d'autres tumeurs.",
    en: "RB1 is the original tumour suppressor. Mutations cause retinoblastoma (childhood retinal cancer) and raise risk for other tumours.",
    inheritance: "AD",
  },
  MUTYH: {
    fr: "MUTYH répare les dommages oxydatifs de l'ADN. Deux copies mutées causent une polypose colorectale (forme atténuée d'APC, ~100 polypes).",
    en: "MUTYH repairs oxidative DNA damage. Two mutated copies cause MUTYH-associated polyposis (attenuated APC-like, ~100 polyps).",
    inheritance: "AR",
  },
  CDKN2A: {
    fr: "CDKN2A produit p16, frein du cycle cellulaire. Mutations augmentent fortement le risque de mélanome et de cancer du pancréas familial.",
    en: "CDKN2A produces p16, a cell-cycle brake. Mutations strongly raise melanoma and familial pancreatic cancer risk.",
    inheritance: "AD",
  },
  BRIP1: {
    fr: "BRIP1 (FANCJ) est un partenaire de BRCA1 dans la réparation par recombinaison homologue. Variants augmentent le risque de cancer de l'ovaire.",
    en: "BRIP1 (FANCJ) partners with BRCA1 in homologous-recombination repair. Variants raise ovarian cancer risk.",
    inheritance: "AD",
  },
  RAD51C: {
    fr: "RAD51C participe à la réparation par recombinaison homologue. Variants pathogènes augmentent le risque de cancer de l'ovaire et de Fanconi.",
    en: "RAD51C contributes to homologous-recombination repair. Pathogenic variants raise ovarian cancer and Fanconi risk.",
    inheritance: "AD",
  },
  RAD51D: {
    fr: "RAD51D agit avec RAD51C dans la réparation de l'ADN. Variants associés au cancer de l'ovaire héréditaire.",
    en: "RAD51D acts with RAD51C in DNA repair. Variants linked to hereditary ovarian cancer.",
    inheritance: "AD",
  },
  STK11: {
    fr: "STK11 contrôle la polarité et l'énergie cellulaire. Mutations causent le syndrome de Peutz-Jeghers (polypes hamartomateux + lentigines + risque tumoral large).",
    en: "STK11 controls cell polarity and energetics. Mutations cause Peutz-Jeghers syndrome (hamartomatous polyps + lentigines + broad cancer risk).",
    inheritance: "AD",
  },
  SMAD4: {
    fr: "SMAD4 transmet la voie TGF-β. Mutations causent une polypose juvénile et / ou la télangiectasie hémorragique héréditaire.",
    en: "SMAD4 transduces the TGF-β pathway. Mutations cause juvenile polyposis and/or hereditary haemorrhagic telangiectasia.",
    inheritance: "AD",
  },
  BMPR1A: {
    fr: "BMPR1A reçoit les signaux BMP. Mutations causent la polypose juvénile (polypes hamartomateux du tube digestif).",
    en: "BMPR1A receives BMP signalling. Mutations cause juvenile polyposis (hamartomatous polyps of the gut).",
    inheritance: "AD",
  },
  DICER1: {
    fr: "DICER1 produit les microARN. Mutations causent un syndrome tumoral pédiatrique (pleuropulmonaire, ovarien, thyroïdien).",
    en: "DICER1 produces microRNAs. Mutations cause a paediatric tumour syndrome (pleuropulmonary, ovarian, thyroid).",
    inheritance: "AD",
  },
  FH: {
    fr: "FH (fumarate hydratase) intervient dans le cycle de Krebs. Mutations causent une léiomyomatose cutanée et un cancer du rein héréditaire.",
    en: "FH (fumarate hydratase) acts in the Krebs cycle. Mutations cause hereditary leiomyomatosis and renal cell cancer.",
    inheritance: "AD",
  },
  SDHB: {
    fr: "SDHB compose le complexe II mitochondrial. Mutations causent paragangliomes / phéochromocytomes héréditaires (forme la plus à risque malin).",
    en: "SDHB makes up mitochondrial complex II. Mutations cause hereditary paraganglioma/pheochromocytoma (highest malignant-risk form).",
    inheritance: "AD",
  },
  SDHD: {
    fr: "SDHD partenaire de SDHB. Mutations causent paragangliomes héréditaires, expression dépendante du parent transmetteur (empreinte parentale).",
    en: "SDHD partners with SDHB. Mutations cause hereditary paragangliomas with parent-of-origin (imprinting) expression.",
    inheritance: "AD",
  },
  // === Hematology / coagulation ===
  ITGA2B: {
    fr: "ITGA2B forme l'intégrine plaquettaire αIIbβ3. Mutations causent la thrombasthénie de Glanzmann (saignements cutanéo-muqueux).",
    en: "ITGA2B makes platelet integrin αIIbβ3. Mutations cause Glanzmann thrombasthenia (mucocutaneous bleeding).",
    inheritance: "AR",
  },
  JAK2: {
    fr: "JAK2 transmet les signaux des récepteurs cytokines. La mutation V617F est typiquement somatique et cause des syndromes myéloprolifératifs (polyglobulie de Vaquez, thrombocytémie).",
    en: "JAK2 transduces cytokine receptor signals. The V617F mutation is typically somatic and causes myeloproliferative neoplasms (polycythemia vera, essential thrombocythemia).",
    inheritance: "somatic",
  },
  G6PD: {
    fr: "G6PD protège les globules rouges du stress oxydatif. Carence (liée à l'X) cause une anémie hémolytique déclenchée par certains aliments (fèves) ou médicaments.",
    en: "G6PD protects red blood cells from oxidative stress. Deficiency (X-linked) causes hemolytic anemia triggered by certain foods (favism) or drugs.",
    inheritance: "XL",
  },
  // === Pharmacogenomics ===
  TPMT: {
    fr: "TPMT métabolise les thiopurines (azathioprine, 6-MP). Variants ralentisseurs → toxicité hématologique sévère ; le génotype guide la dose.",
    en: "TPMT metabolises thiopurines (azathioprine, 6-MP). Slow-metabolism variants → severe haematological toxicity; genotype guides dosing.",
    inheritance: "AR",
  },
  DPYD: {
    fr: "DPYD est l'enzyme limitante du métabolisme du 5-fluorouracile et de la capécitabine. Variants déficients → toxicité sévère ; un test DPYD pré-traitement est recommandé.",
    en: "DPYD is the rate-limiting enzyme for 5-fluorouracil and capecitabine metabolism. Deficient variants → severe toxicity; pre-treatment DPYD testing is recommended.",
    inheritance: "AR",
  },
  NUDT15: {
    fr: "NUDT15 régule l'activation des thiopurines. Variants déficients (fréquents en Asie) → toxicité hématologique grave.",
    en: "NUDT15 regulates thiopurine activation. Deficient variants (frequent in Asia) → severe haematological toxicity.",
    inheritance: "AR",
  },
  UGT1A1: {
    fr: "UGT1A1 conjugue la bilirubine. Variants ralentisseurs causent le syndrome de Gilbert (ictère bénin) et augmentent la toxicité de l'irinotécan.",
    en: "UGT1A1 conjugates bilirubin. Slow variants cause Gilbert syndrome (benign jaundice) and raise irinotecan toxicity.",
    inheritance: "AR",
  },
  CYP2C19: {
    fr: "CYP2C19 métabolise clopidogrel, IPP, certains antidépresseurs. Le statut métaboliseur (lent à ultrarapide) modifie l'efficacité et la toxicité.",
    en: "CYP2C19 metabolises clopidogrel, PPIs, some antidepressants. Metaboliser status (poor to ultrarapid) shifts efficacy and toxicity.",
    inheritance: "AD",
  },
  CYP2D6: {
    fr: "CYP2D6 métabolise ~25 % des médicaments courants (codéine, antidépresseurs, tamoxifène). Statut métaboliseur très variable selon la population.",
    en: "CYP2D6 metabolises ~25 % of common drugs (codeine, antidepressants, tamoxifen). Metaboliser status varies widely across populations.",
    inheritance: "AD",
  },
  VKORC1: {
    fr: "VKORC1 cible de la warfarine. Variants régulateurs modifient la dose efficace d'anticoagulant.",
    en: "VKORC1 is the warfarin target. Regulatory variants change the effective anticoagulant dose.",
    inheritance: "AD",
  },
  // === Vision / hearing ===
  MYO7A: {
    fr: "MYO7A maintient les cellules ciliées de l'oreille interne et les photorécepteurs. Mutations causent le syndrome d'Usher de type 1 (surdité profonde + rétinite).",
    en: "MYO7A maintains inner-ear hair cells and photoreceptors. Mutations cause Usher syndrome type 1 (profound deafness + retinitis).",
    inheritance: "AR",
  },
  CDH23: {
    fr: "CDH23 connecte les cils des cellules sensorielles auditives. Mutations causent le syndrome d'Usher type 1D et des surdités non-syndromiques.",
    en: "CDH23 links sensory hair cell stereocilia. Mutations cause Usher syndrome type 1D and non-syndromic deafness.",
    inheritance: "AR",
  },
  SLC26A4: {
    fr: "SLC26A4 (pendrine) transporte des anions dans l'oreille interne et la thyroïde. Mutations causent le syndrome de Pendred (surdité + goitre).",
    en: "SLC26A4 (pendrin) transports anions in the inner ear and thyroid. Mutations cause Pendred syndrome (deafness + goitre).",
    inheritance: "AR",
  },
  RPE65: {
    fr: "RPE65 régénère le pigment visuel rétinien. Mutations causent une dystrophie rétinienne précoce (amaurose de Leber) — première maladie traitable par thérapie génique (voretigène).",
    en: "RPE65 regenerates retinal visual pigment. Mutations cause early-onset retinal dystrophy (Leber amaurosis) — first disease treatable by gene therapy (voretigene).",
    inheritance: "AR",
  },
  CEP290: {
    fr: "CEP290 organise le cil primaire. Mutations causent un éventail allant de l'amaurose de Leber au syndrome de Joubert ou de Meckel.",
    en: "CEP290 organises the primary cilium. Mutations cause a spectrum from Leber amaurosis to Joubert and Meckel syndromes.",
    inheritance: "AR",
  },
  EYS: {
    fr: "EYS est l'un des plus grands gènes humains, exprimé dans la rétine. Mutations causent une rétinite pigmentaire (perte de vision périphérique progressive).",
    en: "EYS is one of the largest human genes, expressed in the retina. Mutations cause retinitis pigmentosa (progressive peripheral vision loss).",
    inheritance: "AR",
  },
  // === Connective tissue / muscle ===
  COL3A1: {
    fr: "COL3A1 fait le collagène de type III des artères et organes creux. Mutations causent le syndrome d'Ehlers-Danlos vasculaire (rupture artérielle, perforation digestive).",
    en: "COL3A1 makes type III collagen in arteries and hollow organs. Mutations cause vascular Ehlers-Danlos syndrome (arterial rupture, intestinal perforation).",
    inheritance: "AD",
  },
  COL4A5: {
    fr: "COL4A5 forme la membrane basale glomérulaire. Mutations (liées à l'X) causent le syndrome d'Alport (insuffisance rénale + surdité).",
    en: "COL4A5 makes the glomerular basement membrane. X-linked mutations cause Alport syndrome (kidney failure + deafness).",
    inheritance: "XL",
  },
  COL4A3: {
    fr: "COL4A3 partenaire de COL4A5. Mutations causent un syndrome d'Alport autosomique (insuffisance rénale + surdité).",
    en: "COL4A3 partners with COL4A5. Mutations cause autosomal Alport syndrome (kidney failure + deafness).",
    inheritance: "AD",
  },
  COL2A1: {
    fr: "COL2A1 fait le collagène cartilagineux. Mutations causent le syndrome de Stickler et diverses chondrodysplasies (anomalies oculaires, ORL et squelettiques).",
    en: "COL2A1 makes cartilage collagen. Mutations cause Stickler syndrome and various chondrodysplasias (eye, ENT and skeletal anomalies).",
    inheritance: "AD",
  },
  COL7A1: {
    fr: "COL7A1 ancre l'épiderme au derme. Mutations causent l'épidermolyse bulleuse dystrophique (peau extrêmement fragile).",
    en: "COL7A1 anchors epidermis to dermis. Mutations cause dystrophic epidermolysis bullosa (extremely fragile skin).",
    inheritance: "AR",
  },
  DYSF: {
    fr: "DYSF (dysferline) répare la membrane musculaire. Mutations causent une dystrophie musculaire des ceintures (LGMD2B).",
    en: "DYSF (dysferlin) repairs muscle membrane. Mutations cause limb-girdle muscular dystrophy (LGMD2B).",
    inheritance: "AR",
  },
  CAPN3: {
    fr: "CAPN3 (calpaïne-3) est une protéase musculaire. Mutations causent la dystrophie musculaire des ceintures LGMD2A.",
    en: "CAPN3 (calpain-3) is a muscle protease. Mutations cause limb-girdle muscular dystrophy LGMD2A.",
    inheritance: "AR",
  },
  LAMA2: {
    fr: "LAMA2 (mérosine) ancre la fibre musculaire à la matrice. Mutations causent une myopathie congénitale grave avec atteinte neurologique.",
    en: "LAMA2 (merosin) anchors muscle fibres to the matrix. Mutations cause severe congenital muscular dystrophy with brain involvement.",
    inheritance: "AR",
  },
  NEB: {
    fr: "NEB (nébuline) règle la longueur des sarcomères. Mutations cause la myopathie à némalines (faiblesse musculaire généralisée).",
    en: "NEB (nebulin) regulates sarcomere length. Mutations cause nemaline myopathy (generalised muscle weakness).",
    inheritance: "AR",
  },
  // === Metabolism / lysosomal ===
  IDUA: {
    fr: "IDUA dégrade les glycosaminoglycanes. Sa carence cause la mucopolysaccharidose de type I (Hurler / Scheie).",
    en: "IDUA breaks down glycosaminoglycans. Its deficiency causes mucopolysaccharidosis type I (Hurler/Scheie).",
    inheritance: "AR",
  },
  IDS: {
    fr: "IDS (iduronate sulfatase) dégrade les glycosaminoglycanes. Sa carence (liée à l'X) cause la mucopolysaccharidose II (syndrome de Hunter).",
    en: "IDS (iduronate sulfatase) breaks down glycosaminoglycans. X-linked deficiency causes mucopolysaccharidosis II (Hunter syndrome).",
    inheritance: "XL",
  },
  NPC1: {
    fr: "NPC1 transporte le cholestérol intracellulaire. Sa carence cause la maladie de Niemann-Pick C (atteinte neuro-hépatique progressive).",
    en: "NPC1 transports intracellular cholesterol. Its deficiency causes Niemann-Pick C disease (progressive neuro-hepatic involvement).",
    inheritance: "AR",
  },
  GCDH: {
    fr: "GCDH dégrade certains acides aminés. Sa carence cause l'acidurie glutarique de type 1 (encéphalopathie aiguë de l'enfant).",
    en: "GCDH breaks down certain amino acids. Its deficiency causes glutaric aciduria type 1 (childhood acute encephalopathy).",
    inheritance: "AR",
  },
  MMUT: {
    fr: "MMUT métabolise le méthylmalonyl-CoA (vitamine B12). Sa carence cause une acidurie méthylmalonique (encéphalopathie métabolique néonatale).",
    en: "MMUT metabolises methylmalonyl-CoA (vitamin B12). Deficiency causes methylmalonic aciduria (neonatal metabolic encephalopathy).",
    inheritance: "AR",
  },
  ALPL: {
    fr: "ALPL (phosphatase alcaline) minéralise l'os. Sa carence cause l'hypophosphatasie (fragilité osseuse, dents qui tombent précocement).",
    en: "ALPL (alkaline phosphatase) mineralises bone. Deficiency causes hypophosphatasia (bone fragility, premature tooth loss).",
    inheritance: "AR",
  },
  PHEX: {
    fr: "PHEX régule le métabolisme du phosphate. Mutations (liées à l'X) causent le rachitisme hypophosphatémique vitamino-résistant.",
    en: "PHEX regulates phosphate metabolism. X-linked mutations cause vitamin-D-resistant hypophosphatemic rickets.",
    inheritance: "XL",
  },
  SLC12A3: {
    fr: "SLC12A3 réabsorbe le sodium dans le tube distal rénal. Mutations causent le syndrome de Gitelman (hypokaliémie + hypomagnésémie).",
    en: "SLC12A3 reabsorbs sodium in the distal kidney tubule. Mutations cause Gitelman syndrome (hypokalaemia + hypomagnesaemia).",
    inheritance: "AR",
  },
  SERPINA1: {
    fr: "SERPINA1 produit l'alpha-1 antitrypsine (protection pulmonaire). Variants déficients (Z, S) → emphysème précoce + atteinte hépatique.",
    en: "SERPINA1 produces alpha-1 antitrypsin (lung protection). Deficient variants (Z, S) → early emphysema + liver involvement.",
    inheritance: "AR",
  },
  // === Cardio (additional) ===
  ACVRL1: {
    fr: "ACVRL1 reçoit la signalisation TGF-β dans l'endothélium. Mutations causent la télangiectasie hémorragique héréditaire de type 2 (épistaxis, malformations vasculaires).",
    en: "ACVRL1 receives TGF-β signalling in endothelium. Mutations cause hereditary haemorrhagic telangiectasia type 2 (epistaxis, vascular malformations).",
    inheritance: "AD",
  },
  ENG: {
    fr: "ENG (endogline) partenaire d'ACVRL1. Mutations causent la télangiectasie hémorragique héréditaire de type 1.",
    en: "ENG (endoglin) partners with ACVRL1. Mutations cause hereditary haemorrhagic telangiectasia type 1.",
    inheritance: "AD",
  },
  DSP: {
    fr: "DSP (desmoplakine) attache les desmosomes cardiaques. Mutations causent une cardiomyopathie arythmogène (souvent associée à des laines crépues et une kératodermie).",
    en: "DSP (desmoplakin) anchors cardiac desmosomes. Mutations cause arrhythmogenic cardiomyopathy (often with woolly hair and keratoderma).",
    inheritance: "AD",
  },
  // === Endocrine ===
  ABCC8: {
    fr: "ABCC8 (SUR1) régule la sécrétion d'insuline. Mutations gain-de-fonction → diabète néonatal ; perte-de-fonction → hyperinsulinisme congénital.",
    en: "ABCC8 (SUR1) regulates insulin secretion. Gain-of-function mutations → neonatal diabetes; loss-of-function → congenital hyperinsulinism.",
    inheritance: "AD",
  },
  // === Neuro / epilepsy ===
  KCNQ2: {
    fr: "KCNQ2 contrôle l'excitabilité neuronale. Mutations causent des encéphalopathies épileptiques précoces.",
    en: "KCNQ2 controls neuronal excitability. Mutations cause early-onset epileptic encephalopathies.",
    inheritance: "AD",
  },
  SCN2A: {
    fr: "SCN2A code un canal sodium neuronal. Mutations responsables d'épilepsies infantiles et de troubles du neurodéveloppement.",
    en: "SCN2A encodes a neuronal sodium channel. Mutations cause infantile epilepsies and neurodevelopmental disorders.",
    inheritance: "AD",
  },
  // === Ciliopathies / pulmonary ===
  DNAH5: {
    fr: "DNAH5 est une dynéine ciliaire. Mutations causent la dyskinésie ciliaire primitive (infections respiratoires chroniques, situs inversus possible).",
    en: "DNAH5 is a ciliary dynein. Mutations cause primary ciliary dyskinesia (chronic respiratory infections, possible situs inversus).",
    inheritance: "AR",
  },
  CFTR_NOTE: {
    fr: "(voir CFTR plus haut)",
    en: "(see CFTR above)",
    inheritance: "AR",
  },
  // === Other ===
  FANCA: {
    fr: "FANCA participe à la réparation des pontages d'ADN. Deux copies mutées causent l'anémie de Fanconi (insuffisance médullaire + risque tumoral).",
    en: "FANCA contributes to DNA crosslink repair. Two mutated copies cause Fanconi anemia (marrow failure + tumour risk).",
    inheritance: "AR",
  },
  ALMS1: {
    fr: "ALMS1 est lié au cil primaire. Mutations causent le syndrome d'Alström (cécité + surdité + obésité + cardiomyopathie).",
    en: "ALMS1 is linked to the primary cilium. Mutations cause Alström syndrome (blindness + deafness + obesity + cardiomyopathy).",
    inheritance: "AR",
  },
  VPS13B: {
    fr: "VPS13B intervient dans le trafic vésiculaire. Mutations causent le syndrome de Cohen (déficience intellectuelle + obésité tronculaire + neutropénie).",
    en: "VPS13B is involved in vesicular trafficking. Mutations cause Cohen syndrome (intellectual disability + truncal obesity + neutropenia).",
    inheritance: "AR",
  },
  LZTR1: {
    fr: "LZTR1 régule la voie RAS. Mutations causent le syndrome de Noonan (RASopathie : cardiopathie congénitale, petite taille, faciès caractéristique).",
    en: "LZTR1 regulates the RAS pathway. Mutations cause Noonan syndrome (RASopathy: congenital heart disease, short stature, distinct facies).",
    inheritance: "AD",
  },
  PTPN11: {
    fr: "PTPN11 active la voie RAS. Mutations première cause du syndrome de Noonan classique.",
    en: "PTPN11 activates the RAS pathway. Mutations are the leading cause of classic Noonan syndrome.",
    inheritance: "AD",
  },
  CRB1: {
    fr: "CRB1 organise la rétine. Mutations causent une amaurose de Leber et des rétinites pigmentaires précoces.",
    en: "CRB1 organises the retina. Mutations cause Leber amaurosis and early-onset retinitis pigmentosa.",
    inheritance: "AR",
  },
  NOD2: {
    fr: "NOD2 capte les composants bactériens. Variants augmentent le risque de maladie de Crohn (granulomatose intestinale).",
    en: "NOD2 senses bacterial components. Variants raise Crohn disease risk (granulomatous bowel inflammation).",
    inheritance: "AD",
  },
  PRSS1: {
    fr: "PRSS1 (trypsinogène cationique) intervient dans la digestion pancréatique. Variants gain-de-fonction causent la pancréatite chronique héréditaire.",
    en: "PRSS1 (cationic trypsinogen) drives pancreatic digestion. Gain-of-function variants cause hereditary chronic pancreatitis.",
    inheritance: "AD",
  },
};

const CONDITION_PRETTY: Record<string, { fr: string; en: string }> = {
  "Inborn genetic diseases": {
    fr: "maladie génétique héréditaire (catégorie ClinVar générique)",
    en: "inherited genetic disease (generic ClinVar category)",
  },
  "not provided": {
    fr: "condition non précisée par les soumetteurs ClinVar",
    en: "condition not specified by ClinVar submitters",
  },
  "not specified": {
    fr: "condition non précisée par les soumetteurs ClinVar",
    en: "condition not specified by ClinVar submitters",
  },
  "Hereditary cancer-predisposing syndrome": {
    fr: "syndrome héréditaire de prédisposition au cancer",
    en: "hereditary cancer predisposition syndrome",
  },
  "Cardiovascular phenotype": {
    fr: "phénotype cardiovasculaire (cardiomyopathie, troubles du rythme, etc.)",
    en: "cardiovascular phenotype (cardiomyopathy, arrhythmia, etc.)",
  },
};

export function prettyCondition(condition: string, lang: Lang): string {
  const hit = CONDITION_PRETTY[condition];
  if (hit) return hit[lang];
  return condition;
}

/**
 * Heuristic inheritance inference when the gene is not in our curated table.
 * Looks at common keywords in the condition string.
 */
function inferInheritance(condition: string): Inheritance {
  const c = condition.toLowerCase();
  if (/x-linked|liée à l'?x/.test(c)) return "XL";
  if (/autosomal recessive|autosomique récessif/.test(c)) return "AR";
  if (/autosomal dominant|autosomique dominant/.test(c)) return "AD";
  if (/mitochondri/.test(c)) return "mito";
  if (/hereditary cancer|li-fraumeni|lynch|hboc/.test(c)) return "AD";
  return "unknown";
}

function explainZygosity(
  inheritance: Inheritance,
  isHom: boolean,
  lang: Lang,
): string {
  if (lang === "fr") {
    switch (inheritance) {
      case "AR":
        return isHom
          ? "Vos deux copies portent le variant — c'est cohérent avec une expression de la maladie si la variante est réellement pathogène. Si vous n'avez aucun symptôme connu, l'hypothèse d'un faux positif sur puce est sérieuse."
          : "Vous portez une seule copie — vous êtes vraisemblablement asymptomatique (porteur sain). Information pertinente pour un projet d'enfant : si l'autre parent porte aussi une copie, l'enfant a 25 % de risque d'être atteint.";
      case "AD":
        return isHom
          ? "Vos deux copies portent le variant — situation rare et souvent associée à une forme plus sévère ou plus précoce que la forme hétérozygote habituelle."
          : "Une seule copie suffit pour exprimer la condition, mais la pénétrance (probabilité d'expression) varie selon le gène et l'individu. Beaucoup de porteurs ne développent jamais la maladie.";
      case "XL":
        return isHom
          ? "Deux copies mutées — selon votre sexe biologique, l'expression diffère : chez l'homme (XY) une copie suffit déjà, chez la femme (XX) deux copies se rapprochent du tableau masculin."
          : "Une copie mutée — chez la femme (XX) souvent porteuse asymptomatique, chez l'homme (XY) cela correspond à l'allèle unique sur l'X et donc à une expression complète.";
      case "mito":
        return "L'hérédité mitochondriale est strictement maternelle et l'expression dépend du taux d'hétéroplasmie (proportion d'ADN mitochondrial muté), non lisible sur une puce SNP standard.";
      case "somatic":
        return "Variant typiquement somatique (acquis dans une tumeur) — sa détection germinale est inhabituelle.";
      default:
        return isHom
          ? "Vos deux copies portent le variant. Le mode d'hérédité n'est pas clair pour ce variant — l'interprétation dépend du gène."
          : "Vous portez une seule copie. Le mode d'hérédité n'est pas clair pour ce variant — l'interprétation dépend du gène.";
    }
  }
  switch (inheritance) {
    case "AR":
      return isHom
        ? "Both of your copies carry the variant — consistent with disease expression if the variant is truly pathogenic. If you have no known symptoms, false-positive on a SNP chip is a serious hypothesis."
        : "You carry one copy — you are most likely asymptomatic (silent carrier). Relevant for family planning: if your partner also carries a copy, a child has a 25 % chance of being affected.";
    case "AD":
      return isHom
        ? "Both of your copies carry the variant — rare situation, often linked to a more severe or earlier-onset form than the usual heterozygous case."
        : "One copy is enough to express the condition, but penetrance (likelihood of expression) varies by gene and individual. Many carriers never develop the disease.";
    case "XL":
      return isHom
        ? "Two mutated copies — expression depends on biological sex: in males (XY) one copy already suffices, in females (XX) two copies approach the male phenotype."
        : "One mutated copy — in females (XX) often a silent carrier, in males (XY) this is the single X allele and corresponds to full expression.";
    case "mito":
      return "Mitochondrial inheritance is strictly maternal and expression depends on heteroplasmy level (proportion of mutated mtDNA), which is not readable on a standard SNP chip.";
    case "somatic":
      return "Variant typically somatic (acquired within a tumour) — germline detection is unusual.";
    default:
      return isHom
        ? "Both of your copies carry the variant. The inheritance pattern is unclear for this variant — interpretation depends on the gene."
        : "You carry one copy. The inheritance pattern is unclear for this variant — interpretation depends on the gene.";
  }
}

function caveat(lang: Lang): string {
  if (lang === "fr") {
    return "À retenir : votre fichier provient d'une puce SNP (~600 000–700 000 positions ciblées). Une variante rare détectée positive ici peut être un artefact technique, surtout en l'absence de symptômes ou d'antécédents familiaux. Seul un séquençage clinique (orienté gène ou exome) permet une confirmation. À partager avec un médecin ou un généticien si vous avez des symptômes évocateurs ou un projet d'enfant.";
  }
  return "Worth knowing: your file comes from a SNP chip (~600,000–700,000 targeted positions). A rare positive variant here can be a technical artefact, especially without symptoms or family history. Only clinical sequencing (gene-targeted or exome) provides confirmation. Worth raising with a doctor or geneticist if you have suggestive symptoms or are planning a child.";
}

function whatPart(
  gene: string,
  condition: string,
  lang: Lang,
): { what: string; inheritance: Inheritance } {
  const lore = GENE_LORE[gene];
  const pretty = prettyCondition(condition, lang);
  if (lore) {
    return { what: lore[lang], inheritance: lore.inheritance };
  }
  // Templated fallback when the gene is not in our curated table.
  const inheritance = inferInheritance(condition);
  if (lang === "fr") {
    return {
      what: `Le gène ${gene} est associé à : ${pretty}. Une description détaillée de sa fonction n'est pas encore intégrée à DNAI ; consultez OMIM, GeneReviews ou Orphanet pour la biologie complète.`,
      inheritance,
    };
  }
  return {
    what: `The ${gene} gene is associated with: ${pretty}. A detailed description of its function is not yet curated in DNAI; see OMIM, GeneReviews or Orphanet for the full biology.`,
    inheritance,
  };
}

export function explainClinVarFinding(
  f: ClinVarFinding,
  lang: Lang,
): ClinVarExplanation {
  const isHom = f.zygosity === "alt/alt";
  const condition =
    lang === "en"
      ? f.entry.condition_en ?? f.entry.condition
      : f.entry.condition;
  const { what, inheritance } = whatPart(f.entry.gene, condition, lang);
  return {
    what,
    zygosity: explainZygosity(inheritance, isHom, lang),
    caveat: caveat(lang),
  };
}

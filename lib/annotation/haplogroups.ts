import type { Base, GenotypeMap, HaplogroupBranch, HaplogroupResult } from "../types";
import { isNoCall } from "../types";

// Compact Y haplogroup tree (ISOGG-based major branches).
// Each node: id, parent, SNP + derived allele. Walk root→deepest match.
type Node = { id: string; parent: string | null; rsid: string; derived: Base; ancestral: Base; description: string; migration: string };

const Y_TREE: Node[] = [
  { id: "BT", parent: null, rsid: "rs2032658", derived: "T", ancestral: "C", description: "Homme moderne hors-Afrique basal.", migration: "Afrique → reste du monde, il y a ~130k ans." },
  { id: "CT", parent: "BT", rsid: "rs2032673", derived: "T", ancestral: "C", description: "Branche hors-Afrique.", migration: "Sortie d'Afrique ~70k ans." },
  { id: "F", parent: "CT", rsid: "rs2032626", derived: "A", ancestral: "G", description: "Racine de la majorité des hommes eurasiens.", migration: "Moyen-Orient → Eurasie." },
  { id: "IJK", parent: "F", rsid: "rs9785659", derived: "T", ancestral: "C", description: "Eurasie occidentale et centrale.", migration: "Anatolie/Caucase ~50k ans." },
  { id: "K", parent: "IJK", rsid: "rs2032624", derived: "T", ancestral: "C", description: "Eurasie orientale et Océanie.", migration: "Asie centrale → Est/Océanie." },
  { id: "IJ", parent: "IJK", rsid: "rs9306846", derived: "G", ancestral: "A", description: "Europe + Moyen-Orient.", migration: "Paléolithique européen." },
  { id: "I", parent: "IJ", rsid: "rs17250535", derived: "A", ancestral: "T", description: "Chasseurs-cueilleurs européens.", migration: "Refuges glaciaires européens." },
  { id: "I1-M253", parent: "I", rsid: "rs17316771", derived: "A", ancestral: "C", description: "Scandinavie / nord-Europe.", migration: "Nord-Europe post-glaciaire." },
  { id: "I2-M438", parent: "I", rsid: "rs17307294", derived: "T", ancestral: "G", description: "Balkans / Sardaigne / Europe paléolithique.", migration: "Refuge balkanique ~20k ans." },
  { id: "J", parent: "IJ", rsid: "rs13447352", derived: "G", ancestral: "A", description: "Moyen-Orient, Caucase, Méditerranée.", migration: "Expansion néolithique." },
  { id: "J1-M267", parent: "J", rsid: "rs13447354", derived: "T", ancestral: "C", description: "Péninsule arabique, Caucase.", migration: "Néolithique sémitique." },
  { id: "J2-M172", parent: "J", rsid: "rs13447358", derived: "G", ancestral: "T", description: "Anatolie, Méditerranée.", migration: "Néolithique anatolien." },
  { id: "NO", parent: "K", rsid: "rs17250845", derived: "A", ancestral: "C", description: "Nord-Eurasie + Asie de l'Est.", migration: "Asie centrale → Nord/Est." },
  { id: "N-M231", parent: "NO", rsid: "rs17269396", derived: "A", ancestral: "T", description: "Nord-Eurasie (Ouralienne).", migration: "Sibérie → Finlande/Baltique." },
  { id: "O-M175", parent: "NO", rsid: "rs17275970", derived: "G", ancestral: "T", description: "Asie de l'Est.", migration: "Néolithique est-asiatique." },
  { id: "P", parent: "K", rsid: "rs17270961", derived: "C", ancestral: "T", description: "Ancêtre de Q et R.", migration: "Asie centrale." },
  { id: "Q-M242", parent: "P", rsid: "rs8179021", derived: "T", ancestral: "C", description: "Amérindiens + Sibérie.", migration: "Béringie → Amériques ~15k ans." },
  { id: "R", parent: "P", rsid: "rs2032658", derived: "A", ancestral: "G", description: "Eurasie occidentale.", migration: "Steppes pontiques." },
  { id: "R1a-M420", parent: "R", rsid: "rs17250687", derived: "A", ancestral: "G", description: "Europe de l'Est, Asie du Sud.", migration: "Indo-Européens orientaux." },
  { id: "R1b-M269", parent: "R", rsid: "rs9786076", derived: "C", ancestral: "T", description: "Europe de l'Ouest (la plus fréquente).", migration: "Yamnaya → Europe occidentale ~4500 ans." },
  { id: "E", parent: "CT", rsid: "rs2032657", derived: "C", ancestral: "A", description: "Afrique + Méditerranée.", migration: "Afrique → Moyen-Orient → Méditerranée." },
  { id: "E1b1b-M215", parent: "E", rsid: "rs17250547", derived: "A", ancestral: "G", description: "Afrique du Nord, Méditerranée, Corne de l'Afrique.", migration: "Néolithique nord-africain." },
  { id: "G-M201", parent: "F", rsid: "rs13447355", derived: "A", ancestral: "G", description: "Caucase, Méditerranée.", migration: "Néolithique caucasien (Ötzi). " },
];

// Compact mtDNA phylotree — major haplogroups by a few diagnostic SNVs.
// Since 23andMe/MyHeritage chips include very few chrM positions, this is
// often limited. We still try.
const MT_TREE: Node[] = [
  { id: "L", parent: null, rsid: "MT73", derived: "G", ancestral: "A", description: "Racine africaine ancestrale.", migration: "Afrique subsaharienne." },
  { id: "M", parent: "L", rsid: "MT10400", derived: "T", ancestral: "C", description: "Branche asiatique / australe.", migration: "Asie du Sud / Océanie." },
  { id: "N", parent: "L", rsid: "MT10398", derived: "G", ancestral: "A", description: "Branche eurasienne.", migration: "Sortie d'Afrique." },
  { id: "R", parent: "N", rsid: "MT12705", derived: "T", ancestral: "C", description: "Racine eurasienne.", migration: "Asie du Sud-Ouest." },
  { id: "H", parent: "R", rsid: "MT7028", derived: "C", ancestral: "T", description: "Europe (~40% des européens).", migration: "Europe post-glaciaire." },
  { id: "V", parent: "R", rsid: "MT4580", derived: "A", ancestral: "G", description: "Ibérie / Sâmes.", migration: "Refuge franco-cantabrique." },
  { id: "J", parent: "R", rsid: "MT13708", derived: "A", ancestral: "G", description: "Europe / Moyen-Orient.", migration: "Néolithique." },
  { id: "T", parent: "R", rsid: "MT4917", derived: "G", ancestral: "A", description: "Europe / Méditerranée.", migration: "Néolithique proche-oriental." },
  { id: "U", parent: "R", rsid: "MT12308", derived: "G", ancestral: "A", description: "Chasseurs-cueilleurs européens.", migration: "Paléolithique européen." },
  { id: "K", parent: "U", rsid: "MT9055", derived: "A", ancestral: "G", description: "Europe / Ashkénaze.", migration: "Europe du Sud-Est." },
  { id: "W", parent: "N", rsid: "MT11947", derived: "G", ancestral: "A", description: "Asie de l'Ouest, Europe de l'Est.", migration: "Eurasie occidentale." },
  { id: "X", parent: "N", rsid: "MT6221", derived: "C", ancestral: "T", description: "Europe / Amérindien (rare).", migration: "Moyen-Orient → NA paléolithique." },
  { id: "A", parent: "N", rsid: "MT4824", derived: "G", ancestral: "A", description: "Amérindien / Asie du Nord.", migration: "Béringie." },
  { id: "B", parent: "R", rsid: "MT8281", derived: "T", ancestral: "C", description: "Asie du Sud-Est, Amérindien.", migration: "Pacifique." },
  { id: "C", parent: "M", rsid: "MT14318", derived: "C", ancestral: "T", description: "Sibérie, Amérindien.", migration: "Nord-est asiatique." },
  { id: "D", parent: "M", rsid: "MT5178", derived: "A", ancestral: "C", description: "Asie de l'Est, Amérindien.", migration: "Asie du Nord-Est." },
];

function isDerived(g: { a1: Base; a2: Base }, derived: Base): boolean {
  // For haploid calls (Y, mt), a1 should equal a2; accept either.
  return g.a1 === derived || g.a2 === derived;
}

function walk(tree: Node[], genotypes: GenotypeMap): { deepest: Node | null; path: Node[] } {
  const children = new Map<string | null, Node[]>();
  for (const n of tree) {
    const list = children.get(n.parent) ?? [];
    list.push(n);
    children.set(n.parent, list);
  }
  const path: Node[] = [];
  let current: string | null = null;
  let deepest: Node | null = null;
  // BFS with greedy descent
  for (let depth = 0; depth < 20; depth++) {
    const kids: Node[] = children.get(current) ?? [];
    let matched: Node | null = null;
    for (const kid of kids) {
      const g = genotypes.get(kid.rsid);
      if (!g || isNoCall(g)) continue;
      if (isDerived(g, kid.derived)) {
        matched = kid;
        break;
      }
    }
    if (!matched) break;
    path.push(matched);
    deepest = matched;
    current = matched.id;
  }
  return { deepest, path };
}

function toBranches(path: Node[]): HaplogroupBranch[] {
  return path.map((n, i) => ({ id: n.id, depth: i, rsid: n.rsid, derived: n.derived }));
}

function hasAnyChrSnp(genotypes: GenotypeMap, tree: Node[]): boolean {
  return tree.some((n) => {
    const g = genotypes.get(n.rsid);
    return g !== undefined && !isNoCall(g);
  });
}

export function computeYHaplogroup(genotypes: GenotypeMap): HaplogroupResult {
  if (!hasAnyChrSnp(genotypes, Y_TREE)) {
    return { available: false, assigned: "—", path: [], description: "Aucune donnée chromosome Y (échantillon féminin ou puce sans couverture Y).", migration: "" };
  }
  const { deepest, path } = walk(Y_TREE, genotypes);
  if (!deepest) {
    return { available: true, assigned: "indéterminé", path: [], description: "Marqueurs Y insuffisants pour descendre l'arbre.", migration: "" };
  }
  return {
    available: true,
    assigned: deepest.id,
    path: toBranches(path),
    description: deepest.description,
    migration: deepest.migration,
  };
}

export function computeMtHaplogroup(genotypes: GenotypeMap): HaplogroupResult {
  if (!hasAnyChrSnp(genotypes, MT_TREE)) {
    return { available: false, assigned: "—", path: [], description: "Aucune donnée mitochondriale (couverture chrM absente).", migration: "" };
  }
  const { deepest, path } = walk(MT_TREE, genotypes);
  if (!deepest) {
    return { available: true, assigned: "indéterminé", path: [], description: "Marqueurs mt insuffisants pour résoudre la lignée maternelle.", migration: "" };
  }
  return {
    available: true,
    assigned: deepest.id,
    path: toBranches(path),
    description: deepest.description,
    migration: deepest.migration,
  };
}

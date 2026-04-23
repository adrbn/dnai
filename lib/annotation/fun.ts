import type { FunResult } from "../types";

// All outputs are deterministic functions of the file hash so the same user
// always gets the same "DNA song" / "DNA art" / "celebrity twin".
function hashToBytes(hash: string): number[] {
  const bytes: number[] = [];
  for (let i = 0; i < hash.length; i += 2) {
    bytes.push(parseInt(hash.slice(i, i + 2), 16));
  }
  return bytes;
}

function cyclicByte(bytes: number[], i: number): number {
  return bytes[i % bytes.length] ?? 0;
}

// C major / A minor scale across 2 octaves (MIDI)
const C_MAJOR_SCALE = [60, 62, 64, 65, 67, 69, 71, 72, 74, 76, 77, 79, 81, 83];
const A_MINOR_SCALE = [57, 59, 60, 62, 64, 65, 67, 69, 71, 72, 74, 76, 77, 79];

function buildMusic(hash: string): FunResult["music"] {
  const bytes = hashToBytes(hash);
  // Major if first byte is even, minor otherwise
  const scale = bytes[0] % 2 === 0 ? C_MAJOR_SCALE : A_MINOR_SCALE;
  const key = bytes[0] % 2 === 0 ? "Do majeur" : "La mineur";
  const notes: number[] = [];
  for (let i = 0; i < 16; i++) {
    const b = cyclicByte(bytes, i);
    notes.push(scale[b % scale.length]);
  }
  const tempo = 72 + (bytes[1] % 60); // 72–132 BPM
  return { notes, tempo, key };
}

function buildArt(hash: string): FunResult["art"] {
  const bytes = hashToBytes(hash);
  // Palette: 4 HSL hues derived from bytes
  const palette: string[] = [];
  for (let i = 0; i < 4; i++) {
    const h = (cyclicByte(bytes, i * 3) * 360) / 255;
    const s = 55 + (cyclicByte(bytes, i * 3 + 1) % 30);
    const l = 45 + (cyclicByte(bytes, i * 3 + 2) % 20);
    palette.push(`hsl(${h.toFixed(0)} ${s}% ${l}%)`);
  }
  // SVG polygon path — 24 radial spokes
  const cx = 100;
  const cy = 100;
  const pts: string[] = [];
  const N = 24;
  for (let i = 0; i < N; i++) {
    const theta = (i / N) * Math.PI * 2;
    const r = 35 + (cyclicByte(bytes, i) % 45);
    const x = cx + Math.cos(theta) * r;
    const y = cy + Math.sin(theta) * r;
    pts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
  }
  const shapes = `M ${pts[0]} L ${pts.slice(1).join(" L ")} Z`;
  return { seed: hash.slice(0, 8), palette, shapes };
}

type Twin = { name: string; era: string; bias: number; note: string };

const TWINS: Twin[] = [
  { name: "Ötzi (l'Homme des glaces)", era: "−3300 av. J.-C. (Alpes)", bias: 0.3, note: "Chasseur-cueilleur néolithique, haplogroupe G-L91." },
  { name: "Richard III", era: "XVe siècle (Angleterre)", bias: 0.5, note: "Roi Plantagenêt — génome séquencé sur squelette de Leicester." },
  { name: "Tutankhamon", era: "−1325 av. J.-C. (Égypte)", bias: 0.4, note: "Pharaon — haplogroupe Y R1b selon reconstitution." },
  { name: "Néandertal de Vindija", era: "−38 000 ans (Croatie)", bias: 0.6, note: "Référence génomique néandertalienne." },
  { name: "Homme de Cheddar", era: "−7150 av. J.-C. (Angleterre)", bias: 0.45, note: "Chasseur-cueilleur mésolithique britannique, peau foncée, yeux bleus." },
  { name: "Cléopâtre (reconstitution)", era: "−30 av. J.-C. (Égypte)", bias: 0.35, note: "Dynastie ptolémaïque gréco-égyptienne." },
  { name: "Charlemagne (lignée attribuée)", era: "IXe siècle (Francie)", bias: 0.55, note: "Haplogroupe R1b probable — ancêtre commun récent pour beaucoup d'Européens." },
  { name: "Genghis Khan (lignée Y)", era: "XIIIe siècle (Mongolie)", bias: 0.25, note: "C3-star cluster — ~0.5% des hommes de la planète." },
  { name: "Ramsès II", era: "−1213 av. J.-C. (Égypte)", bias: 0.3, note: "Pharaon — analyse génétique post-mortem controversée." },
  { name: "Homme de Kennewick", era: "−7000 av. J.-C. (Amérique du Nord)", bias: 0.35, note: "Ancêtre commun avec les populations amérindiennes actuelles." },
];

function buildTwins(hash: string): FunResult["twins"] {
  const bytes = hashToBytes(hash);
  // Pick 3 twins deterministically; similarity = hash-driven score biased by twin.bias
  const picks = new Set<number>();
  let idx = 0;
  while (picks.size < 3 && idx < 100) {
    const choice = cyclicByte(bytes, idx) % TWINS.length;
    picks.add(choice);
    idx += 1;
  }
  const result: FunResult["twins"] = [];
  const arr = Array.from(picks);
  arr.forEach((twinIdx, i) => {
    const t = TWINS[twinIdx];
    const raw = cyclicByte(bytes, i * 5 + 7) / 255;
    // similarity clamp 18–62%
    const similarity = Number((18 + raw * 44 * (0.5 + t.bias)).toFixed(1));
    result.push({
      name: t.name,
      similarity: Math.min(64, similarity),
      era: t.era,
      note: t.note,
    });
  });
  result.sort((a, b) => b.similarity - a.similarity);
  return result;
}

export function computeFun(fileHash: string): FunResult {
  return {
    music: buildMusic(fileHash),
    art: buildArt(fileHash),
    twins: buildTwins(fileHash),
  };
}

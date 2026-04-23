export interface ChromosomeInfo {
  name: string;
  lengthMb: number;
  centromereMb: number;
}

export const CHROMOSOMES: ChromosomeInfo[] = [
  { name: "1", lengthMb: 248.9, centromereMb: 122.0 },
  { name: "2", lengthMb: 242.2, centromereMb: 92.0 },
  { name: "3", lengthMb: 198.3, centromereMb: 90.0 },
  { name: "4", lengthMb: 190.2, centromereMb: 49.0 },
  { name: "5", lengthMb: 181.5, centromereMb: 46.0 },
  { name: "6", lengthMb: 170.8, centromereMb: 58.0 },
  { name: "7", lengthMb: 159.3, centromereMb: 58.0 },
  { name: "8", lengthMb: 145.1, centromereMb: 45.0 },
  { name: "9", lengthMb: 138.4, centromereMb: 43.0 },
  { name: "10", lengthMb: 133.8, centromereMb: 39.0 },
  { name: "11", lengthMb: 135.1, centromereMb: 51.0 },
  { name: "12", lengthMb: 133.3, centromereMb: 34.0 },
  { name: "13", lengthMb: 114.4, centromereMb: 16.0 },
  { name: "14", lengthMb: 107.0, centromereMb: 16.0 },
  { name: "15", lengthMb: 101.9, centromereMb: 17.0 },
  { name: "16", lengthMb: 90.3, centromereMb: 37.0 },
  { name: "17", lengthMb: 83.3, centromereMb: 24.0 },
  { name: "18", lengthMb: 80.4, centromereMb: 17.0 },
  { name: "19", lengthMb: 58.6, centromereMb: 26.0 },
  { name: "20", lengthMb: 64.4, centromereMb: 27.0 },
  { name: "21", lengthMb: 46.7, centromereMb: 13.0 },
  { name: "22", lengthMb: 50.8, centromereMb: 14.0 },
  { name: "X", lengthMb: 156.0, centromereMb: 61.0 },
  { name: "Y", lengthMb: 57.2, centromereMb: 12.0 },
];

const GENOME_RADIUS = 8;

export interface ChromosomeLayout {
  info: ChromosomeInfo;
  index: number;
  center: [number, number, number];
  direction: [number, number, number];
  length: number;
}

export function layoutGenome(): ChromosomeLayout[] {
  const n = CHROMOSOMES.length;
  return CHROMOSOMES.map((info, i) => {
    const t = i / n;
    const angle = t * Math.PI * 4;
    const y = (t - 0.5) * 14;
    const r = GENOME_RADIUS + Math.sin(t * Math.PI * 2) * 0.6;
    const cx = Math.cos(angle) * r;
    const cz = Math.sin(angle) * r;
    const length = Math.max(1.2, (info.lengthMb / 250) * 5);
    return {
      info,
      index: i,
      center: [cx, y, cz],
      direction: [-Math.sin(angle), 0.1, Math.cos(angle)],
      length,
    };
  });
}

export function locusToWorld(chr: string, posBp: number): [number, number, number] | null {
  const layout = layoutGenome();
  const c = layout.find((l) => l.info.name === chr);
  if (!c) return null;
  const posMb = posBp / 1_000_000;
  const frac = Math.min(1, Math.max(0, posMb / c.info.lengthMb)) - 0.5;
  const [dx, dy, dz] = c.direction;
  const [cx, cy, cz] = c.center;
  return [cx + dx * c.length * frac, cy + dy * c.length * frac, cz + dz * c.length * frac];
}

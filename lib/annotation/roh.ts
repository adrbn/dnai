import type { GenotypeMap, PositionIndex, ROHResult, ROHSegment } from "../types";
import { isNoCall } from "../types";

// GRCh37 autosomal length (≈ 2.88 Gb) used to scale F_ROH.
const AUTOSOMAL_BP = 2_881_033_286;

// Run parameters (loose by consumer-array standards but reasonable for ~700k SNPs)
const MIN_SEG_BP = 1_000_000; // 1 Mb
const MIN_SEG_SNPS = 30;
const MAX_GAP_BP = 1_000_000; // break if adjacent SNPs > 1 Mb apart

function isAutosome(chr: string): boolean {
  const n = Number(chr);
  return Number.isInteger(n) && n >= 1 && n <= 22;
}

export function computeROH(
  genotypes: GenotypeMap,
  positions: PositionIndex,
): ROHResult {
  // Group homozygous calls by chromosome, sort by position
  type SnpCall = { pos: number; hom: boolean };
  const byChr: Map<string, SnpCall[]> = new Map();
  for (const [rsid, g] of genotypes) {
    const p = positions[rsid];
    if (!p || !isAutosome(p.chr)) continue;
    if (isNoCall(g)) continue;
    const hom = g.a1 === g.a2;
    let arr = byChr.get(p.chr);
    if (!arr) {
      arr = [];
      byChr.set(p.chr, arr);
    }
    arr.push({ pos: p.pos, hom });
  }

  const segments: ROHSegment[] = [];
  for (const [chr, snps] of byChr) {
    snps.sort((a, b) => a.pos - b.pos);
    let runStart = -1;
    let runEndPos = -1;
    let runSnps = 0;
    let lastPos = -1;

    const flush = () => {
      if (runStart < 0) return;
      const length = runEndPos - runStart;
      if (length >= MIN_SEG_BP && runSnps >= MIN_SEG_SNPS) {
        segments.push({
          chr,
          startPos: runStart,
          endPos: runEndPos,
          lengthBp: length,
          snpCount: runSnps,
        });
      }
      runStart = -1;
      runSnps = 0;
    };

    for (const { pos, hom } of snps) {
      if (!hom) {
        flush();
        lastPos = pos;
        continue;
      }
      if (runStart < 0) {
        runStart = pos;
        runEndPos = pos;
        runSnps = 1;
      } else {
        const gap = pos - lastPos;
        if (gap > MAX_GAP_BP) {
          flush();
          runStart = pos;
          runEndPos = pos;
          runSnps = 1;
        } else {
          runEndPos = pos;
          runSnps++;
        }
      }
      lastPos = pos;
    }
    flush();
  }

  const totalBp = segments.reduce((s, seg) => s + seg.lengthBp, 0);
  const fRoh = totalBp / AUTOSOMAL_BP;
  segments.sort((a, b) => b.lengthBp - a.lengthBp);

  return {
    segments,
    totalBp,
    totalSegments: segments.length,
    fRoh,
    autosomalBp: AUTOSOMAL_BP,
  };
}

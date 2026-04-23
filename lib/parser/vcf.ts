import { gunzipSync, strFromU8 } from "fflate";
import { isBase, normalize } from "../genotype";
import { DnaSource, GenotypeMap, NOCALL } from "../types";
import { DENSITY_BIN_SIZE, DensityMap, ParseOptions, ParseOutput, PositionIndex } from "./myheritage";

const GT_FIELD_RE = /[|/]/;

function detectBuild(headerLines: string[]): string {
  const blob = headerLines.join("\n").toLowerCase();
  if (blob.includes("grch38") || blob.includes("hg38") || blob.includes("assembly=grch38")) return "GRCh38";
  if (blob.includes("grch37") || blob.includes("hg19") || blob.includes("assembly=grch37")) return "GRCh37";
  return "GRCh38"; // modern WGS default
}

/**
 * Streaming-light VCF parser.
 *
 * Supports: single-sample VCFs (first sample column), plain or .vcf.gz files,
 * SNVs only (ref and alt must be single ACGT bases). Multi-allelic, indels,
 * structural variants, and non-PASS filters are skipped.
 *
 * The GT field is split on `|` or `/`, and mapped back to letters using REF/ALT.
 * Phased vs. unphased is irrelevant here: we only care about the pair.
 */
export async function parseVcfText(
  text: string,
  opts: ParseOptions = {},
): Promise<ParseOutput> {
  const normalized = text.replace(/\r\n/g, "\n");
  const lines = normalized.split("\n");
  const total = lines.length;

  const genotypes: GenotypeMap = new Map();
  const positions: PositionIndex = {};
  const density: DensityMap = {};
  let noCalls = 0;
  let kept = 0;

  // Header parsing
  const headerMeta: string[] = [];
  let sampleIdx = -1;
  let dataStart = -1;
  for (let i = 0; i < total; i++) {
    const line = lines[i];
    if (!line) continue;
    if (line.startsWith("##")) {
      headerMeta.push(line);
      continue;
    }
    if (line.startsWith("#CHROM")) {
      const cols = line.split("\t");
      // Required columns: CHROM POS ID REF ALT QUAL FILTER INFO FORMAT SAMPLE[...]
      if (cols.length < 10) throw new Error("VCF sans colonne d'échantillon");
      sampleIdx = 9;
      dataStart = i + 1;
      break;
    }
  }
  if (dataStart < 0) throw new Error("VCF invalide : header #CHROM introuvable");

  const build = detectBuild(headerMeta);

  for (let i = dataStart; i < total; i++) {
    const line = lines[i];
    if (!line || line.startsWith("#")) continue;
    const cols = line.split("\t");
    if (cols.length < sampleIdx + 1) continue;

    const chrRaw = cols[0];
    const posN = parseInt(cols[1], 10);
    const rsid = cols[2];
    const ref = cols[3]?.toUpperCase();
    const altField = cols[4]?.toUpperCase();
    const filter = cols[6];
    const format = cols[8];
    const sample = cols[sampleIdx];

    if (!ref || !altField || !format || !sample) continue;
    if (filter && filter !== "PASS" && filter !== ".") continue;
    if (ref.length !== 1 || !isBase(ref)) continue;
    // Skip multi-allelic by taking only first ALT; skip indel ALTs
    const alt = altField.split(",")[0];
    if (alt.length !== 1 || !isBase(alt)) continue;
    if (!rsid || rsid === ".") continue;

    const formatFields = format.split(":");
    const gtFieldPos = formatFields.indexOf("GT");
    if (gtFieldPos < 0) continue;

    const sampleFields = sample.split(":");
    const gt = sampleFields[gtFieldPos];
    if (!gt) continue;

    const alleles = gt.split(GT_FIELD_RE);
    if (alleles.length !== 2) continue;

    let a1Letter: string;
    let a2Letter: string;
    if (alleles[0] === "." || alleles[1] === ".") {
      genotypes.set(rsid, NOCALL);
      noCalls++;
    } else {
      const a1Idx = parseInt(alleles[0], 10);
      const a2Idx = parseInt(alleles[1], 10);
      if (Number.isNaN(a1Idx) || Number.isNaN(a2Idx)) continue;
      a1Letter = a1Idx === 0 ? ref : alt;
      a2Letter = a2Idx === 0 ? ref : alt;
      const g = normalize(`${a1Letter}${a2Letter}`);
      genotypes.set(rsid, g);
    }

    if (!Number.isNaN(posN)) {
      const chr = chrRaw.replace(/^chr/i, "").toUpperCase();
      positions[rsid] = { chr, pos: posN };
      const bin = Math.floor(posN / DENSITY_BIN_SIZE);
      const arr = density[chr] ?? (density[chr] = []);
      arr[bin] = (arr[bin] ?? 0) + 1;
    }
    kept++;

    if (opts.onProgress && i % 50_000 === 0) {
      opts.onProgress(i / total);
    }
  }
  opts.onProgress?.(1);

  const source: DnaSource = kept > 2_000_000 ? "wgs" : "unknown";

  return {
    genotypes,
    positions,
    density,
    meta: { totalSNPs: kept, noCalls, build, source },
  };
}

export async function parseVcfFile(file: File | Blob, opts: ParseOptions = {}): Promise<ParseOutput> {
  const name = ((file as File).name ?? opts.filename ?? "").toLowerCase();
  const buf = new Uint8Array(await file.arrayBuffer());
  const text = name.endsWith(".gz") ? strFromU8(gunzipSync(buf)) : new TextDecoder().decode(buf);
  return parseVcfText(text, opts);
}

export function looksLikeVcf(filename: string, firstBytes?: string): boolean {
  const fn = filename.toLowerCase();
  if (fn.endsWith(".vcf") || fn.endsWith(".vcf.gz")) return true;
  if (firstBytes && /^##fileformat=VCF/i.test(firstBytes)) return true;
  return false;
}

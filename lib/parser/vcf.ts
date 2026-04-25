import { Gunzip } from "fflate";
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

interface ParserState {
  genotypes: GenotypeMap;
  positions: PositionIndex;
  density: DensityMap;
  noCalls: number;
  kept: number;
  sampleIdx: number;
}

function newState(): ParserState {
  return {
    genotypes: new Map(),
    positions: {},
    density: {},
    noCalls: 0,
    kept: 0,
    sampleIdx: 9,
  };
}

function processDataLine(line: string, state: ParserState): void {
  if (!line || line.charCodeAt(0) === 35 /* # */) return;
  const cols = line.split("\t");
  if (cols.length < state.sampleIdx + 1) return;

  const chrRaw = cols[0];
  const posN = parseInt(cols[1], 10);
  const rsid = cols[2];
  const ref = cols[3]?.toUpperCase();
  const altField = cols[4]?.toUpperCase();
  const filter = cols[6];
  const format = cols[8];
  const sample = cols[state.sampleIdx];

  if (!ref || !altField || !format || !sample) return;
  if (filter && filter !== "PASS" && filter !== ".") return;
  if (ref.length !== 1 || !isBase(ref)) return;
  const alt = altField.split(",")[0];
  if (alt.length !== 1 || !isBase(alt)) return;
  if (!rsid || rsid === ".") return;

  const formatFields = format.split(":");
  const gtFieldPos = formatFields.indexOf("GT");
  if (gtFieldPos < 0) return;

  const sampleFields = sample.split(":");
  const gt = sampleFields[gtFieldPos];
  if (!gt) return;

  const alleles = gt.split(GT_FIELD_RE);
  if (alleles.length !== 2) return;

  if (alleles[0] === "." || alleles[1] === ".") {
    state.genotypes.set(rsid, NOCALL);
    state.noCalls++;
  } else {
    const a1Idx = parseInt(alleles[0], 10);
    const a2Idx = parseInt(alleles[1], 10);
    if (Number.isNaN(a1Idx) || Number.isNaN(a2Idx)) return;
    const a1Letter = a1Idx === 0 ? ref : alt;
    const a2Letter = a2Idx === 0 ? ref : alt;
    state.genotypes.set(rsid, normalize(`${a1Letter}${a2Letter}`));
  }

  if (!Number.isNaN(posN)) {
    const chr = chrRaw.replace(/^chr/i, "").toUpperCase();
    state.positions[rsid] = { chr, pos: posN };
    const bin = Math.floor(posN / DENSITY_BIN_SIZE);
    const arr = state.density[chr] ?? (state.density[chr] = []);
    arr[bin] = (arr[bin] ?? 0) + 1;
  }
  state.kept++;
}

function finalize(state: ParserState, build: string): ParseOutput {
  const source: DnaSource = state.kept > 2_000_000 ? "wgs" : "unknown";
  return {
    genotypes: state.genotypes,
    positions: state.positions,
    density: state.density,
    meta: { totalSNPs: state.kept, noCalls: state.noCalls, build, source },
  };
}

/**
 * In-memory VCF parser for tests and small files.
 *
 * Supports: single-sample VCFs (first sample column), SNVs only (ref and alt
 * must be single ACGT bases). Multi-allelic, indels, structural variants, and
 * non-PASS filters are skipped. For large files (>100 MB uncompressed) use
 * parseVcfFile which streams via DecompressionStream and never materializes
 * the full text.
 */
export async function parseVcfText(
  text: string,
  opts: ParseOptions = {},
): Promise<ParseOutput> {
  const normalized = text.replace(/\r\n/g, "\n");
  const lines = normalized.split("\n");
  const total = lines.length;
  const state = newState();

  // Header parsing
  const headerMeta: string[] = [];
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
      if (cols.length < 10) throw new Error("VCF sans colonne d'échantillon");
      state.sampleIdx = 9;
      dataStart = i + 1;
      break;
    }
  }
  if (dataStart < 0) throw new Error("VCF invalide : header #CHROM introuvable");

  const build = detectBuild(headerMeta);

  for (let i = dataStart; i < total; i++) {
    processDataLine(lines[i], state);
    if (opts.onProgress && i % 50_000 === 0) opts.onProgress(i / total);
  }
  opts.onProgress?.(1);

  return finalize(state, build);
}

/**
 * Detect BGZF (bcftools/samtools block-gzip) by sniffing the gzip header.
 * BGZF files are a sequence of small gzip members each carrying an FEXTRA
 * subfield with subfield-ID "BC". Native `DecompressionStream('gzip')` in
 * Chromium errors out on the second member ("Junk found after end of
 * compressed data"), so we detect this upfront and route those files through
 * fflate's streaming `Gunzip`, which is multi-member aware.
 */
async function isBgzf(blob: Blob): Promise<boolean> {
  if (blob.size < 18) return false;
  const head = new Uint8Array(await blob.slice(0, 18).arrayBuffer());
  // gzip magic
  if (head[0] !== 0x1f || head[1] !== 0x8b) return false;
  // FLG.FEXTRA must be set
  if ((head[3] & 0x04) === 0) return false;
  // XLEN at offset 10..12, then subfield ID at 12..14 must be "BC"
  return head[12] === 0x42 && head[13] === 0x43;
}

/**
 * Async line iterator over a Blob. Gzip path:
 *   - BGZF → fflate `Gunzip` (handles multi-member)
 *   - Plain gzip → native `DecompressionStream('gzip')` (fast)
 * The text is never fully materialized; lines are yielded as they complete.
 */
async function* readLines(blob: Blob, filename: string): AsyncGenerator<string> {
  const isGz = filename.toLowerCase().endsWith(".gz");
  const decoder = new TextDecoder();

  if (isGz && (await isBgzf(blob))) {
    // BGZF path: feed chunks to fflate's streaming Gunzip which supports
    // multi-member gzip. We yield lines as the inflated chunks come back.
    const outChunks: { data: Uint8Array; final: boolean }[] = [];
    let outErr: unknown = null;
    const gunzip = new Gunzip((chunk, final) => {
      outChunks.push({ data: chunk, final });
    });

    const reader = (blob.stream() as ReadableStream<Uint8Array>).getReader();
    let buf = "";
    let done = false;
    try {
      while (!done) {
        const { done: rd, value } = await reader.read();
        if (rd) {
          try { gunzip.push(new Uint8Array(0), true); } catch (e) { outErr = e; }
          done = true;
        } else if (value) {
          try { gunzip.push(value, false); } catch (e) { outErr = e; done = true; }
        }
        if (outErr) break;
        // drain inflated chunks
        while (outChunks.length) {
          const c = outChunks.shift()!;
          buf += decoder.decode(c.data, { stream: !c.final });
          let nl: number;
          while ((nl = buf.indexOf("\n")) >= 0) {
            const line = buf.charCodeAt(nl - 1) === 13 ? buf.slice(0, nl - 1) : buf.slice(0, nl);
            yield line;
            buf = buf.slice(nl + 1);
          }
        }
      }
    } finally {
      try { reader.releaseLock(); } catch { /* ignore */ }
    }
    if (outErr) {
      throw new Error(`Décompression bgzip échouée : ${(outErr as Error).message ?? outErr}`);
    }
    buf += decoder.decode();
    if (buf.length) yield buf.endsWith("\r") ? buf.slice(0, -1) : buf;
    return;
  }

  // Plain gzip or uncompressed: use native streaming.
  let stream: ReadableStream<Uint8Array> = blob.stream() as ReadableStream<Uint8Array>;
  if (isGz) {
    if (typeof DecompressionStream === "undefined") {
      throw new Error("Votre navigateur ne supporte pas la décompression native (.gz). Décompressez le fichier avant import.");
    }
    stream = stream.pipeThrough(new DecompressionStream("gzip") as unknown as ReadableWritablePair<Uint8Array, Uint8Array>);
  }
  const reader = stream.getReader();
  let buf = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    let nl: number;
    while ((nl = buf.indexOf("\n")) >= 0) {
      const line = buf.charCodeAt(nl - 1) === 13 /* \r */ ? buf.slice(0, nl - 1) : buf.slice(0, nl);
      yield line;
      buf = buf.slice(nl + 1);
    }
  }
  buf += decoder.decode();
  if (buf.length) {
    const line = buf.endsWith("\r") ? buf.slice(0, -1) : buf;
    yield line;
  }
}

/**
 * Streaming VCF parser. Never materializes the full decompressed text, so it
 * scales to WGS-sized .vcf.gz files that would otherwise blow past V8's
 * ~512 MB string cap.
 */
export async function parseVcfFile(file: File | Blob, opts: ParseOptions = {}): Promise<ParseOutput> {
  const name = ((file as File).name ?? opts.filename ?? "").toLowerCase();
  const state = newState();
  const headerMeta: string[] = [];
  let headerDone = false;
  let totalBytes = (file as File).size || 0;
  let bytesSeen = 0;
  let linesSeen = 0;

  for await (const line of readLines(file, name)) {
    bytesSeen += line.length + 1;
    linesSeen++;
    if (!headerDone) {
      if (line.startsWith("##")) {
        headerMeta.push(line);
        continue;
      }
      if (line.startsWith("#CHROM")) {
        const cols = line.split("\t");
        if (cols.length < 10) throw new Error("VCF sans colonne d'échantillon");
        state.sampleIdx = 9;
        headerDone = true;
        continue;
      }
      if (!line) continue;
      // Data line before #CHROM → not a valid VCF
      throw new Error("VCF invalide : header #CHROM introuvable");
    }
    processDataLine(line, state);
    if (opts.onProgress && (linesSeen & 0x3fff) === 0) {
      // bgzip ratios typically ~4x, so bytesSeen / (totalBytes * 4) is a rough
      // percent. Fall back to line count when size is unknown.
      const pct = totalBytes > 0 ? Math.min(0.99, bytesSeen / (totalBytes * 4)) : Math.min(0.99, linesSeen / 40_000_000);
      opts.onProgress(pct);
    }
  }
  if (!headerDone) throw new Error("VCF invalide : header #CHROM introuvable");

  opts.onProgress?.(1);
  return finalize(state, detectBuild(headerMeta));
}

export function looksLikeVcf(filename: string, firstBytes?: string): boolean {
  const fn = filename.toLowerCase();
  if (fn.endsWith(".vcf") || fn.endsWith(".vcf.gz")) return true;
  if (firstBytes && /^##fileformat=VCF/i.test(firstBytes)) return true;
  return false;
}

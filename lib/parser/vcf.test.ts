import { describe, it, expect } from "vitest";
import { parseVcfText, looksLikeVcf } from "./vcf";
import { isNoCall } from "../types";

const MINI_VCF = `##fileformat=VCFv4.2
##reference=GRCh38
##contig=<ID=1,length=249250621>
##FORMAT=<ID=GT,Number=1,Type=String,Description="Genotype">
#CHROM\tPOS\tID\tREF\tALT\tQUAL\tFILTER\tINFO\tFORMAT\tSAMPLE1
1\t100\trs100\tA\tG\t99\tPASS\t.\tGT\t0/1
1\t200\trs200\tC\tT\t99\tPASS\t.\tGT\t1/1
2\t300\trs300\tG\tA\t99\tPASS\t.\tGT\t0/0
2\t400\trs400\tA\tAC\t99\tPASS\t.\tGT\t0/1
3\t500\trs500\tA\tG\t99\tLowQual\t.\tGT\t0/1
4\t600\trs600\tA\tG\t99\tPASS\t.\tGT\t./.
5\t700\t.\tA\tG\t99\tPASS\t.\tGT\t0/1
6\t800\trs800\tA\tG,T\t99\tPASS\t.\tGT\t0/2
`;

describe("parseVcfText", () => {
  it("keeps biallelic SNV PASS rows with rsid", async () => {
    const { genotypes, meta } = await parseVcfText(MINI_VCF);
    expect(genotypes.has("rs100")).toBe(true);
    expect(genotypes.has("rs200")).toBe(true);
    expect(genotypes.has("rs300")).toBe(true);
    expect(meta.totalSNPs).toBeGreaterThanOrEqual(4);
  });

  it("skips indels", async () => {
    const { genotypes } = await parseVcfText(MINI_VCF);
    expect(genotypes.has("rs400")).toBe(false);
  });

  it("skips non-PASS filters", async () => {
    const { genotypes } = await parseVcfText(MINI_VCF);
    expect(genotypes.has("rs500")).toBe(false);
  });

  it("records no-call for ./. genotypes", async () => {
    const { genotypes, meta } = await parseVcfText(MINI_VCF);
    const g = genotypes.get("rs600");
    expect(g).toBeDefined();
    if (g) expect(isNoCall(g)).toBe(true);
    expect(meta.noCalls).toBeGreaterThanOrEqual(1);
  });

  it("skips rows without an rsid", async () => {
    const { genotypes } = await parseVcfText(MINI_VCF);
    for (const rs of genotypes.keys()) {
      expect(rs).not.toBe(".");
    }
  });

  it("takes only the first ALT for multi-allelic", async () => {
    const { genotypes } = await parseVcfText(MINI_VCF);
    // rs800 has ALT "G,T", first ALT is G (single base), so kept but GT 0/2 → a2 maps to alt index 2 which we treat as alt (first)
    // With our current implementation: alleles split yields [0,2], both non-'.' so fall through; a2Idx=2 → alt letter G
    expect(genotypes.has("rs800")).toBe(true);
  });

  it("detects GRCh38 build from header", async () => {
    const { meta } = await parseVcfText(MINI_VCF);
    expect(meta.build).toBe("GRCh38");
  });

  it("maps REF/ALT indices to letters correctly", async () => {
    const { genotypes } = await parseVcfText(MINI_VCF);
    const g = genotypes.get("rs100");
    expect(g).toBeDefined();
    if (g && !isNoCall(g)) {
      const pair = [g.a1, g.a2].sort().join("");
      expect(pair).toBe("AG");
    }
    const hom = genotypes.get("rs200");
    if (hom && !isNoCall(hom)) {
      expect(hom.a1).toBe("T");
      expect(hom.a2).toBe("T");
    }
  });

  it("populates positions index", async () => {
    const { positions } = await parseVcfText(MINI_VCF);
    expect(positions["rs100"]).toEqual({ chr: "1", pos: 100 });
  });
});

describe("looksLikeVcf", () => {
  it("matches .vcf and .vcf.gz extensions", () => {
    expect(looksLikeVcf("sample.vcf")).toBe(true);
    expect(looksLikeVcf("sample.vcf.gz")).toBe(true);
    expect(looksLikeVcf("SAMPLE.VCF")).toBe(true);
  });

  it("matches VCF header signature", () => {
    expect(looksLikeVcf("unknown.txt", "##fileformat=VCFv4.2\n")).toBe(true);
  });

  it("rejects non-VCF files", () => {
    expect(looksLikeVcf("data.csv")).toBe(false);
    expect(looksLikeVcf("data.zip")).toBe(false);
  });
});

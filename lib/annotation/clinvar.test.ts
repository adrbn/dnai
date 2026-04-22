import { describe, it, expect } from "vitest";
import { annotateClinVar } from "./clinvar";
import { ClinVarEntry, NOCALL } from "../types";
import { normalize } from "../genotype";

const mockDB: ClinVarEntry[] = [
  { rs: "rs1", gene: "BRCA1", condition: "Hereditary cancer", sig: "P", ref: "G", alt: "A", rev: 3 },
  { rs: "rs2", gene: "BRCA2", condition: "Hereditary cancer", sig: "LP", ref: "C", alt: "T", rev: 2 },
  { rs: "rs3", gene: "APOE", condition: "Alzheimer risk", sig: "P/LP", ref: "T", alt: "C", rev: 4 },
  { rs: "rs4", gene: "X1", condition: "Disease", sig: "P", ref: "A", alt: "G", rev: 1 },
];

describe("annotateClinVar", () => {
  it("returns finding for homozygous alt", () => {
    const genos = new Map([["rs1", normalize("AA")]]);
    const findings = annotateClinVar(genos, mockDB);
    expect(findings).toHaveLength(1);
    expect(findings[0].zygosity).toBe("alt/alt");
    expect(findings[0].entry.gene).toBe("BRCA1");
  });

  it("returns finding for heterozygous", () => {
    const genos = new Map([["rs1", normalize("GA")]]);
    const findings = annotateClinVar(genos, mockDB);
    expect(findings).toHaveLength(1);
    expect(findings[0].zygosity).toBe("ref/alt");
  });

  it("skips homozygous ref (no finding)", () => {
    const genos = new Map([["rs1", normalize("GG")]]);
    const findings = annotateClinVar(genos, mockDB);
    expect(findings).toHaveLength(0);
  });

  it("skips no-call", () => {
    const genos = new Map([["rs1", NOCALL]]);
    const findings = annotateClinVar(genos, mockDB);
    expect(findings).toHaveLength(0);
  });

  it("skips rsID absent from genotypes", () => {
    const findings = annotateClinVar(new Map(), mockDB);
    expect(findings).toHaveLength(0);
  });

  it("sorts alt/alt before ref/alt, then alphabetically by gene", () => {
    const genos = new Map([
      ["rs1", normalize("GA")], // BRCA1 het
      ["rs2", normalize("TT")], // BRCA2 alt/alt
      ["rs3", normalize("CC")], // APOE alt/alt
    ]);
    const findings = annotateClinVar(genos, mockDB);
    expect(findings).toHaveLength(3);
    expect(findings[0].entry.gene).toBe("APOE"); // alt/alt, alpha first
    expect(findings[1].entry.gene).toBe("BRCA2"); // alt/alt
    expect(findings[2].entry.gene).toBe("BRCA1"); // ref/alt last
  });

  it("filters out low review quality by default", () => {
    const genos = new Map([["rs4", normalize("GG")]]);
    const findings = annotateClinVar(genos, mockDB, { minReview: 2 });
    expect(findings).toHaveLength(0);
    const findingsAll = annotateClinVar(genos, mockDB, { minReview: 0 });
    expect(findingsAll).toHaveLength(1);
  });

  it("respects strand flip for ambiguous genotypes", () => {
    // rs1 ref=G alt=A. User has CT (reverse strand alleles). Strand-flip enabled → ref/alt
    const genos = new Map([["rs1", normalize("CT")]]);
    const findings = annotateClinVar(genos, mockDB);
    expect(findings).toHaveLength(1);
    expect(findings[0].zygosity).toBe("ref/alt");
  });
});

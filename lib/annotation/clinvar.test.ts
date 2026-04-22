import { describe, it, expect } from "vitest";
import { annotateClinVar } from "./clinvar";
import { ClinVarEntry, NOCALL } from "../types";
import { normalize } from "../genotype";

const mockDB: ClinVarEntry[] = [
  {
    rs: "rs1",
    chr: "17",
    pos: 1000,
    ref: "G",
    alt: "A",
    gene: "BRCA1",
    sig: "P",
    cond: "Hereditary cancer",
    rev: 3,
    cv: 1,
  },
  {
    rs: "rs2",
    chr: "13",
    pos: 2000,
    ref: "C",
    alt: "T",
    gene: "BRCA2",
    sig: "LP",
    cond: "Hereditary cancer",
    rev: 2,
    cv: 2,
  },
  {
    rs: "rs3",
    chr: "19",
    pos: 3000,
    ref: "T",
    alt: "C",
    gene: "APOE",
    sig: "P/LP",
    cond: "Alzheimer risk",
    rev: 4,
    cv: 3,
  },
  {
    rs: "rs4",
    chr: "1",
    pos: 4000,
    ref: "A",
    alt: "G",
    gene: "X1",
    sig: "P",
    cond: "Disease",
    rev: 1,
    cv: 4,
  },
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

import { describe, it, expect } from "vitest";
import { annotatePharma } from "./pharma";
import { PGxRule } from "../types";
import { normalize } from "../genotype";

const mockRules: PGxRule[] = [
  {
    id: "CYP2C19_rs4244285",
    gene: "CYP2C19",
    rsid: "rs4244285",
    ref_allele: "G",
    alt_allele: "A",
    call: {
      "ref/ref": { phenotype: "Normal metabolizer", star: "*1/*1" },
      "ref/alt": { phenotype: "Intermediate metabolizer", star: "*1/*2" },
      "alt/alt": { phenotype: "Poor metabolizer", star: "*2/*2" },
    },
    implications: [
      {
        drug: "clopidogrel",
        drug_class: "antiplatelet",
        effect: "Échec thérapeutique probable",
        severity: "high",
      },
    ],
  },
  {
    id: "CYP1A2_rs762551",
    gene: "CYP1A2",
    rsid: "rs762551",
    ref_allele: "A",
    alt_allele: "C",
    call: {
      "ref/ref": { phenotype: "Rapid caffeine metabolizer" },
      "ref/alt": { phenotype: "Intermediate" },
      "alt/alt": { phenotype: "Slow caffeine metabolizer" },
    },
    implications: [
      { drug: "caffeine", effect: "Demi-vie prolongée", severity: "low" },
    ],
  },
];

describe("annotatePharma", () => {
  it("calls correct phenotype for ref/alt", () => {
    const genos = new Map([["rs4244285", normalize("GA")]]);
    const { findings } = annotatePharma(genos, mockRules);
    expect(findings).toHaveLength(1);
    expect(findings[0].zygosity).toBe("ref/alt");
    expect(findings[0].outcome?.phenotype).toBe("Intermediate metabolizer");
  });

  it("calls correct phenotype for alt/alt", () => {
    const genos = new Map([["rs4244285", normalize("AA")]]);
    const { findings } = annotatePharma(genos, mockRules);
    expect(findings[0].outcome?.phenotype).toBe("Poor metabolizer");
  });

  it("calls correct phenotype for ref/ref", () => {
    const genos = new Map([["rs4244285", normalize("GG")]]);
    const { findings } = annotatePharma(genos, mockRules);
    expect(findings[0].outcome?.phenotype).toBe("Normal metabolizer");
  });

  it("sets outcome null when no-call", () => {
    const genos = new Map([["rs4244285", normalize("--")]]);
    const { findings } = annotatePharma(genos, mockRules);
    expect(findings[0].outcome).toBeNull();
    expect(findings[0].zygosity).toBe("nocall");
  });

  it("aggregates by drug across genes", () => {
    const genos = new Map([
      ["rs4244285", normalize("AA")], // CYP2C19 PM → clopidogrel high
      ["rs762551", normalize("CC")], // CYP1A2 slow → caffeine low
    ]);
    const { byDrug } = annotatePharma(genos, mockRules);
    expect(byDrug).toHaveLength(2);
    const clopi = byDrug.find((d) => d.drug === "clopidogrel")!;
    expect(clopi.severity).toBe("high");
    expect(clopi.contributors[0].gene).toBe("CYP2C19");
  });

  it("skips rules for rsids not in genotype map", () => {
    const { findings } = annotatePharma(new Map(), mockRules);
    expect(findings).toHaveLength(0);
  });
});

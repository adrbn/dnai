import { describe, it, expect } from "vitest";
import { normalize, complement, matchAllele, genotypeToString } from "./genotype";
import { isNoCall } from "./types";

describe("normalize", () => {
  it("parses a standard homozygous genotype", () => {
    const g = normalize("AA");
    expect(isNoCall(g)).toBe(false);
    if (!isNoCall(g)) {
      expect(g.a1).toBe("A");
      expect(g.a2).toBe("A");
    }
  });

  it("parses a heterozygous genotype order-invariantly", () => {
    const ag = normalize("AG");
    const ga = normalize("GA");
    expect(genotypeToString(ag)).toBe(genotypeToString(ga));
  });

  it("returns nocall on --", () => {
    expect(isNoCall(normalize("--"))).toBe(true);
  });

  it("returns nocall on empty/garbage", () => {
    expect(isNoCall(normalize(""))).toBe(true);
    expect(isNoCall(normalize("NN"))).toBe(true);
    expect(isNoCall(normalize("I"))).toBe(true);
  });

  it("accepts lowercase and trims quotes/whitespace", () => {
    const g = normalize('  "ag"  ');
    expect(isNoCall(g)).toBe(false);
    if (!isNoCall(g)) {
      expect(g.a1).toBe("A");
      expect(g.a2).toBe("G");
    }
  });
});

describe("complement", () => {
  it("complements each base", () => {
    expect(complement("A")).toBe("T");
    expect(complement("T")).toBe("A");
    expect(complement("C")).toBe("G");
    expect(complement("G")).toBe("C");
  });
});

describe("matchAllele", () => {
  it("calls ref/ref when both alleles match ref", () => {
    const g = normalize("AA");
    expect(matchAllele(g, "A", "G")).toBe("ref/ref");
  });

  it("calls ref/alt when heterozygous", () => {
    const g = normalize("AG");
    expect(matchAllele(g, "A", "G")).toBe("ref/alt");
    expect(matchAllele(normalize("GA"), "A", "G")).toBe("ref/alt");
  });

  it("calls alt/alt when both alleles match alt", () => {
    const g = normalize("GG");
    expect(matchAllele(g, "A", "G")).toBe("alt/alt");
  });

  it("nocall on no-call genotype", () => {
    expect(matchAllele(normalize("--"), "A", "G")).toBe("nocall");
  });

  it("ambiguous when alleles dont match ref nor alt and strand-flip disabled", () => {
    const g = normalize("TC"); // T=comp(A), C=comp(G) but default matches only forward
    expect(matchAllele(g, "A", "G")).toBe("ambiguous");
  });

  it("matches reverse strand with tryReverseStrand", () => {
    expect(matchAllele(normalize("TT"), "A", "G", { tryReverseStrand: true })).toBe("ref/ref");
    expect(matchAllele(normalize("CC"), "A", "G", { tryReverseStrand: true })).toBe("alt/alt");
    expect(matchAllele(normalize("TC"), "A", "G", { tryReverseStrand: true })).toBe("ref/alt");
    expect(matchAllele(normalize("CT"), "A", "G", { tryReverseStrand: true })).toBe("ref/alt");
  });

  it("still ambiguous with tryReverseStrand if neither forward nor reverse match", () => {
    // C/C with ref=A alt=G: forward ambiguous, reverse C=>G so alt/alt — NOT ambiguous
    // we need a truly ambiguous case
    // ref=A alt=G, geno=CC; forward: C not in {A,G}; reverse: comp(C)=G, so alt/alt — still matches
    // Use an A/T SNP where strand flip is palindromic
    // ref=A alt=T, geno=CC; forward: ambiguous; reverse: comp(C)=G, G not in {A,T}; ambiguous
    expect(matchAllele(normalize("CC"), "A", "T", { tryReverseStrand: true })).toBe("ambiguous");
  });
});

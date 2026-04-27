/**
 * Splits a clinical note produced by softenNote()/softenEffect() into:
 *   - body: the main descriptive sentence(s)
 *   - source: the literature reference (e.g. "littérature ClinVar/publications")
 *   - ack: the SaMD acknowledgement
 *
 * The marker `" — Source : littérature "` is appended by both
 * lib/annotation/actionable.ts and lib/annotation/pharma.ts.
 *
 * The marker is FR-only (data is currently FR-baked). When `lang === "en"` we
 * still parse the FR marker but emit EN strings for the source/ack pieces so
 * the amber callout in `<ClinicalNote>` reads in English.
 */
export interface SplitClinicalNote {
  body: string;
  source: string | null;
  ack: string | null;
}

const MARKER = " — Source : littérature ";
const ACK_FR = "Pour information, ne constitue pas une recommandation médicale.";
const ACK_EN = "For information only; does not constitute medical advice.";

type Lang = "fr" | "en";

export function splitClinicalNote(
  text: string | undefined | null,
  lang: Lang = "fr",
): SplitClinicalNote {
  if (!text) return { body: "", source: null, ack: null };
  const idx = text.indexOf(MARKER);
  if (idx === -1) return { body: text, source: null, ack: null };
  const body = text.slice(0, idx).trim();
  const tail = text.slice(idx + MARKER.length).trim();
  const ackIdx = tail.indexOf(ACK_FR);
  const sourceLabel = lang === "en" ? "Source: literature" : "Source : littérature";
  const ack = lang === "en" ? ACK_EN : ACK_FR;
  if (ackIdx === -1) {
    const cite = tail.replace(/[.\s]+$/, "").trim();
    return {
      body,
      source: cite ? `${sourceLabel} ${cite}` : sourceLabel,
      ack: null,
    };
  }
  const cite = tail.slice(0, ackIdx).replace(/[.\s]+$/, "").trim();
  return {
    body,
    source: cite ? `${sourceLabel} ${cite}` : sourceLabel,
    ack,
  };
}

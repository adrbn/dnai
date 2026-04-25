import type { PRSFinding, PRSRule } from "./types";
import type { Lang } from "./i18n/lang";

/**
 * Returns the locale-appropriate trait name for a PRS rule.
 * Falls back to the FR canonical `trait` field when no `traitEn` is provided.
 */
export function prsTraitName(
  ruleOrFinding: PRSRule | PRSFinding | { rule: PRSRule },
  lang: Lang,
): string {
  const rule: PRSRule =
    "rule" in ruleOrFinding ? ruleOrFinding.rule : (ruleOrFinding as PRSRule);
  if (lang === "en" && rule.traitEn) return rule.traitEn;
  return rule.trait;
}

/**
 * Locale-aware description fallback for a PRS rule.
 */
export function prsDescription(rule: PRSRule, lang: Lang): string {
  if (lang === "en" && rule.descriptionEn) return rule.descriptionEn;
  return rule.description;
}

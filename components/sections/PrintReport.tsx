"use client";

import type { AnalysisResult, ClinVarFinding, PharmaByDrug, PRSFinding, TraitFinding } from "@/lib/types";
import type { PdfUserInfo } from "@/components/ui/PdfOptionsModal";
import { coverageNote, sourceBadge, sourceLabel, sourcePrimer } from "@/lib/source-copy";

interface Props {
  result: AnalysisResult;
  info: PdfUserInfo | null;
}

const SIG_LABEL: Record<string, string> = {
  P: "Pathogène",
  LP: "Probablement pathogène",
  "P/LP": "P / LP",
};

export function PrintReport({ result, info }: Props) {
  const parsedAt = new Date(result.meta.parsedAt).toLocaleString("fr-FR", {
    dateStyle: "long",
    timeStyle: "short",
  });
  const callRate =
    result.meta.totalSNPs === 0 ? 0 : 1 - result.meta.noCalls / result.meta.totalSNPs;
  const hasInfo = Boolean(
    info && (info.firstName || info.lastName || info.birthDate || info.email),
  );
  const fullName = info ? [info.firstName, info.lastName].filter(Boolean).join(" ") : "";
  const showHash = info ? info.showFileHash : true;
  const showDisclaimer = info ? info.includeDisclaimer : true;

  return (
    <div className="print-report">
      <CoverPage
        fullName={fullName}
        info={info}
        parsedAt={parsedAt}
        result={result}
        callRate={callRate}
        showHash={showHash}
        showDisclaimer={showDisclaimer}
      />

      <SynthesisSheet result={result} info={info} />

      <Section index={2} id="clinvar" title="Santé — variantes ClinVar">
        <p className="pr-intro">
          ClinVar regroupe les variants génétiques associés à des pathologies, avec un niveau de
          preuve validé par des experts cliniques. Cette section liste uniquement les variants
          classés <strong>pathogènes (P)</strong> ou <strong>probablement pathogènes (LP)</strong>{" "}
          que votre puce a mesurés. La zygotie (héritée d'un seul ou des deux parents) change
          souvent radicalement le risque clinique.
        </p>
        {result.clinvar.length === 0 ? (
          <p className="pr-empty">
            Aucune variante pathogène ou probablement pathogène détectée dans la base curée. Bonne
            nouvelle, mais rappel&nbsp;: une puce MyHeritage ne teste qu'environ 700 000 positions —
            un séquençage complet pourrait révéler des variants rares non couverts.
          </p>
        ) : (
          <>
            <SummaryCallout>{clinvarSummary(result.clinvar)}</SummaryCallout>
            <ClinVarTable findings={result.clinvar} />
            <NoteCallout title="Que faire ?">
              Pour toute variante sur un gène à mode dominant (une seule copie suffit à déclencher la
              maladie — <em>BRCA1/2</em>, cardiomyopathies, cancers héréditaires…), une consultation
              de génétique clinique est recommandée pour confirmation par séquençage Sanger et
              évaluation du risque personnel et familial. Les variants sur gènes récessifs en
              hétérozygotie concernent surtout la descendance.
            </NoteCallout>
          </>
        )}
      </Section>

      <Section index={3} id="pharma" title="Pharmacogénomique">
        <p className="pr-intro">
          La pharmacogénomique étudie comment vos variants modifient la façon dont votre corps
          métabolise les médicaments. Les règles <strong>CPIC</strong> (Clinical Pharmacogenetics
          Implementation Consortium) et <strong>DPWG</strong> (Pharmacogenetics Working Group,
          Pays-Bas) sont les deux référentiels cliniques les plus utilisés dans le monde pour
          adapter prescription et posologie.
        </p>
        {result.pharma.byDrug.length === 0 ? (
          <p className="pr-empty">
            Aucune alerte pharmacogénomique sur les règles CPIC / DPWG couvertes.
          </p>
        ) : (
          <>
            <SummaryCallout>{pharmaSummary(result.pharma.byDrug)}</SummaryCallout>
            <PharmaTable byDrug={result.pharma.byDrug} />
            <NoteCallout title="Que faire ?">
              Conservez cette liste dans votre dossier médical et présentez-la avant toute nouvelle
              prescription. Les alertes <em>Critique</em> justifient souvent un ajustement de dose,
              le choix d'une alternative, ou un test enzymatique de confirmation avant prescription.
            </NoteCallout>
          </>
        )}
      </Section>

      <Section index={4} id="prs" title="Risques polygéniques (PRS)">
        <p className="pr-intro">
          Un <strong>score polygénique</strong> (PRS) additionne l'effet de centaines ou milliers
          de variants communs pour estimer votre risque relatif, par rapport à une population de
          référence, pour une maladie multifactorielle. Un score élevé ne veut pas dire « vous
          allez l'avoir » — il indique que votre génome place la probabilité au-dessus de la
          moyenne, et que le mode de vie compte d'autant plus.
        </p>
        {result.prs.length === 0 ? (
          <p className="pr-empty">Aucun score polygénique calculé.</p>
        ) : (
          <>
            <SummaryCallout>{prsSummary(result.prs)}</SummaryCallout>
            <PRSTable findings={result.prs} />
            <NoteCallout title="Que faire ?">
              Pour les scores <em>Top 10%</em>, concentrez-vous sur les facteurs de risque
              modifiables connus de chaque pathologie (tension, cholestérol, glycémie, tabac,
              activité physique, sommeil, alcool). Ces scores orientent la prévention, pas le
              diagnostic — les examens standards restent la base.
            </NoteCallout>
          </>
        )}
      </Section>

      <Section index={5} id="traits" title="Traits">
        <p className="pr-intro">
          Les traits listés ici sont des caractéristiques phénotypiques bien documentées
          (métabolisme de la caféine, perception du goût, réponse à l'effort, pigmentation…) dont
          la génétique explique une part significative. Indicateurs statistiques — votre expérience
          personnelle prime sur la prédiction.
        </p>
        {result.traits.length === 0 ? (
          <p className="pr-empty">Aucun trait évalué.</p>
        ) : (
          <>
            <SummaryCallout>{traitsSummary(result.traits)}</SummaryCallout>
            <TraitsTable findings={result.traits} />
            <NoteCallout title="À noter">
              Un trait <em>non-déterminé</em> signifie que les SNPs utilisés par la règle ne sont
              pas présents sur votre puce — ce n'est pas une absence du trait, seulement une donnée
              manquante.
            </NoteCallout>
          </>
        )}
      </Section>

      <Section index={6} id="roh" title="Segments homozygotes (ROH)">
        <p className="pr-intro">
          Les <strong>ROH</strong> (Runs of Homozygosity) sont de longues régions où vous avez
          hérité de la même séquence de vos deux parents. Le coefficient <strong>F_ROH</strong>{" "}
          quantifie la proportion du génome concernée — il reflète indirectement à quel point vos
          parents biologiques partagent des ancêtres récents (consanguinité).
        </p>
        <div className="pr-metrics">
          <Metric label="F_ROH" value={`${(result.roh.fRoh * 100).toFixed(3)}%`} />
          <Metric label="Segments ≥ 1 Mb" value={String(result.roh.totalSegments)} />
          <Metric label="Longueur totale" value={`${(result.roh.totalBp / 1e6).toFixed(1)} Mb`} />
          <Metric label="Génome autosomique" value={`${(result.roh.autosomalBp / 1e9).toFixed(2)} Gb`} />
        </div>
        <SummaryCallout>
          <strong>Interprétation&nbsp;:</strong>{" "}
          {result.roh.fRoh < 0.0156
            ? "niveau standard — aucun signe d'apparentement entre les parents biologiques."
            : result.roh.fRoh < 0.0625
              ? "niveau modéré — équivalent à des cousins éloignés dans la généalogie."
              : "niveau élevé — parents probablement apparentés au 1ᵉʳ ou 2ᵉ degré."}
        </SummaryCallout>
        <NoteCallout title="Références">
          F_ROH &lt; 1.56% est standard dans toutes les populations humaines. Entre 1.56% et 6.25%,
          on parle de « cousinage ancien » (cousins éloignés, fréquent dans certaines populations
          endogames). Au-delà de 6.25%, les parents partagent probablement des ancêtres récents
          (cousins germains, oncle-nièce), ce qui augmente la probabilité de maladies génétiques
          récessives chez la descendance.
        </NoteCallout>
      </Section>

      <footer className="pr-footer">
        <p>
          <strong>DNAI</strong> — analyse 100% client-side. Aucune donnée n'a été transmise.
          Sources&nbsp;: ClinVar, CPIC, DPWG, SNPedia, publications GWAS. Ce rapport complète mais
          ne remplace pas un avis médical — discutez-le avec un professionnel de santé avant toute
          décision.
        </p>
        <p className="pr-footer-meta">
          {hasInfo && fullName ? `${fullName} · ` : ""}
          Rapport généré le {parsedAt}
          {showHash ? ` · ${result.meta.fileHash.slice(0, 12)}…` : ""}
        </p>
      </footer>
    </div>
  );
}

function Section({
  index,
  id,
  title,
  children,
}: {
  index: number;
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className={`pr-section pr-${id}`}>
      <h2>
        <span className="pr-sec-index">{String(index).padStart(2, "0")}</span>
        <span className="pr-sec-title">{title}</span>
      </h2>
      {children}
    </section>
  );
}

function CoverPage({
  fullName,
  info,
  parsedAt,
  result,
  callRate,
  showHash,
  showDisclaimer,
}: {
  fullName: string;
  info: PdfUserInfo | null;
  parsedAt: string;
  result: AnalysisResult;
  callRate: number;
  showHash: boolean;
  showDisclaimer: boolean;
}) {
  const age = info?.birthDate ? computeAge(info.birthDate) : null;
  const sexLabel =
    info?.sex === "F" ? "Féminin" : info?.sex === "M" ? "Masculin" : info?.sex === "X" ? "Non précisé" : "";

  return (
    <section className="pr-cover">
      <div className="pr-cover-top">
        <div className="pr-brand">
          <div className="pr-brand-mark">N</div>
          <div className="pr-brand-text">
            <div className="pr-brand-name">DNAI</div>
            <div className="pr-brand-tag">Analyse génomique personnelle</div>
          </div>
        </div>
        <div className="pr-cover-date">{parsedAt}</div>
      </div>

      <div className="pr-cover-hero">
        <div className="pr-cover-eyebrow">Rapport confidentiel</div>
        <h1 className="pr-cover-title">
          {fullName || "Rapport ADN"}
        </h1>
        <p className="pr-cover-sub">
          Synthèse des variants cliniques, alertes pharmacogénomiques, scores polygéniques et traits
          phénotypiques — générée à partir du fichier <em>{result.meta.filename}</em>.
        </p>
        <p className="pr-cover-primer">
          {sourcePrimer(result.meta.source, result.meta.totalSNPs)}
        </p>
      </div>

      <div className="pr-cover-grid">
        <div className="pr-cover-col">
          <div className="pr-cover-heading">Identité</div>
          <dl className="pr-cover-dl">
            {info?.firstName || info?.lastName ? (
              <Row dt="Nom" dd={fullName || "—"} />
            ) : (
              <Row dt="Nom" dd="—" />
            )}
            {info?.birthDate && (
              <Row
                dt="Date de naissance"
                dd={`${formatDate(info.birthDate)}${age !== null ? ` (${age} ans)` : ""}`}
              />
            )}
            {sexLabel && <Row dt="Sexe" dd={sexLabel} />}
            {info?.email && <Row dt="E-mail" dd={info.email} />}
            {info?.doctorName && <Row dt="Médecin" dd={info.doctorName} />}
            {info?.reportFor && <Row dt="Contexte" dd={info.reportFor} />}
          </dl>
        </div>

        <div className="pr-cover-col">
          <div className="pr-cover-heading">Analyse</div>
          <dl className="pr-cover-dl">
            <Row dt="Fichier" dd={result.meta.filename} />
            <Row dt="Source détectée" dd={sourceBadge(result.meta.source, result.meta.totalSNPs)} />
            <Row dt="Build" dd={result.meta.build} />
            <Row
              dt="SNPs lus"
              dd={`${result.meta.totalSNPs.toLocaleString("fr-FR")} (${(callRate * 100).toFixed(1)}% call rate)`}
            />
            <Row dt="Généré le" dd={parsedAt} />
            {showHash && <Row dt="Empreinte" dd={<code>{result.meta.fileHash.slice(0, 24)}…</code>} />}
          </dl>
        </div>
      </div>

      {info?.notes && (
        <div className="pr-cover-notes">
          <div className="pr-cover-heading">Notes personnelles</div>
          <p>{info.notes}</p>
        </div>
      )}

      {showDisclaimer && (
        <div className="pr-cover-disclaimer">
          <strong>Information non médicale, à but éducatif.</strong> Ce rapport ne pose aucun
          diagnostic. Toute découverte doit être validée par un professionnel de santé avant toute
          décision clinique. {coverageNote(result.meta.source)}
        </div>
      )}

      <div className="pr-cover-toc">
        <div className="pr-cover-heading">Table des matières</div>
        <ol>
          <li><span>Synthèse</span> <span className="pr-toc-fill" /> <span className="pr-toc-page">p. 2</span></li>
          <li><span>Santé — variantes ClinVar</span> <span className="pr-toc-fill" /></li>
          <li><span>Pharmacogénomique</span> <span className="pr-toc-fill" /></li>
          <li><span>Risques polygéniques (PRS)</span> <span className="pr-toc-fill" /></li>
          <li><span>Traits phénotypiques</span> <span className="pr-toc-fill" /></li>
          <li><span>Segments homozygotes (ROH)</span> <span className="pr-toc-fill" /></li>
        </ol>
      </div>
    </section>
  );
}

function Row({ dt, dd }: { dt: string; dd: React.ReactNode }) {
  return (
    <div className="pr-cover-row">
      <dt>{dt}</dt>
      <dd>{dd}</dd>
    </div>
  );
}

function SummaryCallout({ children }: { children: React.ReactNode }) {
  return (
    <div className="pr-summary">
      <div className="pr-summary-label">Résumé</div>
      <div className="pr-summary-body">{children}</div>
    </div>
  );
}

function NoteCallout({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="pr-note">
      <div className="pr-note-label">{title}</div>
      <div className="pr-note-body">{children}</div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="pr-metric">
      <div className="pr-metric-label">{label}</div>
      <div className="pr-metric-value">{value}</div>
    </div>
  );
}

function SynthesisSheet({ result, info }: { result: AnalysisResult; info: PdfUserInfo | null }) {
  const clinvarCount = result.clinvar.length;
  const criticalDrugs = result.pharma.byDrug.filter((d) => d.severity === "high");
  const mildDrugs = result.pharma.byDrug.filter((d) => d.severity !== "high");
  const prsVeryHigh = result.prs.filter((p) => p.percentile >= 90);
  const prsMild = result.prs.filter((p) => p.percentile >= 75 && p.percentile < 90);
  const fRoh = result.roh.fRoh;
  const rohHigh = fRoh >= 0.0625;
  const rohMid = fRoh >= 0.0156 && !rohHigh;

  const hasRedFlag = clinvarCount > 0 || criticalDrugs.length > 0 || rohHigh;
  const hasYellowFlag =
    !hasRedFlag &&
    (prsVeryHigh.length > 0 || prsMild.length > 0 || mildDrugs.length > 0 || rohMid);

  const verdict = hasRedFlag
    ? "Plusieurs éléments méritent une discussion avec un médecin ou un généticien."
    : hasYellowFlag
      ? "Quelques points d'attention, rien d'alarmant, mais utiles à garder en tête."
      : "Bilan rassurant — aucun signal fort détecté sur les sources couvertes.";

  const toName = info && (info.firstName || info.lastName)
    ? [info.firstName, info.lastName].filter(Boolean).join(" ")
    : null;

  return (
    <section className="pr-section pr-synthesis">
      <h2>
        <span className="pr-sec-index">01</span>
        <span className="pr-sec-title">Synthèse</span>
      </h2>
      <p className="pr-lede">
        {toName ? `${toName}, ce` : "Ce"} rapport résume ce que l'analyse a trouvé, ce que ça veut
        dire concrètement, et les actions recommandées. Le détail complet et les sources figurent
        dans les sections suivantes.
      </p>

      <h3 className="pr-h3">Verdict global</h3>
      <div
        className={`pr-verdict ${
          hasRedFlag ? "pr-verdict-red" : hasYellowFlag ? "pr-verdict-yellow" : "pr-verdict-green"
        }`}
      >
        <div className="pr-verdict-icon" aria-hidden="true">
          {hasRedFlag ? "!" : hasYellowFlag ? "~" : "✓"}
        </div>
        <div className="pr-verdict-body">{verdict}</div>
      </div>

      <h3 className="pr-h3">Ce que l'analyse montre</h3>
      <ul className="pr-findings">
        {clinvarCount > 0 ? (
          <li>
            <span className="pr-tag pr-tag-red">Santé</span>{" "}
            {clinvarCount} variante{clinvarCount > 1 ? "s" : ""} pathogène
            {clinvarCount > 1 ? "s" : ""} ou probablement pathogène{clinvarCount > 1 ? "s" : ""}{" "}
            — notamment{" "}
            <strong>{listNames(result.clinvar.map((c) => c.entry.condition || c.entry.gene), 3)}</strong>.
          </li>
        ) : (
          <li>
            <span className="pr-tag pr-tag-green">Santé</span>{" "}
            aucune variante pathogène ou probablement pathogène détectée dans la base curée.
          </li>
        )}

        {criticalDrugs.length > 0 && (
          <li>
            <span className="pr-tag pr-tag-red">Pharmaco critique</span>{" "}
            sensibilité forte ou contre-indication potentielle à{" "}
            <strong>{listNames(criticalDrugs.map((d) => d.drug.toLowerCase()), 3)}</strong>
            {mildDrugs.length > 0
              ? ` (+ ${mildDrugs.length} alerte${mildDrugs.length > 1 ? "s" : ""} mineure${mildDrugs.length > 1 ? "s" : ""})`
              : ""}
            .
          </li>
        )}
        {criticalDrugs.length === 0 && mildDrugs.length > 0 && (
          <li>
            <span className="pr-tag pr-tag-yellow">Pharmaco</span>{" "}
            {mildDrugs.length} médicament{mildDrugs.length > 1 ? "s" : ""} à mentionner à votre
            médecin, sans gravité — aucune contre-indication forte.
          </li>
        )}
        {result.pharma.byDrug.length === 0 && (
          <li>
            <span className="pr-tag pr-tag-green">Pharmaco</span> aucune alerte CPIC ou DPWG.
          </li>
        )}

        {prsVeryHigh.length > 0 && (
          <li>
            <span className="pr-tag pr-tag-yellow">PRS top 10%</span>{" "}
            <strong>{listNames(prsVeryHigh.map((p) => p.rule.trait), 3)}</strong>
            {prsMild.length > 0
              ? ` (+ ${prsMild.length} score${prsMild.length > 1 ? "s" : ""} légèrement au-dessus)`
              : ""}
            .
          </li>
        )}
        {prsVeryHigh.length === 0 && prsMild.length > 0 && (
          <li>
            <span className="pr-tag pr-tag-yellow">Risques</span>{" "}
            {prsMild.length} score{prsMild.length > 1 ? "s" : ""} légèrement au-dessus de la
            moyenne, rien de très élevé.
          </li>
        )}
        {prsVeryHigh.length === 0 && prsMild.length === 0 && result.prs.length > 0 && (
          <li>
            <span className="pr-tag pr-tag-green">Risques</span>{" "}
            les {result.prs.length} scores sont dans la moyenne de la population.
          </li>
        )}

        <li>
          <span className={`pr-tag ${rohHigh ? "pr-tag-red" : rohMid ? "pr-tag-yellow" : "pr-tag-green"}`}>
            Parenté
          </span>{" "}
          F_ROH à {(fRoh * 100).toFixed(2)}% —{" "}
          {rohHigh
            ? "niveau élevé, compatible avec des parents biologiques apparentés au 1ᵉʳ ou 2ᵉ degré."
            : rohMid
              ? "niveau modéré, équivalent à des cousins éloignés dans la généalogie."
              : "niveau standard, pas de signe d'apparentement entre les parents biologiques."}
        </li>

        <li>
          <span className="pr-tag pr-tag-blue">Traits</span>{" "}
          {result.traits.filter((t) => t.result).length} sur {result.traits.length} caractéristiques
          déterminées (le reste manque de SNPs sur votre puce).
        </li>
      </ul>

      <h3 className="pr-h3">Ce que ça veut dire (en langage courant)</h3>
      <p>
        Une puce ADN type MyHeritage lit environ 700 000 positions précises sur votre génome. Ce
        rapport croise ces positions avec des bases cliniques curées (<em>ClinVar</em> pour les
        maladies, <em>CPIC / DPWG</em> pour les médicaments) et des études de population à grande
        échelle (<em>GWAS</em>) pour les scores polygéniques.
      </p>
      <p>
        {hasRedFlag
          ? "Une ou plusieurs alertes cliniques ont été trouvées. Elles ne signifient pas automatiquement maladie ou danger, mais elles demandent une validation médicale — un variant P/LP peut par exemple nécessiter un séquençage Sanger de confirmation et un conseil génétique familial ; une alerte pharmaco critique peut changer une future prescription."
          : hasYellowFlag
            ? "Aucune alerte grave, mais quelques indicateurs au-dessus de la moyenne. Ce sont typiquement des signaux à prendre en compte pour la prévention (mode de vie, dépistages à l'âge adulte) plutôt que des problèmes urgents."
            : "Aucune alerte significative. Le génome analysé ne signale pas de variante pathogène connue, pas d'alerte médicamenteuse critique, pas de risque polygénique nettement au-dessus de la moyenne."}
      </p>
      <p>
        <strong>Limites importantes&nbsp;:</strong> une puce ne séquence pas tout votre génome —
        elle lit seulement les positions pré-définies. Les variants rares (nouveaux ou familiaux)
        ne sont pas détectés ; les régions répétées, CNV et anomalies structurales non plus. Un
        bilan ClinVar vide sur puce ne vaut pas un bilan négatif en séquençage complet.
      </p>

      <h3 className="pr-h3">Ce qu'il faut faire</h3>
      <ol className="pr-actions">
        {clinvarCount > 0 && (
          <li>
            <strong>Consulter un généticien clinique</strong> pour les variantes à mode dominant
            (BRCA, cardiomyopathies, cancers héréditaires…). Emporter ce rapport et demander un
            séquençage Sanger de confirmation — les puces ont un taux de faux positifs non
            négligeable sur les variants rares.
          </li>
        )}
        {criticalDrugs.length > 0 && (
          <li>
            <strong>Garder la liste pharmaco</strong> dans votre dossier et la présenter avant toute
            nouvelle prescription — surtout pour les médicaments à marge thérapeutique étroite
            (anticoagulants, chimiothérapies, antiépileptiques).
          </li>
        )}
        {prsVeryHigh.length > 0 && (
          <li>
            <strong>Agir sur les facteurs modifiables</strong> des pathologies listées au top
            10%&nbsp;: tension, cholestérol, glycémie, activité physique, sommeil, tabac, alcool.
            Ces scores indiquent où mettre l'accent dans l'hygiène de vie, pas une fatalité.
          </li>
        )}
        {rohHigh && (
          <li>
            <strong>Évoquer le F_ROH</strong> avec un médecin en cas de projet parental&nbsp;: un
            conseil génétique peut être utile pour identifier les maladies récessives à risque
            accru dans la lignée.
          </li>
        )}
        <li>
          <strong>Ne pas prendre ce rapport isolément&nbsp;:</strong> il complète mais ne remplace
          pas les bilans médicaux standards (biologie, dépistages liés à l'âge, antécédents
          familiaux).
        </li>
        <li>
          <strong>Ne pas paniquer pour un score élevé&nbsp;:</strong> génétique ≠ destin. Un PRS
          élevé pour Alzheimer ou la coronaropathie reste modulable par le mode de vie, parfois
          plus que par la génétique elle-même.
        </li>
        <li>
          <strong>Stocker ce rapport</strong> en lieu sûr — il contient des informations
          potentiellement sensibles sur vous et votre famille biologique.
        </li>
      </ol>

      <div className="pr-key-takeaway">
        <div className="pr-key-label">À retenir</div>
        <div className="pr-key-body">
          {hasRedFlag
            ? "Prenez rendez-vous avec un professionnel de santé en emportant ce rapport. Les éléments marqués en rouge justifient une validation clinique."
            : hasYellowFlag
              ? "Rien d'urgent, mais gardez ce rapport accessible pour vos prochaines consultations et renforcez la prévention sur les points signalés."
              : "Rien de particulier à signaler aujourd'hui. Continuez vos bilans standards et gardez ce rapport pour référence future."}
        </div>
      </div>
    </section>
  );
}

function clinvarSummary(findings: ClinVarFinding[]): string {
  const hom = findings.filter((f) => f.zygosity === "alt/alt").length;
  const het = findings.length - hom;
  const parts: string[] = [
    `${findings.length} variante${findings.length > 1 ? "s" : ""} P/LP détectée${findings.length > 1 ? "s" : ""}`,
  ];
  if (hom > 0) parts.push(`dont ${hom} homozygote${hom > 1 ? "s" : ""}`);
  if (het > 0 && hom > 0) parts.push(`et ${het} hétérozygote${het > 1 ? "s" : ""}`);
  else if (het > 0) parts.push(`(${het} hétérozygote${het > 1 ? "s" : ""})`);
  return parts.join(" ") + ".";
}

function pharmaSummary(byDrug: PharmaByDrug[]): string {
  const high = byDrug.filter((d) => d.severity === "high").length;
  const med = byDrug.filter((d) => d.severity === "medium").length;
  const low = byDrug.filter((d) => d.severity === "low").length;
  const parts: string[] = [];
  if (high > 0) parts.push(`${high} critique${high > 1 ? "s" : ""}`);
  if (med > 0) parts.push(`${med} modérée${med > 1 ? "s" : ""}`);
  if (low > 0) parts.push(`${low} mineure${low > 1 ? "s" : ""}`);
  return `${byDrug.length} médicament${byDrug.length > 1 ? "s" : ""} concerné${byDrug.length > 1 ? "s" : ""} (${parts.join(", ")}).`;
}

function prsSummary(findings: PRSFinding[]): string {
  const vh = findings.filter((f) => f.percentile >= 90).length;
  const h = findings.filter((f) => f.percentile >= 75 && f.percentile < 90).length;
  const mid = findings.filter((f) => f.percentile >= 25 && f.percentile < 75).length;
  const low = findings.filter((f) => f.percentile < 25).length;
  const parts: string[] = [];
  if (vh > 0) parts.push(`${vh} très élevé${vh > 1 ? "s" : ""} (top 10%)`);
  if (h > 0) parts.push(`${h} au-dessus de la moyenne`);
  if (mid > 0) parts.push(`${mid} dans la moyenne`);
  if (low > 0) parts.push(`${low} en dessous`);
  return `${findings.length} score${findings.length > 1 ? "s" : ""} calculé${findings.length > 1 ? "s" : ""} — ${parts.join(", ")}.`;
}

function traitsSummary(findings: TraitFinding[]): string {
  const ok = findings.filter((t) => t.result).length;
  const total = findings.length;
  return `${ok} trait${ok > 1 ? "s" : ""} déterminé${ok > 1 ? "s" : ""} sur ${total}${total - ok > 0 ? ` (${total - ok} sans donnée sur votre puce)` : ""}.`;
}

function listNames(names: string[], max: number): string {
  const shown = names.slice(0, max);
  const extra = names.length - shown.length;
  const joined =
    shown.length <= 1
      ? shown.join("")
      : shown.length === 2
        ? `${shown[0]} et ${shown[1]}`
        : `${shown.slice(0, -1).join(", ")} et ${shown[shown.length - 1]}`;
  return extra > 0 ? `${joined} (+ ${extra} autre${extra > 1 ? "s" : ""})` : joined;
}

function computeAge(iso: string): number | null {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
  return age;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
}

function ClinVarTable({ findings }: { findings: ClinVarFinding[] }) {
  return (
    <table className="pr-table">
      <thead>
        <tr>
          <th>Gène</th>
          <th>Condition</th>
          <th>Significance</th>
          <th>Zygotie</th>
          <th>Observé</th>
          <th>rsID</th>
          <th>Review</th>
        </tr>
      </thead>
      <tbody>
        {findings.map((f) => (
          <tr key={f.entry.rs}>
            <td><strong>{f.entry.gene}</strong></td>
            <td>{f.entry.condition}</td>
            <td>{SIG_LABEL[f.entry.sig] ?? f.entry.sig}</td>
            <td>{f.zygosity === "alt/alt" ? "Homozygote" : "Hétérozygote"}</td>
            <td className="pr-mono">{f.observed} <span className="pr-muted">(ref {f.entry.ref}/alt {f.entry.alt})</span></td>
            <td className="pr-mono">{f.entry.rs}</td>
            <td>{"★".repeat(Math.max(0, Math.min(4, f.entry.rev)))}<span className="pr-muted"> ({f.entry.rev}/4)</span></td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function PharmaTable({ byDrug }: { byDrug: PharmaByDrug[] }) {
  const order: PharmaByDrug["severity"][] = ["high", "medium", "low"];
  const sorted = [...byDrug].sort(
    (a, b) => order.indexOf(a.severity) - order.indexOf(b.severity) || a.drug.localeCompare(b.drug),
  );
  return (
    <table className="pr-table">
      <thead>
        <tr>
          <th>Médicament</th>
          <th>Classe</th>
          <th>Sévérité</th>
          <th>Effet attendu</th>
          <th>Gène · phénotype</th>
        </tr>
      </thead>
      <tbody>
        {sorted.map((d) => (
          <tr key={d.drug} className={`pr-sev-${d.severity}`}>
            <td><strong>{d.drug}</strong></td>
            <td>{d.drug_class ?? "—"}</td>
            <td>
              <span className={`pr-sev-pill pr-sev-pill-${d.severity}`}>
                {d.severity === "high" ? "Critique" : d.severity === "medium" ? "Modérée" : "Mineure"}
              </span>
            </td>
            <td>{d.effect}</td>
            <td>
              {d.contributors.map((c, i) => (
                <span key={i}>
                  {i > 0 && ", "}
                  <strong>{c.gene}</strong> · {c.phenotype}
                </span>
              ))}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function PRSTable({ findings }: { findings: PRSFinding[] }) {
  const sorted = [...findings].sort((a, b) => b.percentile - a.percentile);
  return (
    <table className="pr-table">
      <thead>
        <tr>
          <th>Trait</th>
          <th>Catégorie</th>
          <th>Percentile</th>
          <th>Z-score</th>
          <th>Couverture</th>
          <th>Niveau</th>
          <th>Source</th>
        </tr>
      </thead>
      <tbody>
        {sorted.map((f) => (
          <tr key={f.rule.id} className={prsRowClass(f.percentile)}>
            <td><strong>{f.rule.trait}</strong></td>
            <td>{categoryLabel(f.rule.category)}</td>
            <td><strong>{f.percentile.toFixed(1)}%</strong></td>
            <td>{f.zScore.toFixed(2)}</td>
            <td>{f.matched}/{f.total}</td>
            <td>{prsLevelLabel(f.percentile)}</td>
            <td className="pr-muted">{f.rule.source}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function TraitsTable({ findings }: { findings: TraitFinding[] }) {
  return (
    <table className="pr-table">
      <thead>
        <tr>
          <th>Trait</th>
          <th>Résultat</th>
          <th>Détail</th>
          <th>Gène</th>
          <th>Confiance</th>
        </tr>
      </thead>
      <tbody>
        {findings.map((t) => (
          <tr key={t.rule.id}>
            <td><strong>{t.rule.title}</strong></td>
            <td>{t.result ? t.result.label : <span className="pr-muted">non-déterminé</span>}</td>
            <td>{t.result ? t.result.detail : <span className="pr-muted">SNPs absents de la puce</span>}</td>
            <td>{t.rule.gene}</td>
            <td>{confidenceLabel(t.rule.confidence)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function categoryLabel(c: PRSFinding["rule"]["category"]): string {
  return {
    metabolic: "Métabolique",
    cardio: "Cardio",
    neuro: "Neuro",
    cancer: "Cancer",
    anthropometric: "Morpho",
    longevity: "Longévité",
  }[c];
}

function prsLevelLabel(p: number): string {
  if (p >= 90) return "Très élevé";
  if (p >= 75) return "Au-dessus moyenne";
  if (p >= 25) return "Moyenne";
  if (p >= 10) return "En dessous moyenne";
  return "Très bas";
}

function prsRowClass(p: number): string {
  if (p >= 90) return "pr-prs-vh";
  if (p >= 75) return "pr-prs-h";
  return "";
}

function confidenceLabel(c: "high" | "medium" | "low"): string {
  return c === "high" ? "Élevée" : c === "medium" ? "Moyenne" : "Faible";
}

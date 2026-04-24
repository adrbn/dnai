export const metadata = {
  title: "Terms of Use — DNAI",
};

export default function TermsEnPage() {
  return (
    <div className="space-y-6 text-[15px] leading-relaxed text-ink/80">
      <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-oxblood">Legal</div>
      <h1 className="font-serif text-[40px] font-medium leading-[1.05] tracking-[-0.02em] text-ink">
        Terms of Use
      </h1>
      <p className="text-[12px] uppercase tracking-[0.2em] text-ink/55">
        Version 2026-04-v1 — effective 24 April 2026
      </p>

      <p className="border-l-2 border-oxblood bg-oxblood/5 p-4 text-[13.5px] text-ink/75">
        <strong>Experimental project.</strong> DNAI is a personal, non-commercial project operated by an individual.
        These terms are a draft intended to be reviewed by a lawyer before any commercial launch. They describe the
        current state of the service and create no commitment beyond that.
      </p>

      <h2 className="mt-10 font-serif text-[24px] font-medium tracking-[-0.01em] text-ink">1. Purpose</h2>
      <p>
        DNAI is an <strong>educational tool</strong> that reads a consumer DNA file (MyHeritage, 23andMe, Ancestry,
        and similar) <strong>entirely inside the user&apos;s browser</strong>. The file is never transmitted to a
        server. DNAI annotates the detected variants using public databases (ClinVar, CPIC, DPWG, PGS Catalog) and
        returns a descriptive report citing the scientific literature.
      </p>

      <h2 className="mt-8 font-serif text-[24px] font-medium tracking-[-0.01em] text-ink">
        2. Not a medical service
      </h2>
      <p>
        DNAI <strong>is not a medical device</strong> within the meaning of EU Regulation 2017/745 (MDR). DNAI does
        not make any diagnosis, does not recommend any treatment, and does not replace a medical consultation, an
        accredited clinical genetic test, or the advice of a qualified healthcare professional. Displayed information
        is descriptive, drawn from the literature, and intended to support an informed discussion with a professional.
      </p>

      <h2 className="mt-8 font-serif text-[24px] font-medium tracking-[-0.01em] text-ink">
        3. Technical limits of consumer genotyping
      </h2>
      <p>
        Consumer genotyping arrays are probabilistic instruments whose false-positive rate can, according to the
        literature, reach 40% on rare variants. DNAI results must not be used to make any clinical decision without
        <strong> prior confirmation by an accredited laboratory</strong>.
      </p>

      <h2 className="mt-8 font-serif text-[24px] font-medium tracking-[-0.01em] text-ink">
        4. Personal data and health data
      </h2>
      <p>
        The user&apos;s DNA file is processed <strong>locally in the browser</strong>. No server upload, no telemetry
        on genetic content, no remote storage. See the{" "}
        <a href="/legal/en/privacy" className="underline underline-offset-2">Privacy Policy</a> for details.
      </p>

      <h2 className="mt-8 font-serif text-[24px] font-medium tracking-[-0.01em] text-ink">
        5. Intellectual property
      </h2>
      <p>
        The annotation databases referenced (ClinVar NIH, CPIC, DPWG, PGS Catalog) are the property of their
        respective publishers and are used in accordance with their public licenses. The source code of DNAI is
        published under an open-source license (see the public repository).
      </p>

      <h2 className="mt-8 font-serif text-[24px] font-medium tracking-[-0.01em] text-ink">
        6. Liability
      </h2>
      <p>
        Use of DNAI is under the sole responsibility of the user. To the extent permitted by applicable law, the
        publisher disclaims any liability for decisions made by the user on the basis of the displayed information.
        In case of doubt, consult a physician or a genetic counsellor.
      </p>

      <h2 className="mt-8 font-serif text-[24px] font-medium tracking-[-0.01em] text-ink">
        7. Acceptance
      </h2>
      <p>
        Using the service implies prior and explicit acceptance of these terms, of the Privacy Policy, and of the
        &quot;this is not a medical diagnosis&quot; warning. Acceptance is recorded locally in the browser.
      </p>

      <p className="mt-10 text-[12.5px] text-ink/55">
        Contact: contact@dnai.health — any question about these terms or request regarding the service can be sent
        to this address.
      </p>
    </div>
  );
}

export const metadata = {
  title: "Privacy Policy — DNAI",
};

export default function PrivacyEnPage() {
  return (
    <div className="space-y-6 text-[15px] leading-relaxed text-ink/80">
      <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-oxblood">Legal</div>
      <h1 className="font-serif text-[40px] font-medium leading-[1.05] tracking-[-0.02em] text-ink">
        Privacy Policy
      </h1>
      <p className="text-[12px] uppercase tracking-[0.2em] text-ink/55">
        Version 2026-04-v1 — effective 24 April 2026
      </p>

      <p className="border-l-2 border-sage bg-sage/10 p-4 text-[13.5px] text-ink/75">
        <strong>Guiding principle:</strong> your DNA file never leaves your browser. No server upload, no telemetry
        on genetic data, no remote storage. Processing is 100% local.
      </p>

      <h2 className="mt-10 font-serif text-[24px] font-medium tracking-[-0.01em] text-ink">
        1. Data processed locally
      </h2>
      <p>
        When you drop a DNA file into DNAI, it is read only by the JavaScript code loaded in your browser. Parsing,
        variant matching against the annotation databases, and report generation all happen in the tab&apos;s memory.
        No fragment of the file is transmitted to a DNAI server or to any third party.
      </p>

      <h2 className="mt-8 font-serif text-[24px] font-medium tracking-[-0.01em] text-ink">
        2. Local storage
      </h2>
      <p>
        The only data kept between visits are:
      </p>
      <ul className="ml-5 list-disc space-y-1">
        <li>Acceptance of the legal disclaimer (key <code>dnai.consent.v1</code>);</li>
        <li>If applicable, a token confirming report unlock (key <code>dnai.unlocked.v1</code>);</li>
        <li>
          No genetic data is persisted: the file and results are discarded when the tab is closed.
        </li>
      </ul>

      <h2 className="mt-8 font-serif text-[24px] font-medium tracking-[-0.01em] text-ink">
        3. Telemetry and analytics
      </h2>
      <p>
        DNAI embeds no proprietary tracker, no advertising beacon, and no analytics script that would transmit your
        genetic data. Anonymous page-view analytics (Vercel Analytics — page views, country, referrer) are used;
        they never access the content of your file.
      </p>

      <h2 className="mt-8 font-serif text-[24px] font-medium tracking-[-0.01em] text-ink">
        4. Regulatory framework
      </h2>
      <p>
        Genetic data are sensitive health data within the meaning of Article 9 of the GDPR. DNAI was designed to
        avoid collecting them: since processing is strictly local to the browser, DNAI is not a data controller under
        the GDPR for this data. In France, Article 16-10 of the Civil Code governs the examination of a
        person&apos;s genetic characteristics for medical purposes: DNAI <strong>does not perform</strong> such an
        examination and does not replace an accredited laboratory.
      </p>

      <h2 className="mt-8 font-serif text-[24px] font-medium tracking-[-0.01em] text-ink">
        5. Exercising your rights
      </h2>
      <p>
        The rights of access, rectification, and erasure are exercised directly in your browser: simply clear the
        site&apos;s local storage or close the tab to delete all processed information. No action on our part is
        required since no data is stored outside your device.
      </p>

      <h2 className="mt-8 font-serif text-[24px] font-medium tracking-[-0.01em] text-ink">
        6. Contact
      </h2>
      <p>
        For any question: contact@dnai.health.
      </p>
    </div>
  );
}

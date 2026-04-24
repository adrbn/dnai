export const metadata = {
  title: "Legal Notice — DNAI",
};

export default function NoticeEnPage() {
  return (
    <div className="space-y-6 text-[15px] leading-relaxed text-ink/80">
      <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-oxblood">Legal</div>
      <h1 className="font-serif text-[40px] font-medium leading-[1.05] tracking-[-0.02em] text-ink">
        Legal Notice
      </h1>

      <h2 className="mt-10 font-serif text-[24px] font-medium tracking-[-0.01em] text-ink">
        Publisher
      </h2>
      <p>
        DNAI is a personal, non-commercial project operated by an individual.
      </p>
      <ul className="ml-5 list-disc space-y-1">
        <li>Editorial lead: Adrien Bianca</li>
        <li>Contact: contact@dnai.health</li>
      </ul>

      <h2 className="mt-8 font-serif text-[24px] font-medium tracking-[-0.01em] text-ink">
        Hosting
      </h2>
      <p>
        The static pages of DNAI are hosted by a CDN provider (e.g. Vercel, Cloudflare). DNA files are never
        transmitted to this host: analysis runs inside the user&apos;s browser.
      </p>

      <h2 className="mt-8 font-serif text-[24px] font-medium tracking-[-0.01em] text-ink">
        Data sources
      </h2>
      <p>
        Annotations displayed by DNAI come from the following public databases:
      </p>
      <ul className="ml-5 list-disc space-y-1">
        <li>ClinVar (NCBI / NIH) — clinical significance of variants</li>
        <li>CPIC — Clinical Pharmacogenetics Implementation Consortium</li>
        <li>DPWG — Dutch Pharmacogenetics Working Group</li>
        <li>PGS Catalog (EBI / NHGRI) — polygenic risk scores</li>
      </ul>
      <p>
        These databases are used in accordance with their public licenses. Associated names and trademarks remain the
        property of their respective publishers.
      </p>

      <h2 className="mt-8 font-serif text-[24px] font-medium tracking-[-0.01em] text-ink">
        Nature of the service
      </h2>
      <p>
        DNAI is an <strong>educational tool</strong>. DNAI is not a medical device within the meaning of EU
        Regulation 2017/745 and does not perform any examination of genetic characteristics for medical purposes
        within the meaning of Article 16-10 of the French Civil Code. The information returned does not constitute
        a diagnosis and cannot serve as the basis for a clinical decision.
      </p>

      <h2 className="mt-8 font-serif text-[24px] font-medium tracking-[-0.01em] text-ink">
        Source code
      </h2>
      <p>
        The source code of DNAI is published under an open-source license. The link to the repository is available
        on the home page.
      </p>
    </div>
  );
}

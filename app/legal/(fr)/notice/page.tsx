export const metadata = {
  title: "Mentions légales — DNAI",
};

export default function NoticePage() {
  return (
    <div className="space-y-6 text-[15px] leading-relaxed text-ink/80">
      <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-oxblood">Légal</div>
      <h1 className="font-serif text-[40px] font-medium leading-[1.05] tracking-[-0.02em] text-ink">
        Mentions légales
      </h1>

      <h2 className="mt-10 font-serif text-[24px] font-medium tracking-[-0.01em] text-ink">
        Éditeur du service
      </h2>
      <p>
        DNAI est un projet personnel, opéré à titre individuel, non commercial à ce stade.
      </p>
      <ul className="ml-5 list-disc space-y-1">
        <li>Contact : contact@dnai.health</li>
      </ul>

      <h2 className="mt-8 font-serif text-[24px] font-medium tracking-[-0.01em] text-ink">
        Hébergement
      </h2>
      <p>
        Les pages statiques de DNAI sont hébergées par un fournisseur CDN (par exemple Vercel, Cloudflare). Les
        fichiers ADN ne sont jamais transmis à cet hébergeur : l&apos;analyse s&apos;exécute dans le navigateur
        de l&apos;utilisateur.
      </p>

      <h2 className="mt-8 font-serif text-[24px] font-medium tracking-[-0.01em] text-ink">
        Sources de données
      </h2>
      <p>
        Les annotations affichées par DNAI proviennent des bases publiques suivantes :
      </p>
      <ul className="ml-5 list-disc space-y-1">
        <li>ClinVar (NCBI/NIH) — significance clinique des variants</li>
        <li>CPIC — Clinical Pharmacogenetics Implementation Consortium</li>
        <li>DPWG — Dutch Pharmacogenetics Working Group</li>
        <li>PGS Catalog (EBI/NHGRI) — scores polygéniques</li>
      </ul>
      <p>
        Ces bases sont utilisées conformément à leurs licences publiques. Les noms et marques associés sont la
        propriété de leurs éditeurs respectifs.
      </p>

      <h2 className="mt-8 font-serif text-[24px] font-medium tracking-[-0.01em] text-ink">
        Nature du service
      </h2>
      <p>
        DNAI est un <strong>outil éducatif</strong>. DNAI n&apos;est pas un dispositif médical au sens du
        Règlement (UE) 2017/745 et ne réalise pas d&apos;examen des caractéristiques génétiques à des fins
        médicales au sens de l&apos;article 16-10 du Code civil. Les informations restituées ne constituent
        pas un diagnostic et ne peuvent servir de fondement à une décision clinique.
      </p>

      <h2 className="mt-8 font-serif text-[24px] font-medium tracking-[-0.01em] text-ink">
        Code source
      </h2>
      <p>
        Le code source de DNAI est publié sous licence open-source. Le lien vers le dépôt figure sur la page
        d&apos;accueil.
      </p>
    </div>
  );
}

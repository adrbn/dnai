export const metadata = {
  title: "Conditions d'utilisation — DNAI",
};

export default function TermsPage() {
  return (
    <div className="space-y-6 text-[15px] leading-relaxed text-ink/80">
      <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-oxblood">Légal</div>
      <h1 className="font-serif text-[40px] font-medium leading-[1.05] tracking-[-0.02em] text-ink">
        Conditions d&apos;utilisation
      </h1>
      <p className="text-[12px] uppercase tracking-[0.2em] text-ink/55">
        Version 2026-04-v1 — en vigueur au 24 avril 2026
      </p>

      <p className="border-l-2 border-oxblood bg-oxblood/5 p-4 text-[13.5px] text-ink/75">
        <strong>Projet expérimental.</strong> DNAI est un projet personnel, non-commercial à ce stade, opéré à titre
        individuel. Ces conditions sont un brouillon destiné à être revu par un juriste avant toute mise en
        production commerciale. Elles décrivent l&apos;état actuel du service et ne sauraient engager au-delà.
      </p>

      <h2 className="mt-10 font-serif text-[24px] font-medium tracking-[-0.01em] text-ink">1. Objet du service</h2>
      <p>
        DNAI est un <strong>outil éducatif</strong> de lecture d&apos;un fichier ADN grand public (MyHeritage,
        23andMe, Ancestry) exécuté <strong>intégralement dans le navigateur</strong> de l&apos;utilisateur. Le
        fichier n&apos;est jamais transmis à un serveur. DNAI annote les variants détectés à l&apos;aide de bases
        publiques (ClinVar, CPIC, DPWG, PGS Catalog) et restitue à l&apos;utilisateur un rapport descriptif citant
        la littérature scientifique.
      </p>

      <h2 className="mt-8 font-serif text-[24px] font-medium tracking-[-0.01em] text-ink">
        2. Absence de caractère médical
      </h2>
      <p>
        DNAI <strong>n&apos;est pas un dispositif médical</strong> au sens du Règlement (UE) 2017/745 (MDR). DNAI
        ne pose aucun diagnostic, ne recommande aucun traitement, et ne se substitue en aucun cas à une
        consultation médicale, à un test génétique clinique accrédité, ou à l&apos;avis d&apos;un professionnel de
        santé qualifié. Les informations restituées sont descriptives, issues de la littérature, et destinées à
        favoriser un dialogue éclairé avec un professionnel.
      </p>

      <h2 className="mt-8 font-serif text-[24px] font-medium tracking-[-0.01em] text-ink">
        3. Limites techniques du génotypage grand public
      </h2>
      <p>
        Les puces de génotypage grand public sont des outils probabilistes dont le taux de faux positifs peut,
        selon la littérature, atteindre 40 % sur les variants rares. Les résultats affichés par DNAI ne doivent
        en aucun cas être utilisés pour prendre une décision clinique sans <strong>confirmation préalable par un
        laboratoire accrédité</strong>.
      </p>

      <h2 className="mt-8 font-serif text-[24px] font-medium tracking-[-0.01em] text-ink">
        4. Données personnelles et données de santé
      </h2>
      <p>
        Le fichier ADN de l&apos;utilisateur est traité <strong>localement dans le navigateur</strong>. Aucun
        envoi serveur, aucune télémétrie sur le contenu génétique, aucun stockage distant. Voir la{" "}
        <a href="/legal/privacy" className="underline underline-offset-2">Politique de confidentialité</a> pour
        le détail.
      </p>

      <h2 className="mt-8 font-serif text-[24px] font-medium tracking-[-0.01em] text-ink">
        5. Propriété intellectuelle
      </h2>
      <p>
        Les bases annotatives citées (ClinVar NIH, CPIC, DPWG, PGS Catalog) sont la propriété de leurs éditeurs
        respectifs et sont utilisées conformément à leurs licences publiques. Le code source de DNAI est publié
        sous licence open-source (voir le dépôt public).
      </p>

      <h2 className="mt-8 font-serif text-[24px] font-medium tracking-[-0.01em] text-ink">
        6. Responsabilité
      </h2>
      <p>
        L&apos;utilisation de DNAI se fait sous la responsabilité exclusive de l&apos;utilisateur. Dans la
        mesure permise par la loi applicable, l&apos;éditeur décline toute responsabilité pour les décisions
        prises par l&apos;utilisateur sur la base des informations affichées. En cas de doute, consulter un
        médecin ou un conseiller en génétique.
      </p>

      <h2 className="mt-8 font-serif text-[24px] font-medium tracking-[-0.01em] text-ink">
        7. Acceptation
      </h2>
      <p>
        L&apos;utilisation du service implique l&apos;acceptation préalable et explicite des présentes
        conditions, de la Politique de confidentialité, et de l&apos;avertissement « ceci n&apos;est pas un
        diagnostic médical ». L&apos;acceptation est consignée localement dans le navigateur.
      </p>

      <p className="mt-10 text-[12.5px] text-ink/55">
        Contact : contact@dnai.health — toute question sur ces conditions ou toute demande relative au
        service peut être adressée à cette adresse.
      </p>
    </div>
  );
}

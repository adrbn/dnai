export const metadata = {
  title: "Politique de confidentialité — DNAI",
};

export default function PrivacyPage() {
  return (
    <div className="space-y-6 text-[15px] leading-relaxed text-ink/80">
      <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-oxblood">Légal</div>
      <h1 className="font-serif text-[40px] font-medium leading-[1.05] tracking-[-0.02em] text-ink">
        Politique de confidentialité
      </h1>
      <p className="text-[12px] uppercase tracking-[0.2em] text-ink/55">
        Version 2026-04-v1 — en vigueur au 24 avril 2026
      </p>

      <p className="border-l-2 border-sage bg-sage/10 p-4 text-[13.5px] text-ink/75">
        <strong>Principe directeur :</strong> votre fichier ADN ne quitte jamais votre navigateur. Aucun envoi
        serveur, aucun upload, aucune télémétrie sur les données génétiques. Le traitement est 100 % local.
      </p>

      <h2 className="mt-10 font-serif text-[24px] font-medium tracking-[-0.01em] text-ink">
        1. Données traitées localement
      </h2>
      <p>
        Lorsque vous déposez un fichier ADN dans DNAI, celui-ci est lu uniquement par le code JavaScript chargé
        dans votre navigateur. Le parsing, le matching des variants contre les bases annotatives, et la
        génération du rapport s&apos;effectuent dans la mémoire de l&apos;onglet. Aucun fragment du fichier
        n&apos;est transmis à un serveur de DNAI ni à un tiers.
      </p>

      <h2 className="mt-8 font-serif text-[24px] font-medium tracking-[-0.01em] text-ink">
        2. Stockage local
      </h2>
      <p>
        Les seules données conservées entre deux visites sont :
      </p>
      <ul className="ml-5 list-disc space-y-1">
        <li>L&apos;acceptation de l&apos;avertissement légal (clé <code>dnai.consent.v1</code>) ;</li>
        <li>
          Le cas échéant, un jeton confirmant le déverrouillage du rapport (clé <code>dnai.unlocked.v1</code>) ;
        </li>
        <li>
          Aucune donnée génétique n&apos;est persistée : le fichier et les résultats sont effacés à la fermeture
          de l&apos;onglet.
        </li>
      </ul>

      <h2 className="mt-8 font-serif text-[24px] font-medium tracking-[-0.01em] text-ink">
        3. Télémétrie et analytics
      </h2>
      <p>
        DNAI n&apos;embarque aucun tracker, aucune balise publicitaire, aucun script d&apos;analytics
        propriétaire qui transmettrait vos données génétiques. Si un outil d&apos;audience (type Plausible,
        anonymisé, sans cookies) est ajouté, cela sera indiqué ici.
      </p>

      <h2 className="mt-8 font-serif text-[24px] font-medium tracking-[-0.01em] text-ink">
        4. Cadre réglementaire
      </h2>
      <p>
        Les données génétiques sont des données de santé sensibles au sens de l&apos;article 9 du RGPD. DNAI a
        été conçu pour ne pas les collecter : le traitement étant exclusivement local au navigateur, DNAI
        n&apos;est pas responsable de traitement au sens du RGPD pour ces données. En France, l&apos;article
        16-10 du Code civil encadre l&apos;examen des caractéristiques génétiques d&apos;une personne à des
        fins médicales : DNAI <strong>ne réalise pas</strong> un tel examen et ne se substitue pas à un
        laboratoire agréé.
      </p>

      <h2 className="mt-8 font-serif text-[24px] font-medium tracking-[-0.01em] text-ink">
        5. Exercice des droits
      </h2>
      <p>
        Les droits d&apos;accès, de rectification et d&apos;effacement s&apos;exercent directement dans votre
        navigateur : il suffit d&apos;effacer les données du site (storage local) ou de fermer
        l&apos;onglet pour supprimer l&apos;intégralité des informations traitées. Aucune action de notre part
        n&apos;est requise puisqu&apos;aucune donnée n&apos;est stockée en dehors de votre appareil.
      </p>

      <h2 className="mt-8 font-serif text-[24px] font-medium tracking-[-0.01em] text-ink">
        6. Contact
      </h2>
      <p>
        Pour toute question : contact@dnai.health.
      </p>
    </div>
  );
}

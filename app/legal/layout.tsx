import Link from "next/link";
import type { ReactNode } from "react";

export const metadata = {
  title: "Mentions légales — DNAI",
};

export default function LegalLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-paper text-ink">
      <header className="border-b border-ink/10">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
          <Link href="/" className="font-serif text-lg tracking-[-0.01em]">
            dnai
          </Link>
          <nav className="flex gap-5 text-[12px] uppercase tracking-[0.18em] text-ink/60">
            <Link href="/legal/terms" className="hover:text-ink">Conditions</Link>
            <Link href="/legal/privacy" className="hover:text-ink">Confidentialité</Link>
            <Link href="/legal/notice" className="hover:text-ink">Mentions</Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-6 py-16">
        <article className="prose-legal">{children}</article>
      </main>
      <footer className="border-t border-ink/10">
        <div className="mx-auto max-w-5xl px-6 py-10 text-[12px] leading-relaxed text-ink/55">
          <p>
            <strong className="text-ink/75">DNAI — outil éducatif, pas un dispositif médical.</strong> Les
            informations affichées par DNAI sont issues de bases publiques (ClinVar, CPIC, DPWG, PGS Catalog) et
            présentées à titre d&apos;information générale. Elles ne constituent ni un diagnostic, ni une
            recommandation thérapeutique, et ne remplacent pas une consultation médicale ni un test génétique
            clinique accrédité.
          </p>
        </div>
      </footer>
    </div>
  );
}

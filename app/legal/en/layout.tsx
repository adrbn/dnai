import Link from "next/link";
import type { ReactNode } from "react";

export const metadata = {
  title: "Legal — DNAI",
};

export default function LegalEnLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-paper text-ink">
      <header className="border-b border-ink/10">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
          <Link href="/" className="font-serif text-lg tracking-[-0.01em]">
            dnai
          </Link>
          <div className="flex items-center gap-6">
            <nav className="flex gap-5 text-[12px] uppercase tracking-[0.18em] text-ink/60">
              <Link href="/legal/en/terms" className="hover:text-ink">Terms</Link>
              <Link href="/legal/en/privacy" className="hover:text-ink">Privacy</Link>
              <Link href="/legal/en/notice" className="hover:text-ink">Notice</Link>
            </nav>
            <div className="flex items-center gap-1 text-[11px] uppercase tracking-[0.18em]">
              <Link href="/legal/terms" className="text-ink/45 hover:text-ink">FR</Link>
              <span className="text-ink/25">·</span>
              <span className="text-ink">EN</span>
            </div>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-6 py-16">
        <article className="prose-legal">{children}</article>
      </main>
      <footer className="border-t border-ink/10">
        <div className="mx-auto max-w-5xl px-6 py-10 text-[12px] leading-relaxed text-ink/55">
          <p>
            <strong className="text-ink/75">DNAI — educational tool, not a medical device.</strong> Information
            displayed by DNAI comes from public databases (ClinVar, CPIC, DPWG, PGS Catalog) and is presented for
            general informational purposes. It does not constitute a diagnosis or a therapeutic recommendation, and
            does not replace a medical consultation or an accredited clinical genetic test.
          </p>
        </div>
      </footer>
    </div>
  );
}

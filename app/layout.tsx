import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DNAI — Rapport ADN client-side",
  description:
    "Analyse de données ADN raw (MyHeritage) 100% dans votre navigateur. Aucune donnée n'est envoyée.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className="dark">
      <body className="min-h-screen font-sans antialiased">{children}</body>
    </html>
  );
}

import type { Metadata } from "next";
import "./globals.css";
import "./dynamic.css";
import "./mobile.css";

export const metadata: Metadata = {
  title: "Planning des fêtes · 2026",
  description: "Le planning familial des fêtes de Tichri.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}

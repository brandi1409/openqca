import type { Metadata } from "next";
import "./globals.css";
import { SiteFooter } from "@/components/SiteFooter";
import { CookieConsent } from "@/components/CookieConsent";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://openqca.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "openQCA — Qualitative Comparative Analysis",
    template: "%s · openQCA",
  },
  description:
    "Quelloffenes, reproduzierbares QCA-Werkzeug: geführte Kalibrierung, Truth Table, Minimierung — lokal im Browser.",
  applicationName: "openQCA",
  keywords: [
    "QCA",
    "Qualitative Comparative Analysis",
    "fsQCA",
    "Fuzzy Sets",
    "Truth Table",
    "Kalibrierung",
    "Sozialwissenschaften",
  ],
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: "openQCA",
    title: "openQCA — Qualitative Comparative Analysis",
    description:
      "Das offene, geführte Werkzeug für QCA: Kalibrierung mit Live-Coach, Truth Table, Minimierung, reproduzierbares Protokoll — Ihre Daten bleiben im Browser.",
    locale: "de_DE",
  },
  twitter: {
    card: "summary",
    title: "openQCA — Qualitative Comparative Analysis",
    description:
      "Das offene, geführte Werkzeug für QCA — local-first, reproduzierbar, Open Source.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="de" className="h-full antialiased">
      <body className="min-h-full">
        {children}
        <SiteFooter />
        <CookieConsent />
      </body>
    </html>
  );
}

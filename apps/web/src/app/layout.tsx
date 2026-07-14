import type { Metadata } from "next";
import "./globals.css";
import { SiteFooter } from "@/components/SiteFooter";
import { CookieConsent } from "@/components/CookieConsent";

export const metadata: Metadata = {
  title: "openQCA — Qualitative Comparative Analysis",
  description:
    "Quelloffenes, reproduzierbares QCA-Werkzeug: geführte Kalibrierung, Truth Table, Minimierung — lokal im Browser.",
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

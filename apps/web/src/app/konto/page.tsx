"use client";

import { useEffect, useState } from "react";
import { cloudEnabled } from "@/lib/config";
import { AccountButton, useUser } from "@/components/cloud";
import { useLocale } from "@/i18n/locale";
import { t } from "@/i18n/dict";

export default function AccountPage() {
  const [locale] = useLocale();
  const user = useUser();
  const [checkout, setCheckout] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setCheckout(params.get("checkout"));
  }, []);

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "32px 26px 80px" }}>
      <a href="/app" style={{ fontSize: 13.5, color: "var(--accent-deep)", textDecoration: "none" }}>{t(locale, "common.backToApp")}</a>
      <h1 style={{ fontSize: 20, fontWeight: 700, margin: "14px 0 6px" }}>{t(locale, "account.title")}</h1>

      {checkout === "success" && (
        <p style={{ fontSize: 15, color: "var(--good-text)", fontWeight: 600 }}>
          {t(locale, "account.checkoutSuccess")}
        </p>
      )}

      {!cloudEnabled ? (
        <p style={{ color: "var(--ink-2)" }}>
          {t(locale, "account.notConfigured")}
        </p>
      ) : user ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 10 }}>
          <p style={{ color: "var(--ink-2)", margin: 0 }}>{t(locale, "account.signedInPre")}<b>{user.email}</b>.</p>
          <div><AccountButton /></div>
          <a href="/preise" style={{ fontSize: 13.5, color: "var(--accent-deep)" }}>{t(locale, "account.viewPricing")}</a>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 10 }}>
          <p style={{ color: "var(--ink-2)", margin: 0 }}>{t(locale, "account.signInPrompt")}</p>
          <div><AccountButton /></div>
        </div>
      )}
    </div>
  );
}

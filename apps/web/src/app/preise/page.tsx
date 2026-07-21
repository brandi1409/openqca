"use client";

import { useState } from "react";
import { stripeEnabledClient } from "@/lib/config";
import { useUser } from "@/components/cloud";
import { useLocale } from "@/i18n/locale";
import { t } from "@/i18n/dict";

export default function PricingPage() {
  const [locale] = useLocale();
  const user = useUser();
  const [note, setNote] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function checkout(plan: "monthly" | "institution") {
    setBusy(true);
    setNote(null);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, userId: user?.id, email: user?.email }),
      });
      const json = await res.json();
      if (res.ok && json.url) window.location.href = json.url as string;
      else setNote((json.error as string) ?? t(locale, "pricing.checkoutUnavailable"));
    } catch {
      setNote(t(locale, "pricing.networkError"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ maxWidth: 880, margin: "0 auto", padding: "32px 26px 80px" }}>
      <a href="/app" style={{ fontSize: 13.5, color: "var(--accent-deep)", textDecoration: "none" }}>{t(locale, "common.backToApp")}</a>
      <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-0.01em", margin: "14px 0 6px" }}>{t(locale, "pricing.title")}</h1>
      <p style={{ color: "var(--ink-2)", maxWidth: "60ch", marginTop: 0 }}>
        {t(locale, "pricing.intro")}
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16, marginTop: 24 }}>
        <Tier tag={t(locale, "pricing.free.tag")} name={t(locale, "pricing.free.name")} price={t(locale, "pricing.free.price")}>
          <li>{t(locale, "pricing.free.li1")}</li>
          <li>{t(locale, "pricing.free.li2")}</li>
          <li>{t(locale, "pricing.free.li3")}</li>
          <li>{t(locale, "pricing.free.li4")}</li>
          <li>{t(locale, "pricing.free.li5")}</li>
        </Tier>
        <Tier tag={t(locale, "pricing.cloud.tag")} name={t(locale, "pricing.cloud.name")} price={t(locale, "pricing.cloud.price")} highlight>
          <li>{t(locale, "pricing.cloud.li1")}</li>
          <li>{t(locale, "pricing.cloud.li2")}</li>
          <li>{t(locale, "pricing.cloud.li3")}</li>
          <li>{t(locale, "pricing.cloud.li4")}</li>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 14 }}>
            {stripeEnabledClient ? (
              <>
                <button onClick={() => checkout("monthly")} disabled={busy} className="oq-btn oq-btn--primary" style={ctaSize}>{t(locale, "pricing.cta.monthly")}</button>
                <button onClick={() => checkout("institution")} disabled={busy} className="oq-btn oq-btn--secondary" style={ctaSize}>{t(locale, "pricing.cta.institution")}</button>
              </>
            ) : (
              <>
                <button disabled className="oq-btn oq-btn--primary" style={ctaSize}>{t(locale, "pricing.cta.soon")}</button>
                <p style={{ fontSize: 13.5, color: "var(--muted)", margin: 0 }}>
                  {t(locale, "pricing.soonNote")}
                </p>
              </>
            )}
          </div>
        </Tier>
      </div>

      {note && <p style={{ fontSize: 13.5, color: "var(--muted)", marginTop: 12 }}>{note}</p>}
    </div>
  );
}

function Tier({ tag, name, price, highlight, children }: { tag: string; name: string; price: string; highlight?: boolean; children: React.ReactNode }) {
  return (
    <div
      style={{
        border: highlight ? "1px solid color-mix(in srgb, var(--accent) 35%, transparent)" : "1px solid var(--line)",
        boxShadow: highlight ? "inset 0 0 0 1px color-mix(in srgb, var(--accent) 20%, transparent)" : "none",
        borderRadius: 12,
        padding: "18px 20px",
        background: "var(--panel)",
      }}
    >
      <div style={{ fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase", fontWeight: 700, color: highlight ? "var(--accent-deep)" : "var(--good-text)" }}>{tag}</div>
      <h2 style={{ fontSize: 16.5, fontWeight: 600, margin: "4px 0 3px" }}>{name}</h2>
      <div style={{ fontSize: 13.5, color: "var(--muted)", marginBottom: 12 }}>{price}</div>
      <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 7, fontSize: 13.5 }}>{children}</ul>
    </div>
  );
}

// Sondermaß für die CTA-Größe der Preiskarte; Basisstil kommt aus .oq-btn(--primary/--secondary).
const ctaSize: React.CSSProperties = { fontSize: 13.5, padding: "9px 14px" };

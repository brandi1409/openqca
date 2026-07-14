"use client";

import { useState } from "react";
import { stripeEnabledClient } from "@/lib/config";
import { useUser } from "@/components/cloud";

export default function PricingPage() {
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
      else setNote((json.error as string) ?? "Checkout nicht verfügbar.");
    } catch {
      setNote("Netzwerkfehler.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ maxWidth: 880, margin: "0 auto", padding: "32px 26px 80px" }}>
      <a href="/" style={{ fontSize: 13, color: "var(--accent-deep)", textDecoration: "none" }}>← zurück zur App</a>
      <h1 style={{ fontSize: 26, fontWeight: 680, letterSpacing: "-0.01em", margin: "14px 0 6px" }}>Tarife</h1>
      <p style={{ color: "var(--ink-2)", maxWidth: "60ch", marginTop: 0 }}>
        Der komplette Analysekern ist und bleibt kostenlos — im Browser und als Download. Bezahlt wird nur, was
        echte Kosten verursacht: sichere Cloud-Speicherung und die KI-Assistenten.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 24 }}>
        <Tier tag="Gratis · für immer" name="openQCA Local" price="0 €">
          <li>Voller Analysekern &amp; geführte Kalibrierung</li>
          <li>Truth Table, Minimierung, XY-Plots</li>
          <li>Reproduzierbarkeits-Protokoll &amp; R-Export</li>
          <li>Daten bleiben zu 100 % auf dem Gerät</li>
          <li>Website &amp; Desktop-App</li>
        </Tier>
        <Tier tag="Cloud-Tarif" name="openQCA Cloud" price="Abo" highlight>
          <li>Sichere Projekt-Datenbank &amp; Sync</li>
          <li>KI-Assistent: Anker, Interpretation</li>
          <li>KI entwirft den Methoden-Absatz</li>
          <li>Geteilte Projekte &amp; Kollaboration</li>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 14 }}>
            <button onClick={() => checkout("monthly")} disabled={busy} style={cta(true)}>Monatlich abonnieren</button>
            <button onClick={() => checkout("institution")} disabled={busy} style={cta(false)}>Institutions-Lizenz</button>
          </div>
        </Tier>
      </div>

      {!stripeEnabledClient && (
        <p style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 16 }}>
          Hinweis: Zahlungen sind in dieser Instanz noch nicht konfiguriert (Stripe-Schlüssel fehlt).
        </p>
      )}
      {note && <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 12 }}>{note}</p>}
    </div>
  );
}

function Tier({ tag, name, price, highlight, children }: { tag: string; name: string; price: string; highlight?: boolean; children: React.ReactNode }) {
  return (
    <div
      style={{
        border: highlight ? "1px solid color-mix(in srgb, var(--accent) 35%, transparent)" : "1px solid var(--line)",
        boxShadow: highlight ? "inset 0 0 0 1px color-mix(in srgb, var(--accent) 20%, transparent)" : "none",
        borderRadius: 13,
        padding: "18px 20px",
        background: "var(--panel)",
      }}
    >
      <div style={{ fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase", fontWeight: 700, color: highlight ? "var(--accent-deep)" : "var(--good-text)" }}>{tag}</div>
      <h2 style={{ fontSize: 17, fontWeight: 650, margin: "4px 0 3px" }}>{name}</h2>
      <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 12 }}>{price}</div>
      <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 7, fontSize: 13.5 }}>{children}</ul>
    </div>
  );
}

function cta(primary: boolean): React.CSSProperties {
  return {
    font: "inherit",
    fontWeight: 600,
    fontSize: 13.5,
    borderRadius: 8,
    padding: "9px 14px",
    cursor: "pointer",
    border: primary ? "1px solid var(--accent)" : "1px solid var(--line)",
    background: primary ? "var(--accent)" : "var(--panel-2)",
    color: primary ? "#fff" : "var(--ink)",
  };
}

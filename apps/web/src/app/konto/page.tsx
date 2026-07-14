"use client";

import { useEffect, useState } from "react";
import { cloudEnabled } from "@/lib/config";
import { AccountButton, useUser } from "@/components/cloud";

export default function AccountPage() {
  const user = useUser();
  const [checkout, setCheckout] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setCheckout(params.get("checkout"));
  }, []);

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "32px 26px 80px" }}>
      <a href="/" style={{ fontSize: 13, color: "var(--accent-deep)", textDecoration: "none" }}>← zurück zur App</a>
      <h1 style={{ fontSize: 24, fontWeight: 680, margin: "14px 0 6px" }}>Konto</h1>

      {checkout === "success" && (
        <p style={{ fontSize: 14, color: "var(--good-text)", fontWeight: 600 }}>
          Danke — dein Cloud-Abo ist aktiv (nach Verarbeitung durch Stripe kann es einen Moment dauern).
        </p>
      )}

      {!cloudEnabled ? (
        <p style={{ color: "var(--ink-2)" }}>
          Die Cloud-Funktionen (Konto, Sync, KI) sind in dieser Instanz noch nicht konfiguriert. Der kostenlose
          Analysekern funktioniert vollständig ohne Konto.
        </p>
      ) : user ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 10 }}>
          <p style={{ color: "var(--ink-2)", margin: 0 }}>Angemeldet als <b>{user.email}</b>.</p>
          <div><AccountButton /></div>
          <a href="/preise" style={{ fontSize: 13.5, color: "var(--accent-deep)" }}>Tarife ansehen →</a>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 10 }}>
          <p style={{ color: "var(--ink-2)", margin: 0 }}>Melde dich an, um Projekte in der Cloud zu speichern und KI-Funktionen zu nutzen.</p>
          <div><AccountButton /></div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { useLocale, type Locale } from "@/i18n/locale";
import { t, type DictKey } from "@/i18n/dict";

/**
 * Minimaler Ausschnitt des `beforeinstallprompt`-Events (nicht Teil des
 * DOM-Standard-Typsatzes). Chrome/Edge/Android feuern es, wenn die
 * Installationskriterien einer PWA erfüllt sind.
 */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

/**
 * "/download" — erklärt, wie openQCA lokal genutzt werden kann: heute als
 * installierbare, offline-fähige PWA; Desktop-Installer (Tauri) folgen.
 * Fängt `beforeinstallprompt` ab, um einen echten Install-Button anzubieten;
 * ohne dieses Event (Safari, iOS, bereits installiert, …) werden stattdessen
 * knappe Anleitungen je Browser gezeigt.
 */
export function DownloadPage() {
  const [locale] = useLocale();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    function onBeforeInstallPrompt(event: Event) {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    }
    function onAppInstalled() {
      setInstalled(true);
      setDeferredPrompt(null);
    }
    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onAppInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, []);

  async function handleInstall() {
    if (!deferredPrompt) return;
    try {
      await deferredPrompt.prompt();
      await deferredPrompt.userChoice;
    } catch {
      // Nutzer hat abgebrochen oder der Prompt ist nicht mehr gültig —
      // unkritisch, der Button verschwindet ohnehin danach.
    } finally {
      setDeferredPrompt(null);
    }
  }

  return (
    <div style={pageStyle}>
      <a href="/" style={backLinkStyle}>
        {t(locale, "download.back")}
      </a>

      <h1 style={titleStyle}>{t(locale, "download.title")}</h1>
      <p style={introStyle}>{t(locale, "download.intro")}</p>

      <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 24 }}>
        <Card title={t(locale, "download.install.title")}>
          {!installed && deferredPrompt ? (
            <button type="button" onClick={handleInstall} style={installButtonStyle}>
              {t(locale, "download.install.button")}
            </button>
          ) : (
            <InstallGuides locale={locale} />
          )}
          <p style={noteStyle}>{t(locale, "download.install.offlineNote")}</p>
        </Card>

        <Card title={t(locale, "download.desktop.title")}>
          <span style={statusBadgeStyle}>{t(locale, "download.desktop.status")}</span>
          <p style={cardBodyStyle}>{t(locale, "download.desktop.body")}</p>
        </Card>

        <Card title={t(locale, "download.source.title")}>
          <p style={cardBodyStyle}>{t(locale, "download.source.body")}</p>
          <a
            href="https://github.com/brandi1409/openqca"
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontSize: 13.5, color: "var(--accent-deep)", textDecoration: "none", fontWeight: 600 }}
          >
            {t(locale, "download.source.link")}
          </a>
        </Card>
      </div>
    </div>
  );
}

function InstallGuides({ locale }: { locale: Locale }) {
  const guides: [DictKey, DictKey][] = [
    ["download.install.chrome.title", "download.install.chrome.desc"],
    ["download.install.safari.title", "download.install.safari.desc"],
    ["download.install.ios.title", "download.install.ios.desc"],
    ["download.install.android.title", "download.install.android.desc"],
  ];
  return (
    <div>
      <p style={{ ...cardBodyStyle, marginBottom: 10 }}>{t(locale, "download.install.guidesIntro")}</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {guides.map(([title, desc]) => (
          <details key={title} style={detailsStyle}>
            <summary style={summaryStyle}>{t(locale, title)}</summary>
            <p style={{ ...cardBodyStyle, margin: "8px 0 0" }}>{t(locale, desc)}</p>
          </details>
        ))}
      </div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section style={cardStyle}>
      <h2 style={cardTitleStyle}>{title}</h2>
      {children}
    </section>
  );
}

const pageStyle: CSSProperties = {
  maxWidth: 880,
  margin: "0 auto",
  padding: "32px 26px 96px",
};

const backLinkStyle: CSSProperties = {
  display: "inline-block",
  fontSize: 13,
  color: "var(--accent-deep)",
  textDecoration: "none",
  marginBottom: 18,
};

const titleStyle: CSSProperties = {
  fontSize: 26,
  fontWeight: 680,
  letterSpacing: "-0.01em",
  margin: "0 0 10px",
};

const introStyle: CSSProperties = {
  color: "var(--ink-2)",
  fontSize: 15,
  lineHeight: 1.6,
  maxWidth: "62ch",
  margin: 0,
};

const cardStyle: CSSProperties = {
  background: "var(--panel)",
  border: "1px solid var(--line)",
  borderRadius: 13,
  padding: "20px 22px",
};

const cardTitleStyle: CSSProperties = {
  fontSize: 17,
  fontWeight: 660,
  margin: "0 0 12px",
};

const cardBodyStyle: CSSProperties = {
  fontSize: 14,
  lineHeight: 1.55,
  color: "var(--ink-2)",
  margin: 0,
};

const noteStyle: CSSProperties = {
  fontSize: 13,
  color: "var(--muted)",
  marginTop: 14,
  marginBottom: 0,
};

const installButtonStyle: CSSProperties = {
  font: "inherit",
  fontWeight: 600,
  fontSize: 14.5,
  borderRadius: 8,
  padding: "10px 18px",
  cursor: "pointer",
  border: "1px solid var(--accent)",
  background: "var(--accent)",
  color: "#fff",
};

const statusBadgeStyle: CSSProperties = {
  display: "inline-block",
  fontSize: 12,
  fontWeight: 700,
  letterSpacing: "0.03em",
  textTransform: "uppercase",
  color: "var(--accent-deep)",
  background: "var(--accent-wash)",
  border: "1px solid var(--line)",
  borderRadius: 999,
  padding: "4px 11px",
  marginBottom: 10,
};

const detailsStyle: CSSProperties = {
  border: "1px solid var(--line)",
  borderRadius: 8,
  padding: "9px 13px",
  background: "var(--panel-2)",
};

const summaryStyle: CSSProperties = {
  fontSize: 14,
  fontWeight: 600,
  color: "var(--ink)",
  cursor: "pointer",
};

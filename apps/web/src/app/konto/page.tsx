"use client";

import { useCallback, useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabase";
import { cloudEnabled } from "@/lib/config";
import { AccountButton, useUser } from "@/components/cloud";
import { useLocale } from "@/i18n/locale";
import { t } from "@/i18n/dict";

type Tier = "free" | "cloud";
type ProjectRow = { id: string; name: string; updated_at: string };

// Tarif-Badge (Pill, Radius 999); neutral für „free“, Akzentfarbe für „cloud“.
const pillBase: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  borderRadius: 999,
  padding: "3px 11px",
  display: "inline-block",
};
const pillNeutral: React.CSSProperties = {
  ...pillBase,
  color: "var(--muted)",
  border: "1px solid var(--line)",
};
const pillCloud: React.CSSProperties = {
  ...pillBase,
  color: "var(--accent-deep)",
  background: "var(--accent-wash)",
  border: "1px solid color-mix(in srgb, var(--accent-deep) 35%, transparent)",
};

// Karten-Rahmen für die Konto-Abschnitte; Radius 12 laut Designsystem.
const card: React.CSSProperties = {
  border: "1px solid var(--line)",
  borderRadius: 12,
  padding: "18px 20px",
  background: "var(--panel)",
};
const cardTitle: React.CSSProperties = { fontSize: 16.5, fontWeight: 600, margin: "0 0 10px" };
const smallBtn: React.CSSProperties = { fontSize: 13.5, padding: "5px 12px" };
const actionBtn: React.CSSProperties = { fontSize: 13.5, padding: "8px 14px" };
const input: React.CSSProperties = {
  font: "inherit",
  fontSize: 13.5,
  border: "1px solid var(--line)",
  borderRadius: 8,
  padding: "5px 9px",
  background: "var(--panel-2)",
  color: "var(--ink)",
};

export default function AccountPage() {
  const [locale] = useLocale();
  const user = useUser();
  const [checkout, setCheckout] = useState<string | null>(null);

  const [tier, setTier] = useState<Tier | null>(null);
  const [tierLoading, setTierLoading] = useState(true);

  const [portalBusy, setPortalBusy] = useState(false);
  const [portalError, setPortalError] = useState<string | null>(null);

  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [projectsNote, setProjectsNote] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const params = new URLSearchParams(window.location.search);
      setCheckout(params.get("checkout"));
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const loadTier = useCallback(async () => {
    const sb = getSupabase();
    if (!sb || !user) return;
    setTierLoading(true);
    const { data } = await sb.from("profiles").select("tier").eq("user_id", user.id).single();
    setTier((data?.tier as Tier | undefined) ?? "free");
    setTierLoading(false);
  }, [user]);

  const loadProjects = useCallback(async () => {
    const sb = getSupabase();
    if (!sb || !user) return;
    setProjectsLoading(true);
    const { data } = await sb
      .from("projects")
      .select("id,name,updated_at")
      .order("updated_at", { ascending: false });
    setProjects((data as ProjectRow[]) ?? []);
    setProjectsLoading(false);
  }, [user]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadTier();
      void loadProjects();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadTier, loadProjects]);

  async function manageSubscription() {
    const sb = getSupabase();
    if (!sb) return;
    setPortalBusy(true);
    setPortalError(null);
    try {
      const {
        data: { session },
      } = await sb.auth.getSession();
      const token = session?.access_token;
      const res = await fetch("/api/stripe/portal", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      const json = await res.json();
      if (res.ok && json.url) {
        window.location.href = json.url as string;
      } else {
        setPortalError((json.error as string) ?? t(locale, "account.subscription.error"));
      }
    } catch {
      setPortalError(t(locale, "pricing.networkError"));
    } finally {
      setPortalBusy(false);
    }
  }

  function startRename(p: ProjectRow) {
    setProjectsNote(null);
    setEditingId(p.id);
    setEditName(p.name);
  }
  function cancelRename() {
    setEditingId(null);
  }
  async function saveRename(id: string) {
    const sb = getSupabase();
    if (!sb || !editName.trim()) return;
    const { error } = await sb.from("projects").update({ name: editName.trim() }).eq("id", id);
    if (error) {
      setProjectsNote(t(locale, "account.projects.renameError"));
    } else {
      setEditingId(null);
      void loadProjects();
    }
  }
  async function deleteProject(p: ProjectRow) {
    if (!window.confirm(t(locale, "account.projects.deleteConfirm", { name: p.name }))) return;
    const sb = getSupabase();
    if (!sb) return;
    const { error } = await sb.from("projects").delete().eq("id", p.id);
    if (error) setProjectsNote(t(locale, "account.projects.deleteError"));
    else void loadProjects();
  }
  async function exportAll() {
    const sb = getSupabase();
    if (!sb || !user) return;
    const { data, error } = await sb
      .from("projects")
      .select("id,name,data,updated_at")
      .order("updated_at", { ascending: false });
    if (error || !data) {
      setProjectsNote(t(locale, "account.projects.exportError"));
      return;
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "openqca-projekte.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function deleteAccount() {
    if (!window.confirm(t(locale, "account.danger.confirmMsg"))) return;
    const sb = getSupabase();
    if (!sb) return;
    setDeleteBusy(true);
    setDeleteError(null);
    try {
      const {
        data: { session },
      } = await sb.auth.getSession();
      const token = session?.access_token;
      const res = await fetch("/api/account/delete", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      const json = await res.json();
      if (res.ok && json.ok) {
        await sb.auth.signOut();
        window.location.href = "/";
      } else {
        setDeleteError((json.error as string) ?? t(locale, "account.danger.error"));
      }
    } catch {
      setDeleteError(t(locale, "pricing.networkError"));
    } finally {
      setDeleteBusy(false);
    }
  }

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "32px 26px 80px" }}>
      <a href="/app" style={{ fontSize: 13.5, color: "var(--accent-deep)", textDecoration: "none" }}>
        {t(locale, "common.backToApp")}
      </a>
      <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-0.01em", margin: "14px 0 6px" }}>
        {t(locale, "account.title")}
      </h1>

      {checkout === "success" && (
        <p style={{ fontSize: 15, color: "var(--good-text)", fontWeight: 600 }}>
          {t(locale, "account.checkoutSuccess")}
        </p>
      )}
      {checkout === "cancel" && (
        <p style={{ fontSize: 13.5, color: "var(--muted)" }}>{t(locale, "account.checkoutCancel")}</p>
      )}

      {!cloudEnabled ? (
        <p style={{ color: "var(--ink-2)" }}>{t(locale, "account.notConfigured")}</p>
      ) : user ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 20, marginTop: 10 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <p style={{ color: "var(--ink-2)", margin: 0 }}>
                {t(locale, "account.signedInPre")}
                <b>{user.email}</b>
              </p>
              <span style={!tierLoading && tier === "cloud" ? pillCloud : pillNeutral}>
                {tierLoading
                  ? t(locale, "account.tier.loading")
                  : t(locale, tier === "cloud" ? "account.tier.cloud" : "account.tier.free")}
              </span>
            </div>
            <div><AccountButton /></div>
            <a href="/preise" style={{ fontSize: 13.5, color: "var(--accent-deep)", textDecoration: "none" }}>
              {t(locale, "account.viewPricing")}
            </a>
          </div>

          <div style={card}>
            <h2 style={cardTitle}>{t(locale, "account.subscription.title")}</h2>
            <button
              className="oq-btn oq-btn--secondary"
              style={actionBtn}
              disabled={portalBusy}
              onClick={manageSubscription}
            >
              {t(locale, "account.subscription.manageBtn")}
            </button>
            {portalError && <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 8 }}>{portalError}</p>}
          </div>

          <div style={card}>
            <h2 style={cardTitle}>{t(locale, "account.projects.title")}</h2>
            {projectsLoading ? (
              <p style={{ fontSize: 13.5, color: "var(--muted)", margin: 0 }}>
                {t(locale, "account.projects.loading")}
              </p>
            ) : projects.length === 0 ? (
              <p style={{ fontSize: 13.5, color: "var(--muted)", margin: 0 }}>
                {t(locale, "account.projects.empty")}
              </p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {projects.map((p) => (
                  <div
                    key={p.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      flexWrap: "wrap",
                      padding: "8px 0",
                      borderBottom: "1px solid var(--line-soft)",
                    }}
                  >
                    {editingId === p.id ? (
                      <>
                        <input
                          style={{ ...input, flex: "1 1 200px" }}
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          autoFocus
                        />
                        <button className="oq-btn oq-btn--secondary" style={smallBtn} onClick={() => saveRename(p.id)}>
                          {t(locale, "account.projects.saveBtn")}
                        </button>
                        <button className="oq-btn oq-btn--quiet" style={smallBtn} onClick={cancelRename}>
                          {t(locale, "account.projects.cancelBtn")}
                        </button>
                      </>
                    ) : (
                      <>
                        <span style={{ flex: "1 1 200px", fontSize: 13.5 }}>{p.name}</span>
                        <span style={{ fontSize: 12, color: "var(--muted)" }}>
                          {new Date(p.updated_at).toLocaleString(locale === "de" ? "de-DE" : "en-US")}
                        </span>
                        <button className="oq-btn oq-btn--quiet" style={smallBtn} onClick={() => startRename(p)}>
                          {t(locale, "account.projects.renameBtn")}
                        </button>
                        <button
                          className="oq-btn oq-btn--quiet"
                          style={{ ...smallBtn, color: "var(--warn-text)" }}
                          onClick={() => deleteProject(p)}
                        >
                          {t(locale, "account.projects.deleteBtn")}
                        </button>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
            {projectsNote && <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 8 }}>{projectsNote}</p>}
            <div style={{ marginTop: 14 }}>
              <button className="oq-btn oq-btn--secondary" style={actionBtn} onClick={exportAll}>
                {t(locale, "account.projects.exportAllBtn")}
              </button>
            </div>
          </div>

          <div style={card}>
            <h2 style={cardTitle}>{t(locale, "account.danger.title")}</h2>
            <p style={{ fontSize: 13.5, color: "var(--ink-2)", marginTop: 0 }}>{t(locale, "account.danger.body")}</p>
            <button
              className="oq-btn oq-btn--secondary"
              style={{ ...actionBtn, color: "var(--warn-text)" }}
              disabled={deleteBusy}
              onClick={deleteAccount}
            >
              {t(locale, "account.danger.deleteBtn")}
            </button>
            {deleteError && <p style={{ fontSize: 12, color: "var(--warn-text)", marginTop: 8 }}>{deleteError}</p>}
          </div>
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

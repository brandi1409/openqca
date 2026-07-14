"use client";

import { useCallback, useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabase";
import { cloudEnabled } from "@/lib/config";
import { useLocale } from "@/i18n/locale";
import { t } from "@/i18n/dict";

const mutedBadge: React.CSSProperties = {
  fontSize: 11.5,
  color: "var(--muted)",
  border: "1px solid var(--line)",
  borderRadius: 20,
  padding: "3px 11px",
};
const btn: React.CSSProperties = {
  font: "inherit",
  fontSize: 13,
  fontWeight: 600,
  borderRadius: 7,
  padding: "5px 12px",
  cursor: "pointer",
  border: "1px solid var(--line)",
  background: "var(--panel)",
  color: "var(--ink)",
};
const input: React.CSSProperties = {
  font: "inherit",
  fontSize: 13,
  border: "1px solid var(--line)",
  borderRadius: 7,
  padding: "5px 9px",
  background: "var(--panel-2)",
  color: "var(--ink)",
};

export interface SessionUser {
  id: string;
  email: string | null;
}

export function useUser(): SessionUser | null {
  const [user, setUser] = useState<SessionUser | null>(null);
  useEffect(() => {
    const sb = getSupabase();
    if (!sb) return;
    sb.auth.getUser().then(({ data }) =>
      setUser(data.user ? { id: data.user.id, email: data.user.email ?? null } : null),
    );
    const { data: sub } = sb.auth.onAuthStateChange((_e, session) =>
      setUser(session?.user ? { id: session.user.id, email: session.user.email ?? null } : null),
    );
    return () => sub.subscription.unsubscribe();
  }, []);
  return user;
}

/** Anmelde-Button (Magic Link). Ohne Cloud-Konfiguration nur ein Hinweis-Badge. */
export function AccountButton() {
  const [locale] = useLocale();
  const user = useUser();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [open, setOpen] = useState(false);

  if (!cloudEnabled) return <span style={mutedBadge}>{t(locale, "cloud.notConfigured")}</span>;

  if (user) {
    return (
      <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 12.5, color: "var(--ink-2)" }}>{user.email}</span>
        <button style={btn} onClick={() => getSupabase()?.auth.signOut()}>{t(locale, "cloud.signOut")}</button>
      </span>
    );
  }

  async function sendLink() {
    const sb = getSupabase();
    if (!sb || !email) return;
    await sb.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin } });
    setSent(true);
  }

  if (!open) return <button style={btn} onClick={() => setOpen(true)}>{t(locale, "cloud.signIn")}</button>;
  if (sent) return <span style={{ fontSize: 12.5, color: "var(--ink-2)" }}>{t(locale, "cloud.linkSent", { email })}</span>;
  return (
    <span style={{ display: "inline-flex", gap: 6 }}>
      <input style={input} type="email" placeholder={t(locale, "cloud.emailPlaceholder")} value={email} onChange={(e) => setEmail(e.target.value)} />
      <button style={btn} onClick={sendLink}>{t(locale, "cloud.magicLink")}</button>
    </span>
  );
}

/** Projekt in der Cloud speichern/laden (nur angemeldet + Cloud aktiv). */
export function CloudSaveLoad({ getState, onLoad }: { getState: () => unknown; onLoad: (data: unknown) => void }) {
  const [locale] = useLocale();
  const user = useUser();
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const [status, setStatus] = useState<string>("");

  const refresh = useCallback(async () => {
    const sb = getSupabase();
    if (!sb || !user) return;
    const { data } = await sb.from("projects").select("id,name").order("updated_at", { ascending: false });
    setProjects((data as { id: string; name: string }[]) ?? []);
  }, [user]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  if (!cloudEnabled) return null;
  if (!user)
    return <p style={{ fontSize: 12.5, color: "var(--muted)", margin: "8px 0 0" }}>{t(locale, "cloud.saveLoadHint")}</p>;

  async function save() {
    const sb = getSupabase();
    if (!sb || !user) return;
    const name = window.prompt(t(locale, "cloud.projectNamePrompt"), t(locale, "cloud.projectNameDefault"));
    if (!name) return;
    const { error } = await sb.from("projects").insert({ user_id: user.id, name, data: getState() });
    setStatus(error ? t(locale, "cloud.saveError") : t(locale, "cloud.saveOk"));
    void refresh();
  }
  async function load(id: string) {
    const sb = getSupabase();
    if (!sb) return;
    const { data } = await sb.from("projects").select("data").eq("id", id).single();
    if (data?.data) onLoad(data.data);
  }

  return (
    <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, marginTop: 10 }}>
      <button style={btn} onClick={save}>{t(locale, "cloud.saveBtn")}</button>
      {projects.length > 0 && (
        <select
          style={input}
          defaultValue=""
          onChange={(e) => {
            if (e.target.value) void load(e.target.value);
          }}
        >
          <option value="">{t(locale, "cloud.loadPlaceholder")}</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      )}
      {status && <span style={{ fontSize: 12, color: "var(--muted)" }}>{status}</span>}
    </div>
  );
}

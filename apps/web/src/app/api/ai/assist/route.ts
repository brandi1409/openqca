import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { AI_MODELS } from "@/lib/config";

export const runtime = "nodejs";

const API_KEY = process.env.ANTHROPIC_API_KEY ?? "";

type AssistTask = "anchors" | "skew" | "methods";

interface AssistBody {
  task: AssistTask;
  context?: string;
  data?: Record<string, unknown>;
}

function buildPrompt(body: AssistBody): { model: string; system: string; prompt: string } {
  const d = body.data ?? {};
  switch (body.task) {
    case "anchors":
      return {
        model: AI_MODELS.light,
        system:
          "Du bist ein methodischer Assistent für Qualitative Comparative Analysis (QCA). Antworte auf Deutsch, knapp und praxisnah. Betone, dass Kalibrierungsanker inhaltlich/theoretisch begründet sein müssen, nicht rein datengetrieben.",
        prompt:
          `Bedingung: "${d.variable ?? "(unbenannt)"}" (${d.unit ?? "Einheit unbekannt"}).\n` +
          `Kurzbeschreibung der inhaltlichen Bedeutung: ${body.context ?? "(keine)"}\n` +
          `Wertebereich der Fälle: min ${d.min ?? "?"}, median ${d.median ?? "?"}, max ${d.max ?? "?"}.\n\n` +
          `Schlage drei Kalibrierungsanker für die direkte Methode vor (voll draußen = 0,05; Kreuzung = 0,50; voll drinnen = 0,95) und begründe jeden in einem kurzen Satz theoretisch/inhaltlich. Gib die drei Zahlen klar an.`,
      };
    case "skew":
      return {
        model: AI_MODELS.light,
        system:
          "Du bist ein methodischer Assistent für QCA. Antworte auf Deutsch, knapp und konkret.",
        prompt:
          `Von ${d.total ?? "?"} Fällen sind ${d.inside ?? "?"} „drinnen" (Zugehörigkeit > 0,5) und ${d.atHalf ?? 0} liegen exakt bei 0,5.\n` +
          `Erkläre in 2-3 Sätzen, was diese Verteilung für die Analyse bedeutet (Trennschärfe des Sets, ggf. Schiefe, ggf. 0,5-Problem) und was zu tun ist.`,
      };
    case "methods":
      return {
        model: AI_MODELS.writing,
        system:
          "Du bist ein wissenschaftlicher Autor. Schreibe einen präzisen, sachlichen Methoden-Absatz auf Deutsch, zitierfähig, ohne Übertreibung. Nur den Absatz ausgeben.",
        prompt:
          `Entwirf einen Methoden-Absatz zur Kalibrierung für eine QCA-Studie.\n` +
          `Bedingung: ${d.variable ?? "(unbenannt)"} (${d.unit ?? "Einheit unbekannt"}).\n` +
          `Methode: direkte Methode (Ragin 2008), Anker ${d.anchors ?? "(?)"} (voll draußen 0,05 / Kreuzung 0,50 / voll drinnen 0,95).\n` +
          `Zusätzliche Begründung des Nutzers: ${body.context ?? "(keine)"}\n` +
          `Von ${d.total ?? "?"} Fällen weisen ${d.inside ?? "?"} eine Zugehörigkeit > 0,5 auf.`,
      };
    default:
      throw new Error("Unbekannte Aufgabe.");
  }
}

export async function POST(request: Request) {
  if (!API_KEY) {
    return NextResponse.json(
      { error: "Die KI-Funktionen gehören zum Cloud-Tarif und sind ohne konfigurierten API-Schlüssel deaktiviert." },
      { status: 501 },
    );
  }
  let body: AssistBody;
  try {
    body = (await request.json()) as AssistBody;
  } catch {
    return NextResponse.json({ error: "Ungültige Anfrage." }, { status: 400 });
  }

  try {
    const { model, system, prompt } = buildPrompt(body);
    const client = new Anthropic({ apiKey: API_KEY });
    const message = await client.messages.create({
      model,
      max_tokens: 900,
      system,
      messages: [{ role: "user", content: prompt }],
    });
    const text = message.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("")
      .trim();
    return NextResponse.json({ text, model });
  } catch (err) {
    const detail = err instanceof Error ? err.message : "Unbekannter Fehler";
    return NextResponse.json({ error: `KI-Aufruf fehlgeschlagen: ${detail}` }, { status: 502 });
  }
}

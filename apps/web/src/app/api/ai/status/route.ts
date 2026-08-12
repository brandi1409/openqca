import { NextResponse } from "next/server";
import { AI_CONTRACT_VERSION } from "@/lib/ai-contract";
import { aiAssistAvailable } from "@/lib/ai-provider";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(
    {
      version: AI_CONTRACT_VERSION,
      available: aiAssistAvailable(),
    },
    {
      headers: { "Cache-Control": "no-store" },
    },
  );
}

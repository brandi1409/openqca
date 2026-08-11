import { NextResponse } from "next/server";

/** Liveness endpoint intentionally exposes no configuration, secrets, or user data. */
export function GET() {
  return NextResponse.json({ status: "ok" }, {
    headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" },
  });
}

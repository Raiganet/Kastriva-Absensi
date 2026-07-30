import { NextResponse } from "next/server";
import { readSessionNode } from "@/lib/session";
import { ROLE_META, visibleNav } from "@/lib/rbac";

export const runtime = "nodejs";

export async function GET() {
  const s = await readSessionNode();
  if (!s) return NextResponse.json({ ok: false }, { status: 401 });

  const meta = ROLE_META[s.role];
  return NextResponse.json({
    ok: true,
    email: s.email,
    role: s.role,
    meta: {
      label: meta.label,
      short: meta.short,
      tone: meta.tone,
      accent: meta.accent,
      readOnly: meta.readOnly,
      description: meta.description,
    },
    nav: visibleNav(s.role),
  });
}

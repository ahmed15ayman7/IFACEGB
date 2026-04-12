import { NextRequest, NextResponse } from "next/server";
import { runReconciliation } from "@/lib/reconciliation/reconciliation.service";
import { auth } from "@/lib/auth/auth.config";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "super_admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const result = await runReconciliation(session.user.id);
    return NextResponse.json({ success: true, snapshot: result.snapshot });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Reconciliation failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

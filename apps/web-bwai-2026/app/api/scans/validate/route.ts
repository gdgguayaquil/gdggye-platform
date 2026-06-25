import "server-only";

import { NextResponse, type NextRequest } from "next/server";

import {
  ScanRejected,
  validateAndRecordScan,
  verifyQrToken,
} from "@gdggye/backend-core";
import {
  buildScanDeps,
  createSupabaseServiceClient,
} from "@gdggye/supabase-adapters";

import { getCurrentAuthUser } from "@/lib/server/auth";

interface ScanRequestBody {
  token?: unknown;
}

function readQrSecret(): string {
  const secret = process.env.QR_SIGNING_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      "QR_SIGNING_SECRET is missing or too short (32+ chars required).",
    );
  }
  return secret;
}

// POST /api/scans/validate
//
// Thin Option A handler:
//   1. Auth → reject anonymous.
//   2. Verify the signed QR token → reject malformed/forged.
//   3. Hand the decoded target + the scanner identity to
//      validateAndRecordScan, which owns *all* business rules.
//   4. Map ScanRejected → 409 with `reason`; success → 200 with points.
//
// No business decisions live here. Adding one is a CLAUDE.md violation —
// move it into the use-case or the scoring rules.
export async function POST(req: NextRequest) {
  const authUser = await getCurrentAuthUser();
  if (!authUser) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  let body: ScanRequestBody;
  try {
    body = (await req.json()) as ScanRequestBody;
  } catch {
    return NextResponse.json({ error: "bad_json" }, { status: 400 });
  }
  if (typeof body.token !== "string" || body.token.length === 0) {
    return NextResponse.json({ error: "missing_token" }, { status: 400 });
  }

  const verification = await verifyQrToken(body.token, readQrSecret(), {
    allowedTypes: ["sponsor", "activity"],
  });
  if (!verification.ok) {
    return NextResponse.json(
      { error: "invalid_token", reason: verification.reason },
      { status: 400 },
    );
  }
  const payload = verification.payload;

  const deps = buildScanDeps(createSupabaseServiceClient());

  try {
    const outcome = await validateAndRecordScan(
      {
        eventId: payload.e,
        scannerUserId: authUser.id,
        targetType: payload.t,
        targetId: payload.i,
      },
      deps,
    );
    return NextResponse.json({
      ok: true,
      pointsGranted: outcome.pointsGranted,
      newTotal: outcome.newTotal,
      targetType: payload.t,
    });
  } catch (e) {
    if (e instanceof ScanRejected) {
      return NextResponse.json(
        { ok: false, reason: e.reason },
        { status: 409 },
      );
    }
    throw e;
  }
}

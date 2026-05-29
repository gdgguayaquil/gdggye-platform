import "server-only";

import { signQrToken, type QrPayload } from "@gdggye/backend-core";

function readQrSecret(): string {
  const secret = process.env.QR_SIGNING_SECRET;
  if (!secret) {
    throw new Error(
      "Missing QR_SIGNING_SECRET env (server-only). Set it in apps/web-bwai-2026/.env.local",
    );
  }
  if (secret.length < 32) {
    // 32 bytes ≈ HMAC-SHA256's block-aligned minimum. Generate with
    // `openssl rand -hex 32` (recommended in .env.local.example).
    throw new Error(
      "QR_SIGNING_SECRET must be at least 32 characters (use `openssl rand -hex 32`)",
    );
  }
  return secret;
}

export async function mintAttendeeQrToken(
  eventId: string,
  userId: string,
): Promise<string> {
  const payload: QrPayload = {
    t: "attendee",
    e: eventId,
    i: userId,
    iat: Math.floor(Date.now() / 1000),
  };
  return signQrToken(payload, readQrSecret());
}

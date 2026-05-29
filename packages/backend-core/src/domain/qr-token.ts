// Signed token domain — the on-the-wire format for every QR in Phase 2.
//
// Format: `v1.<base64url(payloadJSON)>.<base64url(HMAC-SHA256)>`
//   - "v1" lets us introduce v2 without breaking already-printed sheets.
//   - Payload keeps fields short: `t` (type), `e` (eventId), `i` (targetId),
//     `iat` (issued-at unix seconds). Smaller payload → denser QR.
//
// Attendee QRs are displayed in /my-qr (Sprint 2). Sponsor + activity QRs
// are minted by the admin slice (Sprint 3) and validated by
// validateAndRecordScan (Sprint 4) using verifyQrToken below.
//
// No infra imports: Web Crypto is in Node 18+ and every browser.

export type QrTargetType = "attendee" | "sponsor" | "activity";

export interface QrPayload {
  t: QrTargetType;
  e: string; // eventId
  i: string; // targetId (userId for attendees)
  iat: number; // issued-at, unix seconds
}

const TOKEN_PREFIX = "v1";

function toBase64Url(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(input: string): Uint8Array {
  const padded = input
    .replace(/-/g, "+")
    .replace(/_/g, "/")
    .padEnd(Math.ceil(input.length / 4) * 4, "=");
  const bin = atob(padded);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function importHmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

// Constant-time equality on two Uint8Arrays. Web Crypto verify() does this
// internally but `verifyQrToken` returns a structured result so we compare
// the parsed signature bytes against the recomputed HMAC ourselves.
function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i]! ^ b[i]!;
  return diff === 0;
}

export async function signQrToken(
  payload: QrPayload,
  secret: string,
): Promise<string> {
  const json = new TextEncoder().encode(JSON.stringify(payload));
  const payloadB64 = toBase64Url(json);
  const key = await importHmacKey(secret);
  const sig = new Uint8Array(
    await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payloadB64)),
  );
  return `${TOKEN_PREFIX}.${payloadB64}.${toBase64Url(sig)}`;
}

export type VerifyQrTokenError =
  | "malformed"
  | "unsupported_version"
  | "bad_signature"
  | "bad_payload"
  | "wrong_type";

export type VerifyQrTokenResult =
  | { ok: true; payload: QrPayload }
  | { ok: false; reason: VerifyQrTokenError };

export async function verifyQrToken(
  token: string,
  secret: string,
  options?: { allowedTypes?: readonly QrTargetType[] },
): Promise<VerifyQrTokenResult> {
  const parts = token.split(".");
  if (parts.length !== 3) return { ok: false, reason: "malformed" };
  const [version, payloadB64, sigB64] = parts as [string, string, string];
  if (version !== TOKEN_PREFIX)
    return { ok: false, reason: "unsupported_version" };

  let parsed: QrPayload;
  try {
    const json = new TextDecoder().decode(fromBase64Url(payloadB64));
    parsed = JSON.parse(json) as QrPayload;
  } catch {
    return { ok: false, reason: "bad_payload" };
  }
  if (
    !parsed ||
    typeof parsed !== "object" ||
    typeof parsed.t !== "string" ||
    typeof parsed.e !== "string" ||
    typeof parsed.i !== "string" ||
    typeof parsed.iat !== "number"
  ) {
    return { ok: false, reason: "bad_payload" };
  }

  if (options?.allowedTypes && !options.allowedTypes.includes(parsed.t)) {
    return { ok: false, reason: "wrong_type" };
  }

  const key = await importHmacKey(secret);
  const expected = new Uint8Array(
    await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payloadB64)),
  );
  const provided = fromBase64Url(sigB64);
  if (!timingSafeEqual(expected, provided))
    return { ok: false, reason: "bad_signature" };

  return { ok: true, payload: parsed };
}

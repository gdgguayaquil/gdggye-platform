"use client";

import * as React from "react";
import QRCode from "qrcode";

import type { EventAccent } from "@/lib/event-presentation";

interface Props {
  token: string;
  fullName: string;
  email: string;
  eventName: string;
  accent: EventAccent;
}

// The attendee QR rendered as a literal event credential: a punch slot and
// accent-color band up top (the lanyard header), the scannable code on its
// own white chip, then the holder's identity below a dashed tear line.
//
// The QR is generated client-side so its SVG can sit on a fixed white chip
// regardless of theme — scanners need the dark-on-light contrast, so this
// panel intentionally does NOT follow the light/dark token swap.
export function MyQrCard({ token, fullName, email, eventName, accent }: Props) {
  const [svg, setSvg] = React.useState<string>("");
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    QRCode.toString(token, {
      type: "svg",
      errorCorrectionLevel: "M",
      margin: 1,
      color: { dark: "#1e1e1e", light: "#ffffff" },
      width: 320,
    })
      .then((s) => {
        if (!cancelled) setSvg(s);
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <div className="mx-auto max-w-[420px] overflow-hidden rounded-[var(--r-xl)] border border-[var(--c-border)] bg-[var(--c-bg)] shadow-[var(--shadow-md)]">
      {/* Lanyard header — punch slot + event band */}
      <div
        className={`accent-panel-${accent} relative px-6 pb-6 pt-10 text-center`}
      >
        <span className="badge-slot" aria-hidden="true" />
        <div className="font-mono text-[11px] uppercase tracking-[0.18em] opacity-90">
          Pase de acceso
        </div>
        <div
          className="mt-1.5 font-display font-semibold"
          style={{ fontSize: 24, letterSpacing: "-0.02em" }}
        >
          {eventName}
        </div>
      </div>

      <div className="flex flex-col items-center gap-5 p-6">
        {/* Scannable chip — fixed white, both themes */}
        <div
          className="flex aspect-square w-full max-w-[300px] items-center justify-center rounded-[var(--r-lg)] bg-white p-4"
          aria-label="Código QR personal"
        >
          {error ? (
            <div className="text-sm" style={{ color: "var(--c-red)" }}>
              No pudimos generar tu QR. Recarga la página.
            </div>
          ) : svg ? (
            <div
              className="h-full w-full"
              // QR SVG is generated client-side from a server-issued token;
              // not untrusted input.
              dangerouslySetInnerHTML={{ __html: svg }}
            />
          ) : (
            <div className="font-mono text-xs text-[var(--c-text-subtle)]">
              …
            </div>
          )}
        </div>

        {/* Holder identity */}
        <div className="text-center">
          <div
            className="font-display font-semibold"
            style={{ fontSize: 20, letterSpacing: "-0.01em" }}
          >
            {fullName || "—"}
          </div>
          <div className="mt-1 font-mono text-xs text-[var(--c-text-subtle)]">
            {email}
          </div>
        </div>

        {/* Tear line + fine print */}
        <div className="w-full border-t border-dashed border-[var(--c-border-strong)] pt-4 text-center font-mono text-[11px] text-[var(--c-text-subtle)]">
          Vigente para este evento · No comparte tus datos
        </div>
      </div>
    </div>
  );
}

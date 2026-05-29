"use client";

import * as React from "react";
import QRCode from "qrcode";

interface Props {
  token: string;
  fullName: string;
  email: string;
  eventName: string;
}

// Renders the QR as a plain inline SVG. `qrcode` works on both client and
// server, but doing it client-side means the SVG color matches the live
// theme (the SVG reads currentColor → inherits text color, which our theme
// engine drives).
export function MyQrCard({ token, fullName, email, eventName }: Props) {
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
    <div className="mx-auto flex max-w-[420px] flex-col items-center gap-5 rounded-[var(--r-xl)] border border-[var(--c-border)] bg-[var(--c-bg)] p-8 shadow-[var(--shadow-md)]">
      <div className="eyebrow" style={{ color: "var(--c-primary)" }}>
        {eventName}
      </div>

      <div
        className="flex aspect-square w-full max-w-[320px] items-center justify-center rounded-[var(--r-lg)] bg-white p-4"
        aria-label="Personal QR code"
      >
        {error ? (
          <div className="text-sm" style={{ color: "var(--c-red)" }}>
            QR error: {error}
          </div>
        ) : svg ? (
          <div
            className="h-full w-full"
            // QR SVG is generated client-side from a server-issued token;
            // not untrusted input.
            // eslint-disable-next-line react/no-danger
            dangerouslySetInnerHTML={{ __html: svg }}
          />
        ) : (
          <div className="font-mono text-xs text-[var(--c-text-subtle)]">…</div>
        )}
      </div>

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

      <div className="text-center font-mono text-[11px] text-[var(--c-text-subtle)]">
        Vigente para este evento · No comparte tus datos
      </div>
    </div>
  );
}

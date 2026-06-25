import { requireUser } from "@/lib/server/auth";

import { QrScanner } from "./QrScanner";

export const metadata = {
  title: "Escáner · BWAI 2026",
};

// The scanner is gated behind auth so we always have an attendee identity to
// attribute the scan to. The use-case re-validates everything; this just
// avoids rendering the camera UI for anonymous visitors.
export default async function ScannerPage() {
  await requireUser("/sign-in?next=/scanner");

  return (
    <div className="container-x py-10">
      <div className="mb-6 text-center">
        <div className="eyebrow mb-2">BWAI 2026</div>
        <h1
          className="h-display mb-2"
          style={{ fontSize: "clamp(28px, 4vw, 44px)" }}
        >
          Escáner
        </h1>
        <p className="mx-auto max-w-[440px] text-sm text-[var(--c-text-muted)]">
          Apunta la cámara al QR del booth o de una actividad para sumar puntos.
        </p>
      </div>
      <QrScanner />
    </div>
  );
}

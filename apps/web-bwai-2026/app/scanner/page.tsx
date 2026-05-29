export default function ScannerPage() {
  return (
    <div className="container-x flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
      <div className="eyebrow mb-4">Sprint 4</div>
      <h1
        className="h-display mb-4"
        style={{ fontSize: "clamp(32px, 4.5vw, 56px)" }}
      >
        Escáner
      </h1>
      <p className="max-w-[440px] text-[var(--c-text-muted)]">
        El escáner de QR estará disponible durante el evento. Apuntas la cámara
        al QR del booth de sponsor o de una actividad para ganar puntos.
      </p>
    </div>
  );
}

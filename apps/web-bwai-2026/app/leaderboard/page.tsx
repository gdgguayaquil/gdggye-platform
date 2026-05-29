export default function LeaderboardPage() {
  return (
    <div className="container-x flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
      <div className="eyebrow mb-4">Sprint 5</div>
      <h1
        className="h-display mb-4"
        style={{ fontSize: "clamp(32px, 4.5vw, 56px)" }}
      >
        Tabla de posiciones
      </h1>
      <p className="max-w-[440px] text-[var(--c-text-muted)]">
        El ranking en vivo aparecerá acá durante el evento. Se actualiza por
        Realtime mientras los asistentes escanean QRs.
      </p>
    </div>
  );
}

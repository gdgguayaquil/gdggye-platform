"use client";

import * as React from "react";

import type { ScanRejectReason } from "@gdggye/backend-core";

// Lazy-load html5-qrcode on the client because it touches `document`/`navigator`
// at module-evaluation time. Importing it eagerly would break the server build.
import type {
  Html5Qrcode as Html5QrcodeType,
  CameraDevice,
} from "html5-qrcode";

const READER_ID = "qr-reader";

type Phase =
  | { kind: "intro" }
  | { kind: "requesting" }
  | { kind: "scanning" }
  | { kind: "verifying"; token: string }
  | {
      kind: "accepted";
      pointsGranted: number;
      newTotal: number;
      targetType: "sponsor" | "activity";
    }
  | { kind: "rejected"; reason: RejectReason }
  | { kind: "fatal"; message: string };

type RejectReason =
  | ScanRejectReason
  | "unauthenticated"
  | "invalid_token"
  | "bad_json"
  | "missing_token"
  | "network";

const REJECT_COPY: Record<RejectReason, { title: string; body: string }> = {
  wrong_event: {
    title: "QR de otro evento",
    body: "Este código pertenece a un evento distinto.",
  },
  event_not_live: {
    title: "El evento no está activo",
    body: "Vuelve a intentar durante el horario del evento.",
  },
  outside_event_hours: {
    title: "Fuera de horario",
    body: "Sólo puedes escanear durante el horario del evento.",
  },
  target_inactive: {
    title: "Booth o actividad inactiva",
    body: "Avisa al organizador si crees que esto es un error.",
  },
  outside_activity_window: {
    title: "Fuera de la ventana de la actividad",
    body: "Esta actividad solo otorga puntos durante un rango horario.",
  },
  already_claimed: {
    title: "Ya escaneaste este QR",
    body: "Solo puedes ganar puntos una vez por sponsor o actividad.",
  },
  self_scan: {
    title: "No puedes escanearte a ti mismo",
    body: "Pídele a otra persona que escanee tu QR personal.",
  },
  unauthenticated: {
    title: "Necesitas iniciar sesión",
    body: "Inicia sesión y vuelve a intentar.",
  },
  invalid_token: {
    title: "QR no válido",
    body: "El código no es de BWAI 2026, está dañado, o fue manipulado.",
  },
  bad_json: {
    title: "Error inesperado",
    body: "No pudimos enviar la solicitud. Intenta de nuevo.",
  },
  missing_token: {
    title: "QR no detectado",
    body: "No pudimos leer el código. Inténtalo de nuevo.",
  },
  network: {
    title: "Sin conexión",
    body: "Revisa tu internet y vuelve a intentar.",
  },
};

export function QrScanner() {
  const [phase, setPhase] = React.useState<Phase>({ kind: "intro" });
  const scannerRef = React.useRef<Html5QrcodeType | null>(null);
  // Lock to prevent double-firing when html5-qrcode raises the callback
  // before we've had a chance to stop the camera.
  const inflightRef = React.useRef(false);

  const stopCamera = React.useCallback(async () => {
    const inst = scannerRef.current;
    if (!inst) return;
    try {
      // isScanning was renamed across versions; guard defensively.
      const running =
        typeof (inst as { isScanning?: boolean }).isScanning === "boolean"
          ? (inst as { isScanning: boolean }).isScanning
          : true;
      if (running) await inst.stop();
      await inst.clear();
    } catch {
      // ignore — stopping a stopped scanner throws on some versions.
    }
    scannerRef.current = null;
  }, []);

  // Always clean the camera up when the component leaves the DOM.
  React.useEffect(() => {
    return () => {
      void stopCamera();
    };
  }, [stopCamera]);

  const submitToken = React.useCallback(async (token: string) => {
    setPhase({ kind: "verifying", token });
    try {
      const res = await fetch("/api/scans/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = (await res.json().catch(() => ({}))) as Record<
        string,
        unknown
      >;
      if (res.ok && data.ok === true) {
        setPhase({
          kind: "accepted",
          pointsGranted: Number(data.pointsGranted ?? 0),
          newTotal: Number(data.newTotal ?? 0),
          targetType: data.targetType === "activity" ? "activity" : "sponsor",
        });
        return;
      }
      const reason =
        typeof data.reason === "string"
          ? (data.reason as RejectReason)
          : typeof data.error === "string"
            ? (data.error as RejectReason)
            : ("invalid_token" as RejectReason);
      setPhase({ kind: "rejected", reason });
    } catch {
      setPhase({ kind: "rejected", reason: "network" });
    }
  }, []);

  const startCamera = React.useCallback(async () => {
    setPhase({ kind: "requesting" });
    if (
      typeof window === "undefined" ||
      !window.isSecureContext ||
      !navigator.mediaDevices
    ) {
      setPhase({
        kind: "fatal",
        message:
          "Tu navegador no soporta el escáner aquí. Abre la app en HTTPS y desde un dispositivo con cámara.",
      });
      return;
    }
    try {
      const mod = await import("html5-qrcode");
      const { Html5Qrcode } = mod;
      const cameras = await Html5Qrcode.getCameras();
      if (!cameras || cameras.length === 0) {
        setPhase({
          kind: "fatal",
          message: "No detectamos ninguna cámara en este dispositivo.",
        });
        return;
      }
      const camera = pickRearCamera(cameras);
      const instance = new Html5Qrcode(READER_ID);
      scannerRef.current = instance;

      await instance.start(
        { deviceId: { exact: camera.id } },
        {
          fps: 10,
          qrbox: (vw: number, vh: number) => {
            const side = Math.floor(Math.min(vw, vh) * 0.75);
            return { width: side, height: side };
          },
          aspectRatio: 1,
        },
        async (decodedText: string) => {
          if (inflightRef.current) return;
          inflightRef.current = true;
          await stopCamera();
          await submitToken(decodedText);
          inflightRef.current = false;
        },
        () => {
          // per-frame decode errors — noisy and not actionable. Suppress.
        },
      );
      setPhase({ kind: "scanning" });
    } catch (e) {
      const msg =
        e instanceof Error ? e.message : "No pudimos iniciar la cámara.";
      if (/permission|notallowed/i.test(msg)) {
        setPhase({
          kind: "fatal",
          message:
            "No diste permiso a la cámara. Habilítala desde la configuración del navegador y vuelve a intentar.",
        });
      } else {
        setPhase({ kind: "fatal", message: msg });
      }
    }
  }, [stopCamera, submitToken]);

  const reset = React.useCallback(async () => {
    await stopCamera();
    inflightRef.current = false;
    setPhase({ kind: "intro" });
  }, [stopCamera]);

  return (
    <div className="mx-auto max-w-[480px]">
      <div
        className="relative aspect-square w-full overflow-hidden rounded-[var(--r-lg)] border border-[var(--c-border)] bg-[var(--c-surface)]"
        aria-live="polite"
      >
        <div id={READER_ID} className="h-full w-full" />
        {phase.kind !== "scanning" ? (
          <div className="absolute inset-0 flex items-center justify-center bg-[var(--c-surface)]/85 text-center">
            <PhaseOverlay phase={phase} onStart={startCamera} onReset={reset} />
          </div>
        ) : (
          <div className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/55 px-3 py-1 font-mono text-[11px] uppercase tracking-wider text-white">
            Escaneando…
          </div>
        )}
      </div>

      {phase.kind === "intro" ? (
        <p className="mt-4 text-center text-xs text-[var(--c-text-subtle)]">
          Necesitamos acceso a tu cámara solo para leer códigos QR del evento.
          No grabamos ni guardamos video.
        </p>
      ) : null}
    </div>
  );
}

function PhaseOverlay({
  phase,
  onStart,
  onReset,
}: {
  phase: Exclude<Phase, { kind: "scanning" }>;
  onStart: () => void;
  onReset: () => void;
}) {
  switch (phase.kind) {
    case "intro":
      return (
        <div className="p-6">
          <div className="eyebrow mb-2">Listo para escanear</div>
          <p className="mb-5 text-sm text-[var(--c-text-muted)]">
            Activa la cámara para empezar.
          </p>
          <PrimaryButton onClick={onStart}>Activar cámara</PrimaryButton>
        </div>
      );
    case "requesting":
      return (
        <div className="p-6">
          <Spinner />
          <p className="mt-3 text-sm text-[var(--c-text-muted)]">
            Solicitando acceso a la cámara…
          </p>
        </div>
      );
    case "verifying":
      return (
        <div className="p-6">
          <Spinner />
          <p className="mt-3 text-sm text-[var(--c-text-muted)]">
            Verificando QR…
          </p>
        </div>
      );
    case "accepted":
      return (
        <div className="p-6">
          <div
            className="mb-2 font-mono text-xs uppercase tracking-wider"
            style={{ color: "var(--c-green)" }}
          >
            +{phase.pointsGranted} puntos
          </div>
          <h2 className="font-display text-2xl font-semibold">¡Listo!</h2>
          <p className="mb-5 mt-2 text-sm text-[var(--c-text-muted)]">
            Tienes <strong>{phase.newTotal}</strong> puntos en total.
          </p>
          <PrimaryButton onClick={onReset}>Escanear otro</PrimaryButton>
        </div>
      );
    case "rejected": {
      const copy = REJECT_COPY[phase.reason];
      return (
        <div className="p-6">
          <div
            className="mb-2 font-mono text-xs uppercase tracking-wider"
            style={{ color: "var(--c-red)" }}
          >
            no acreditado
          </div>
          <h2 className="font-display text-xl font-semibold">{copy.title}</h2>
          <p className="mb-5 mt-2 text-sm text-[var(--c-text-muted)]">
            {copy.body}
          </p>
          <PrimaryButton onClick={onReset}>Volver a intentar</PrimaryButton>
        </div>
      );
    }
    case "fatal":
      return (
        <div className="p-6">
          <div
            className="mb-2 font-mono text-xs uppercase tracking-wider"
            style={{ color: "var(--c-red)" }}
          >
            error
          </div>
          <p className="mb-5 text-sm text-[var(--c-text-muted)]">
            {phase.message}
          </p>
          <PrimaryButton onClick={onReset}>Volver</PrimaryButton>
        </div>
      );
  }
}

function PrimaryButton({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-11 items-center justify-center rounded-full px-6 text-sm font-medium transition-opacity hover:opacity-90"
      style={{ background: "var(--c-text)", color: "var(--c-bg)" }}
    >
      {children}
    </button>
  );
}

function Spinner() {
  return (
    <div
      role="status"
      aria-label="Cargando"
      className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-[var(--c-border)] border-t-transparent"
    />
  );
}

function pickRearCamera(cameras: CameraDevice[]): CameraDevice {
  const rear = cameras.find((c) => /back|rear|environment/i.test(c.label));
  return rear ?? cameras[cameras.length - 1]!;
}

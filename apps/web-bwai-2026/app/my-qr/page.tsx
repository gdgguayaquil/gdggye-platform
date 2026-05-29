import { requireUser } from "@/lib/server/auth";

export default async function MyQrPage() {
  // Stub for Slice 2C. Auth gate is real — surfaces the same redirect-to-
  // sign-in behavior the final page will have.
  await requireUser("/sign-in?next=/my-qr");
  return (
    <div className="container-x flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
      <div className="eyebrow mb-4">Slice 2C</div>
      <h1
        className="h-display mb-4"
        style={{ fontSize: "clamp(32px, 4.5vw, 56px)" }}
      >
        Mi QR
      </h1>
      <p className="max-w-[440px] text-[var(--c-text-muted)]">
        Tu pase personal — en construcción.
      </p>
    </div>
  );
}

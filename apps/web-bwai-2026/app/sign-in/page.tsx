import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/server/auth";

import { SignInForm } from "./SignInForm";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next, error } = await searchParams;

  const user = await getCurrentUser();
  if (user) {
    redirect(next && next.startsWith("/") ? next : "/profile");
  }

  return (
    <div className="container-x flex min-h-[60vh] flex-col items-center justify-center py-20">
      <div className="w-full max-w-[420px]">
        <div className="eyebrow mb-4">Acceso</div>
        <h1
          className="h-display mb-4"
          style={{ fontSize: "clamp(32px, 4vw, 48px)" }}
        >
          Inicia sesión
        </h1>
        <p className="mb-8 text-[var(--c-text-muted)]">
          Necesitas una cuenta para acceder a funciones de evento. Por ahora
          solo Google.
        </p>

        {error ? (
          <div
            className="mb-4 rounded-[var(--r-md)] border border-[var(--c-red)] bg-[var(--c-red-soft)] px-4 py-3 text-sm"
            style={{ color: "var(--c-red)" }}
          >
            {error}
          </div>
        ) : null}

        <SignInForm next={next} />
      </div>
    </div>
  );
}

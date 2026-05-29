import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/server/auth";

import { SignUpForm } from "./SignUpForm";

export default async function SignUpPage({
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
        <div className="eyebrow mb-4">Cuenta nueva</div>
        <h1
          className="h-display mb-4"
          style={{ fontSize: "clamp(32px, 4vw, 48px)" }}
        >
          Crear cuenta
        </h1>
        <p className="mb-8 text-[var(--c-text-muted)]">
          Regístrate con correo y contraseña. Después podrás completar tu perfil
          y aceptar los consentimientos.
        </p>

        {error ? (
          <div
            className="mb-4 rounded-[var(--r-md)] border border-[var(--c-red)] bg-[var(--c-red-soft)] px-4 py-3 text-sm"
            style={{ color: "var(--c-red)" }}
          >
            {error}
          </div>
        ) : null}

        <SignUpForm next={next} />
      </div>
    </div>
  );
}

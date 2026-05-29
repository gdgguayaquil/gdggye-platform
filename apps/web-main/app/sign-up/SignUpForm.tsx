"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { createSupabaseBrowserClient } from "@gdggye/supabase-adapters/browser";
import { Button, Input } from "@gdggye/ui-kit";

export function SignUpForm({ next }: { next?: string }) {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [needsConfirmation, setNeedsConfirmation] = React.useState(false);

  const destination =
    next && next.startsWith("/") && !next.startsWith("//") ? next : "/profile";

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    const fullName = String(form.get("fullName") ?? "").trim();
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");
    const passwordConfirm = String(form.get("passwordConfirm") ?? "");

    if (password !== passwordConfirm) {
      setError("Las contraseñas no coinciden.");
      setLoading(false);
      return;
    }

    try {
      const supabase = createSupabaseBrowserClient();
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        // Pre-populates auth.users.user_metadata.full_name so signInBootstrap
        // can seed public.users.full_name without a second call.
        options: {
          data: fullName ? { full_name: fullName } : undefined,
          emailRedirectTo: new URL(
            "/auth/callback",
            window.location.origin,
          ).toString(),
        },
      });
      if (signUpError) {
        setError(signUpError.message);
        setLoading(false);
        return;
      }

      // If the Supabase project requires email confirmation, `session` is
      // null until the user clicks the email link. Show that state instead
      // of pretending the user is signed in.
      if (data.session) {
        router.push(destination);
        router.refresh();
      } else {
        setNeedsConfirmation(true);
        setLoading(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setLoading(false);
    }
  };

  if (needsConfirmation) {
    return (
      <div className="rounded-[var(--r-md)] border border-[var(--c-border)] bg-[var(--c-surface)] p-5 text-sm">
        <div className="mb-2 font-medium">Revisa tu correo</div>
        <div className="text-[var(--c-text-muted)]">
          Te enviamos un enlace de confirmación. Ábrelo para activar tu cuenta y
          volver acá.
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3">
      <Input
        type="text"
        name="fullName"
        placeholder="Nombre completo"
        autoComplete="name"
        required
      />
      <Input
        type="email"
        name="email"
        placeholder="tu@correo.com"
        autoComplete="email"
        required
      />
      <Input
        type="password"
        name="password"
        placeholder="Contraseña (mín. 8 caracteres)"
        autoComplete="new-password"
        required
        minLength={8}
      />
      <Input
        type="password"
        name="passwordConfirm"
        placeholder="Repite la contraseña"
        autoComplete="new-password"
        required
        minLength={8}
      />

      <Button type="submit" variant="primary" size="lg" disabled={loading}>
        {loading ? "Creando…" : "Crear cuenta"}
      </Button>

      <div className="text-center text-sm text-[var(--c-text-muted)]">
        ¿Ya tienes cuenta?{" "}
        <Link
          href={
            destination === "/profile"
              ? "/sign-in"
              : `/sign-in?next=${encodeURIComponent(destination)}`
          }
          className="font-medium underline"
          style={{ color: "var(--c-text)" }}
        >
          Inicia sesión
        </Link>
      </div>

      {error ? (
        <div className="text-sm" style={{ color: "var(--c-red)" }}>
          {error}
        </div>
      ) : null}
    </form>
  );
}

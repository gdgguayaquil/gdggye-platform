"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { createSupabaseBrowserClient } from "@gdggye/supabase-adapters/browser";
import { Button, Input } from "@gdggye/ui-kit";

export function SignInForm({ next }: { next?: string }) {
  const router = useRouter();
  const [googleLoading, setGoogleLoading] = React.useState(false);
  const [emailLoading, setEmailLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const destination =
    next && next.startsWith("/") && !next.startsWith("//") ? next : "/profile";

  const signInWithGoogle = async () => {
    setGoogleLoading(true);
    setError(null);
    try {
      const supabase = createSupabaseBrowserClient();
      const redirectTo = new URL("/auth/callback", window.location.origin);
      if (destination !== "/profile") {
        redirectTo.searchParams.set("next", destination);
      }
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: redirectTo.toString() },
      });
      if (oauthError) {
        setError(oauthError.message);
        setGoogleLoading(false);
      }
      // On success, Supabase redirects the browser — control never returns.
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setGoogleLoading(false);
    }
  };

  const signInWithEmail = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setEmailLoading(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");
    try {
      const supabase = createSupabaseBrowserClient();
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (authError) {
        setError(authError.message);
        setEmailLoading(false);
        return;
      }
      router.push(destination);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setEmailLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <Button
        type="button"
        variant="primary"
        size="lg"
        onClick={signInWithGoogle}
        disabled={googleLoading}
      >
        {googleLoading ? "Redirigiendo…" : "Continuar con Google"}
      </Button>

      <div className="flex items-center gap-3 text-xs uppercase tracking-wider text-[var(--c-text-subtle)]">
        <span className="h-px flex-1 bg-[var(--c-border)]" />
        <span className="font-mono">o con correo</span>
        <span className="h-px flex-1 bg-[var(--c-border)]" />
      </div>

      <form onSubmit={signInWithEmail} className="flex flex-col gap-3">
        <Input
          type="email"
          name="email"
          placeholder="tu@correo.com"
          required
          autoComplete="email"
        />
        <Input
          type="password"
          name="password"
          placeholder="Contraseña"
          required
          autoComplete="current-password"
          minLength={6}
        />
        <Button type="submit" variant="secondary" disabled={emailLoading}>
          {emailLoading ? "Ingresando…" : "Iniciar sesión"}
        </Button>
      </form>

      <div className="text-center text-sm text-[var(--c-text-muted)]">
        ¿No tienes cuenta?{" "}
        <Link
          href={
            destination === "/profile"
              ? "/sign-up"
              : `/sign-up?next=${encodeURIComponent(destination)}`
          }
          className="font-medium underline"
          style={{ color: "var(--c-text)" }}
        >
          Crear una
        </Link>
      </div>

      {error ? (
        <div className="text-sm" style={{ color: "var(--c-red)" }}>
          {error}
        </div>
      ) : null}
    </div>
  );
}

import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/server/auth";

import { SignInForm } from "./SignInForm";

const ERROR_MESSAGES: Record<string, string> = {
  not_staff:
    "This account doesn't have admin access. Sign in with an organizer or admin account.",
  missing_code: "OAuth callback was missing a code parameter.",
};

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next, error } = await searchParams;

  const user = await getCurrentUser();
  // Only auto-redirect signed-in users when they're actually staff. An
  // attendee landing here after a not_staff redirect must see the message.
  if (user && user.systemRole !== "attendee") {
    redirect(next && next.startsWith("/") ? next : "/events");
  }

  const message = error ? (ERROR_MESSAGES[error] ?? error) : null;

  return (
    <div className="container-x flex min-h-[60vh] flex-col items-center justify-center py-20">
      <div className="w-full max-w-[420px]">
        <div className="eyebrow mb-4">Admin access</div>
        <h1
          className="h-display mb-4"
          style={{ fontSize: "clamp(32px, 4vw, 48px)" }}
        >
          Sign in
        </h1>
        <p className="mb-8 text-[var(--c-text-muted)]">
          Operators only. Your account must have the organizer or admin role.
        </p>

        {message ? (
          <div
            className="mb-4 rounded-[var(--r-md)] border border-[var(--c-red)] bg-[var(--c-red-soft)] px-4 py-3 text-sm"
            style={{ color: "var(--c-red)" }}
          >
            {message}
          </div>
        ) : null}

        <SignInForm next={next} />
      </div>
    </div>
  );
}

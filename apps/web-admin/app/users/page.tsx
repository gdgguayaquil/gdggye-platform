import { PageHeader } from "@/components/page-header";
import { requireAdmin } from "@/lib/server/auth";
import { listUsers } from "@/lib/server/users";

import { UserRoleControl } from "./UserRoleControl";

const COLS = "1fr 260px 130px";

export default async function UsersPage() {
  const admin = await requireAdmin();
  const users = await listUsers();

  const dateLabel = (d: Date) =>
    d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  return (
    <div className="container-x py-12">
      <PageHeader
        crumbs={[{ label: "Users" }]}
        title="Users"
        subtitle="Manage staff access. Role changes take effect on the user's next sign-in or token refresh."
      />

      <div className="overflow-x-auto rounded-[var(--r-lg)] border border-[var(--c-border)]">
        <div
          className="grid gap-4 border-b border-[var(--c-border)] bg-[var(--c-surface)] px-5 py-3 font-mono text-[11px] uppercase tracking-wider text-[var(--c-text-muted)]"
          style={{ gridTemplateColumns: COLS, minWidth: 640 }}
        >
          <div>User</div>
          <div>Role</div>
          <div>Joined</div>
        </div>

        {users.length === 0 ? (
          <div className="px-5 py-10 text-center text-[var(--c-text-muted)]">
            No users yet.
          </div>
        ) : (
          users.map((u) => {
            const isSelf = u.id === admin.id;
            return (
              <div
                key={u.id}
                className="grid items-center gap-4 border-b border-[var(--c-border)] px-5 py-4 last:border-b-0"
                style={{ gridTemplateColumns: COLS, minWidth: 640 }}
              >
                <div className="min-w-0">
                  <div className="truncate font-display font-semibold">
                    {u.fullName || "—"}
                  </div>
                  <div className="truncate font-mono text-xs text-[var(--c-text-subtle)]">
                    {u.email || u.id.slice(0, 8)}
                  </div>
                </div>
                <div>
                  {isSelf ? (
                    <span className="font-mono text-sm text-[var(--c-text-muted)]">
                      {u.systemRole}{" "}
                      <span className="text-[var(--c-text-subtle)]">(you)</span>
                    </span>
                  ) : (
                    <UserRoleControl userId={u.id} currentRole={u.systemRole} />
                  )}
                </div>
                <div className="font-mono text-xs text-[var(--c-text-muted)]">
                  {dateLabel(u.createdAt)}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

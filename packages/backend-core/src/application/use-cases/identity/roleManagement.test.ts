import { describe, expect, it } from "vitest";

import type { SystemRole, User } from "../../../domain/entities/User";
import { InMemoryUserRepository } from "../../../test-support/InMemoryUserRepository";
import { listUsers, MAX_USERS_LIMIT } from "./listUsers";
import { RoleChangeBlocked, setUserRole } from "./setUserRole";

function user(
  id: string,
  role: SystemRole,
  createdAt = new Date("2026-01-01T00:00:00Z"),
): User {
  return {
    id,
    googleId: null,
    email: `${id}@x.io`,
    fullName: id,
    photoUrl: null,
    company: null,
    role: null,
    phone: null,
    city: null,
    socialLinks: {},
    systemRole: role,
    acceptedTermsAt: null,
    acceptedPrivacyAt: null,
    acceptedSponsorConsentAt: null,
    createdAt,
    updatedAt: new Date(0),
  };
}

describe("listUsers", () => {
  it("returns newest-first items and clamps the limit", async () => {
    const repo = new InMemoryUserRepository([
      user("a", "attendee", new Date("2026-01-01T00:00:00Z")),
      user("b", "organizer", new Date("2026-02-01T00:00:00Z")),
      user("c", "admin", new Date("2026-03-01T00:00:00Z")),
    ]);
    const items = await listUsers({ userRepo: repo }, MAX_USERS_LIMIT + 999);
    expect(items.map((i) => i.id)).toEqual(["c", "b", "a"]);
    expect(items[0]).toMatchObject({ systemRole: "admin", email: "c@x.io" });
  });
});

describe("setUserRole", () => {
  it("promotes a user", async () => {
    const repo = new InMemoryUserRepository([
      user("u1", "attendee"),
      user("admin", "admin"),
    ]);
    const updated = await setUserRole(
      { targetUserId: "u1", role: "organizer", actorId: "admin" },
      { userRepo: repo },
    );
    expect(updated.systemRole).toBe("organizer");
  });

  it("blocks an admin from demoting themselves", async () => {
    const repo = new InMemoryUserRepository([user("admin", "admin")]);
    await expect(
      setUserRole(
        { targetUserId: "admin", role: "organizer", actorId: "admin" },
        { userRepo: repo },
      ),
    ).rejects.toMatchObject({ reason: "self_demotion" });
  });

  it("allows an admin to 'set' themselves to admin (no-op, not a demotion)", async () => {
    const repo = new InMemoryUserRepository([user("admin", "admin")]);
    const out = await setUserRole(
      { targetUserId: "admin", role: "admin", actorId: "admin" },
      { userRepo: repo },
    );
    expect(out.systemRole).toBe("admin");
  });

  it("throws when the target user doesn't exist", async () => {
    const repo = new InMemoryUserRepository([user("admin", "admin")]);
    await expect(
      setUserRole(
        { targetUserId: "ghost", role: "organizer", actorId: "admin" },
        { userRepo: repo },
      ),
    ).rejects.toBeInstanceOf(RoleChangeBlocked);
  });
});

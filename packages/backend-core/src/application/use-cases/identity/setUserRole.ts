import type { SystemRole, User } from "../../../domain/entities/User";
import type { UserRepository } from "../../ports/UserRepository";

export class RoleChangeBlocked extends Error {
  constructor(public readonly reason: RoleChangeBlockedReason) {
    super(`Role change blocked: ${reason}`);
    this.name = "RoleChangeBlocked";
  }
}

export type RoleChangeBlockedReason = "self_demotion" | "user_not_found";

export interface SetUserRoleInput {
  targetUserId: string;
  role: SystemRole;
  actorId: string; // the admin making the change
}

export interface SetUserRoleDeps {
  userRepo: UserRepository;
}

// Epic D1. Changes a user's system_role. One domain guard: an admin cannot
// demote themselves (lockout guard) — leaving the "last admin" case as an
// open item (see CLAUDE-phase4). The DB (guard_system_role +
// users_admin_role_write) is the backstop; this gives a clean error first.
export async function setUserRole(
  input: SetUserRoleInput,
  deps: SetUserRoleDeps,
): Promise<User> {
  if (input.targetUserId === input.actorId && input.role !== "admin") {
    throw new RoleChangeBlocked("self_demotion");
  }

  const target = await deps.userRepo.findById(input.targetUserId);
  if (!target) throw new RoleChangeBlocked("user_not_found");

  // No-op fast path: nothing to write if the role is unchanged.
  if (target.systemRole === input.role) return target;

  return deps.userRepo.setSystemRole(input.targetUserId, input.role);
}

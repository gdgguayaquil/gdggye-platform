import type { SystemRole } from "../../../domain/entities/User";
import type { UserRepository } from "../../ports/UserRepository";

export interface UserListItem {
  id: string;
  fullName: string;
  email: string;
  systemRole: SystemRole;
  createdAt: Date;
}

export interface ListUsersDeps {
  userRepo: UserRepository;
}

export const DEFAULT_USERS_LIMIT = 50;
export const MAX_USERS_LIMIT = 200;

// Epic D1. Paginated user directory for the role-management screen. Limit is
// clamped; offset floored at 0.
export async function listUsers(
  deps: ListUsersDeps,
  limit: number = DEFAULT_USERS_LIMIT,
  offset: number = 0,
): Promise<UserListItem[]> {
  const capped = Math.min(Math.max(limit, 1), MAX_USERS_LIMIT);
  const users = await deps.userRepo.listUsers(capped, Math.max(offset, 0));
  return users.map((u) => ({
    id: u.id,
    fullName: u.fullName,
    email: u.email,
    systemRole: u.systemRole,
    createdAt: u.createdAt,
  }));
}

import type { User } from "../../../domain/entities/User";
import type {
  BootstrapUserInput,
  UserRepository,
} from "../../ports/UserRepository";

export interface SignInBootstrapInput extends BootstrapUserInput {}

export interface SignInBootstrapDeps {
  userRepo: UserRepository;
}

// Epic A2 — runs on every sign-in after Supabase Auth has authenticated the
// user. Idempotent by primary key (`id` = auth.users.id), so repeated
// logins never create duplicate `users` rows. Default systemRole = 'attendee'
// is enforced at the DB column level; this use-case never touches role.
export async function signInBootstrap(
  input: SignInBootstrapInput,
  deps: SignInBootstrapDeps,
): Promise<User> {
  return deps.userRepo.upsertBootstrap(input);
}

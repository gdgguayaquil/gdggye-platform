import type { User } from "../../../domain/entities/User";
import { isProfileComplete } from "../../../domain/entities/User";
import type { ProfileUpdate, UserRepository } from "../../ports/UserRepository";

export class ProfileIncomplete extends Error {
  constructor(public readonly missing: readonly ("fullName" | "email")[]) {
    super(`Profile incomplete: missing ${missing.join(", ")}`);
    this.name = "ProfileIncomplete";
  }
}

export interface CompleteProfileInput extends ProfileUpdate {
  userId: string;
  fullName: string; // explicitly required at the boundary
}

export interface CompleteProfileDeps {
  userRepo: UserRepository;
}

// Epic B1 — validates and persists profile updates. Required-field set
// (Phase 2 open item B1) is currently {fullName, email}; email comes from
// Google so it's not in the input shape. Tighten later if the project lands
// on a stricter set (phone, city, etc.).
export async function completeProfile(
  input: CompleteProfileInput,
  deps: CompleteProfileDeps,
): Promise<User> {
  const { userId, ...patch } = input;

  if (!patch.fullName || patch.fullName.trim().length === 0) {
    throw new ProfileIncomplete(["fullName"]);
  }

  const updated = await deps.userRepo.updateProfile(userId, patch);

  // Defense in depth: re-check using the domain predicate on the persisted
  // shape, not the input. Catches a misbehaving repo that ignored the patch.
  if (!isProfileComplete(updated)) {
    throw new ProfileIncomplete(
      [
        updated.fullName.trim().length === 0 ? ("fullName" as const) : null,
        updated.email.trim().length === 0 ? ("email" as const) : null,
      ].filter((x): x is "fullName" | "email" => x !== null),
    );
  }

  return updated;
}

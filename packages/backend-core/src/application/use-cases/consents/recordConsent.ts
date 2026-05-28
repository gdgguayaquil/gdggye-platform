import type {
  ConsentRecord,
  ConsentType,
} from "../../../domain/entities/ConsentRecord";
import type { User } from "../../../domain/entities/User";
import type { Clock } from "../../ports/Clock";
import type { ConsentRepository } from "../../ports/ConsentRepository";
import type { UserRepository } from "../../ports/UserRepository";

export interface AcceptConsentInput {
  userId: string;
  version?: string;
}

export interface AcceptConsentDeps {
  consentRepo: ConsentRepository;
  userRepo: UserRepository;
  clock: Clock;
}

export interface AcceptConsentResult {
  record: ConsentRecord;
  user: User;
}

// Each accept writes a fresh consent_records row (audit trail) AND stamps
// the corresponding accepted_*_at column on users (so the gate checks are
// O(1)). Both are required-together; the repository implementations decide
// how to keep them consistent (in Supabase: an RPC, or two calls with a
// soft failure mode — see the adapter).
export async function recordConsentEffect(
  consentType: ConsentType,
  input: AcceptConsentInput,
  deps: AcceptConsentDeps,
): Promise<AcceptConsentResult> {
  const now = deps.clock.now();
  const version = input.version ?? "v1";

  const record = await deps.consentRepo.record({
    userId: input.userId,
    consentType,
    version,
    acceptedAt: now,
  });

  const user = await deps.userRepo.setConsentTimestamp(
    input.userId,
    consentType,
    now,
  );

  return { record, user };
}

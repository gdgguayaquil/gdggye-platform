import type { PreCheckinStatus } from "../../../domain/entities/Registration";
import type { RegistrationRepository } from "../../ports/RegistrationRepository";
import type { UserRepository } from "../../ports/UserRepository";

// One attendee row for the admin per-event list. Identity is joined in from
// public.users; rank is computed here from the points ordering (see below),
// not read from registrations.event_rank — that column is only maintained
// for the attendee-facing leaderboard and can lag.
export interface EventRegistrationRow {
  userId: string;
  fullName: string;
  email: string;
  preCheckinStatus: PreCheckinStatus;
  totalPoints: number;
  rank: number;
  registeredAt: Date;
}

export interface ListEventRegistrationsDeps {
  registrationRepo: RegistrationRepository;
  userRepo: UserRepository;
}

// Epic A1. Lists everyone registered for an event, points-desc, with a
// competition rank (ties share a rank; the next rank skips — same semantics
// as the leaderboard's SQL rank()). Tie-break for stable ordering is
// earliest registration first, matching the leaderboard's created_at tiebreak.
export async function listEventRegistrations(
  eventId: string,
  deps: ListEventRegistrationsDeps,
): Promise<EventRegistrationRow[]> {
  const registrations = await deps.registrationRepo.listByEvent(eventId);
  if (registrations.length === 0) return [];

  const userIds = [...new Set(registrations.map((r) => r.userId))];
  const users = await deps.userRepo.findManyByIds(userIds);
  const userById = new Map(users.map((u) => [u.id, u]));

  const ordered = [...registrations].sort(
    (a, b) =>
      b.totalPoints - a.totalPoints ||
      a.createdAt.getTime() - b.createdAt.getTime(),
  );

  let rank = 0;
  let lastPoints: number | null = null;
  return ordered.map((reg, index) => {
    // Competition ranking: equal points share a rank; the running index+1
    // becomes the next distinct rank when points drop.
    if (reg.totalPoints !== lastPoints) {
      rank = index + 1;
      lastPoints = reg.totalPoints;
    }
    const user = userById.get(reg.userId);
    return {
      userId: reg.userId,
      fullName: user?.fullName ?? "",
      email: user?.email ?? "",
      preCheckinStatus: reg.preCheckinStatus,
      totalPoints: reg.totalPoints,
      rank,
      registeredAt: reg.createdAt,
    };
  });
}

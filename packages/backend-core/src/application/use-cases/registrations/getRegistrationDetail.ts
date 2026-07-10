import type { PointLedgerEntry } from "../../../domain/entities/Leaderboard";
import type { PreCheckinStatus } from "../../../domain/entities/Registration";
import type { PointTransactionRepository } from "../../ports/PointTransactionRepository";
import type { RegistrationRepository } from "../../ports/RegistrationRepository";
import type {
  ScanHistoryEntry,
  ScanLogRepository,
} from "../../ports/ScanLogRepository";
import type { UserRepository } from "../../ports/UserRepository";

export interface RegistrationDetail {
  user: {
    id: string;
    fullName: string;
    email: string;
    photoUrl: string | null;
    company: string | null;
    role: string | null;
  };
  registration: {
    preCheckinStatus: PreCheckinStatus;
    totalPoints: number;
    eventRank: number | null;
    registeredAt: Date;
  };
  ledger: PointLedgerEntry[];
  scans: ScanHistoryEntry[];
  // Sum of the ledger points. Must equal registration.totalPoints — the DB
  // trigger keeps them in sync. `reconciled` surfaces a drift so the UI can
  // flag a real bug instead of silently showing a wrong total.
  ledgerSum: number;
  reconciled: boolean;
}

export interface GetRegistrationDetailDeps {
  registrationRepo: RegistrationRepository;
  userRepo: UserRepository;
  pointTxRepo: PointTransactionRepository;
  scanLogRepo: ScanLogRepository;
}

// Epic A2. Assembles one attendee's full picture for the admin drawer:
// identity + registration + the point ledger + scan history. Returns null
// when the user isn't registered for this event (nothing to show).
export async function getRegistrationDetail(
  eventId: string,
  userId: string,
  deps: GetRegistrationDetailDeps,
): Promise<RegistrationDetail | null> {
  const registration = await deps.registrationRepo.findByEventAndUser(
    eventId,
    userId,
  );
  if (!registration) return null;

  const [user, ledger, scans] = await Promise.all([
    deps.userRepo.findById(userId),
    deps.pointTxRepo.listForUser(eventId, userId),
    deps.scanLogRepo.listForUser(eventId, userId),
  ]);

  const ledgerSum = ledger.reduce((sum, entry) => sum + entry.points, 0);

  return {
    user: {
      id: userId,
      fullName: user?.fullName ?? "",
      email: user?.email ?? "",
      photoUrl: user?.photoUrl ?? null,
      company: user?.company ?? null,
      role: user?.role ?? null,
    },
    registration: {
      preCheckinStatus: registration.preCheckinStatus,
      totalPoints: registration.totalPoints,
      eventRank: registration.eventRank,
      registeredAt: registration.createdAt,
    },
    ledger,
    scans,
    ledgerSum,
    reconciled: ledgerSum === registration.totalPoints,
  };
}

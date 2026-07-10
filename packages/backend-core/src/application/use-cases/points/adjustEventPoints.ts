import type { Clock } from "../../ports/Clock";
import type { PointTransactionRepository } from "../../ports/PointTransactionRepository";

export class PointAdjustmentInvalid extends Error {
  constructor(public readonly reason: PointAdjustmentInvalidReason) {
    super(`Point adjustment invalid: ${reason}`);
    this.name = "PointAdjustmentInvalid";
  }
}

export type PointAdjustmentInvalidReason =
  | "not_an_integer"
  | "zero"
  | "out_of_bounds"
  | "missing_reason";

export interface AdjustEventPointsInput {
  eventId: string;
  userId: string; // the attendee being adjusted
  points: number; // signed; non-zero
  reason: string; // required audit note
  actorId: string; // staff member making the change
}

export interface AdjustEventPointsDeps {
  pointTxRepo: PointTransactionRepository;
  clock: Clock;
}

// Largest single adjustment allowed. A guard against a fat-fingered extra
// zero, not a business rule — corrections beyond this are almost always a
// typo, and a real need can raise it.
export const MAX_ADJUSTMENT_ABS = 1000;

// Epic B1. Posts one signed admin_adjustment transaction. The DB trigger
// moves registrations.total_points; we never write the total directly, so
// the ledger stays the single source of truth (and the built-in audit trail).
export async function adjustEventPoints(
  input: AdjustEventPointsInput,
  deps: AdjustEventPointsDeps,
): Promise<{ transactionId: string }> {
  if (!Number.isInteger(input.points)) {
    throw new PointAdjustmentInvalid("not_an_integer");
  }
  if (input.points === 0) {
    throw new PointAdjustmentInvalid("zero");
  }
  if (Math.abs(input.points) > MAX_ADJUSTMENT_ABS) {
    throw new PointAdjustmentInvalid("out_of_bounds");
  }
  const reason = input.reason.trim();
  if (!reason) {
    throw new PointAdjustmentInvalid("missing_reason");
  }

  const { id } = await deps.pointTxRepo.insert({
    eventId: input.eventId,
    userId: input.userId,
    sourceType: "admin_adjustment",
    sourceId: null,
    points: input.points,
    note: reason,
    actorUserId: input.actorId,
    createdAt: deps.clock.now(),
  });

  return { transactionId: id };
}

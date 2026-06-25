import { ScanRejected } from "../../../domain/errors/ScanRejected";
import { resolveScanPoints } from "../../../domain/rules/scoringRules";
import type { Clock } from "../../ports/Clock";
import type { EventRepository } from "../../ports/EventRepository";
import type { ScanRepository } from "../../ports/ScanRepository";
import type {
  ScanTargetRepository,
  ScanTargetType,
} from "../../ports/ScanTargetRepository";

export interface ValidateAndRecordScanInput {
  eventId: string;
  scannerUserId: string;
  targetType: ScanTargetType;
  targetId: string;
}

export interface ValidateAndRecordScanDeps {
  events: EventRepository;
  targets: ScanTargetRepository;
  scans: ScanRepository;
  clock: Clock;
}

export interface ScanOutcome {
  pointsGranted: number;
  newTotal: number;
}

// The keystone use-case. Validation order matters: cheapest checks +
// most common rejections first so we minimize DB round-trips for invalid
// scans (the dominant failure mode at the door).
//
// Every rejection is also logged via scans.recordRejectedScan so we have
// an audit trail for anti-abuse — but logging errors must never mask the
// original rejection, hence the swallow inside `logRejection`.
export async function validateAndRecordScan(
  input: ValidateAndRecordScanInput,
  deps: ValidateAndRecordScanDeps,
): Promise<ScanOutcome> {
  const now = deps.clock.now();

  const event = await deps.events.findById(input.eventId);
  if (!event) {
    await logRejection(deps, input, "wrong_event");
    throw new ScanRejected("wrong_event");
  }
  if (event.status !== "live") {
    await logRejection(deps, input, "event_not_live");
    throw new ScanRejected("event_not_live");
  }
  if (now < event.startAt || now > event.endAt) {
    await logRejection(deps, input, "outside_event_hours");
    throw new ScanRejected("outside_event_hours");
  }

  const target = await findTarget(deps, input);
  if (!target || !target.isActive || target.eventId !== input.eventId) {
    await logRejection(deps, input, "target_inactive");
    throw new ScanRejected("target_inactive");
  }

  if (input.targetType === "attendee" && target.id === input.scannerUserId) {
    await logRejection(deps, input, "self_scan");
    throw new ScanRejected("self_scan");
  }

  if (target.type === "activity") {
    if (
      (target.startsAt && now < target.startsAt) ||
      (target.endsAt && now > target.endsAt)
    ) {
      await logRejection(deps, input, "outside_activity_window");
      throw new ScanRejected("outside_activity_window");
    }
  }

  const already = await deps.scans.hasAcceptedScan(
    input.eventId,
    input.scannerUserId,
    input.targetType,
    input.targetId,
  );
  if (already) {
    await logRejection(deps, input, "already_claimed");
    throw new ScanRejected("already_claimed");
  }

  const points = resolveScanPoints(target);

  // Adapter wraps the 23505 race on the unique index into
  // ScanRejected("already_claimed") so we don't double-grant under a tight
  // double-scan. We re-throw that to keep the surface clean.
  try {
    const newTotal = await deps.scans.recordAcceptedScan({
      eventId: input.eventId,
      scannerUserId: input.scannerUserId,
      targetType: input.targetType,
      targetId: input.targetId,
      points,
    });
    return { pointsGranted: points, newTotal };
  } catch (e) {
    if (e instanceof ScanRejected) {
      await logRejection(deps, input, e.reason);
    }
    throw e;
  }
}

async function findTarget(
  deps: ValidateAndRecordScanDeps,
  input: ValidateAndRecordScanInput,
) {
  switch (input.targetType) {
    case "sponsor":
      return deps.targets.find("sponsor", input.eventId, input.targetId);
    case "activity":
      return deps.targets.find("activity", input.eventId, input.targetId);
    case "attendee":
      return deps.targets.find("attendee", input.eventId, input.targetId);
  }
}

async function logRejection(
  deps: ValidateAndRecordScanDeps,
  input: ValidateAndRecordScanInput,
  reason: ScanRejected["reason"],
): Promise<void> {
  try {
    await deps.scans.recordRejectedScan({
      eventId: input.eventId,
      scannerUserId: input.scannerUserId,
      targetType: input.targetType,
      targetId: input.targetId,
      reason,
    });
  } catch {
    // Logging the rejection must never mask the original rejection.
    // Swallow and let observability/Sentry catch any persistent failure.
  }
}

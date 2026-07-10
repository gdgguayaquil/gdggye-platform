import type { RegistrationRepository } from "../../ports/RegistrationRepository";
import type { ScanLogRepository } from "../../ports/ScanLogRepository";

export interface EventOverview {
  registrations: number;
  preCheckin: {
    approved: number;
    pending: number;
    rejected: number;
    notSubmitted: number;
  };
  // Sum of registrations.total_points — points currently held by attendees.
  pointsGranted: number;
  scansAccepted: number;
  scansRejected: number;
}

export interface GetEventOverviewDeps {
  registrationRepo: RegistrationRepository;
  scanLogRepo: ScanLogRepository;
}

// Epic E1. The event's vital signs for the admin overview header. Pure
// composition of reads built in earlier sprints — registration aggregates
// come from listByEvent, scan totals from the scan summary. No new tables.
export async function getEventOverview(
  eventId: string,
  deps: GetEventOverviewDeps,
): Promise<EventOverview> {
  const [registrations, scanSummary] = await Promise.all([
    deps.registrationRepo.listByEvent(eventId),
    deps.scanLogRepo.summaryForEvent(eventId),
  ]);

  const preCheckin = {
    approved: 0,
    pending: 0,
    rejected: 0,
    notSubmitted: 0,
  };
  let pointsGranted = 0;
  for (const reg of registrations) {
    pointsGranted += reg.totalPoints;
    switch (reg.preCheckinStatus) {
      case "approved":
        preCheckin.approved += 1;
        break;
      case "pending":
        preCheckin.pending += 1;
        break;
      case "rejected":
        preCheckin.rejected += 1;
        break;
      default:
        preCheckin.notSubmitted += 1;
    }
  }

  return {
    registrations: registrations.length,
    preCheckin,
    pointsGranted,
    scansAccepted: scanSummary.accepted,
    scansRejected: scanSummary.rejected,
  };
}

import type {
  ScanTarget,
  SponsorScanTarget,
  ActivityScanTarget,
  AttendeeScanTarget,
} from "../../domain/rules/scoringRules";

export type ScanTargetType = ScanTarget["type"];

// Unifies sponsor/activity/attendee lookups behind a single port so the
// use-case doesn't care which underlying table backs the target. The
// adapter joins event_sponsors → sponsors (Sprint 4 sponsor scans only
// land if the sponsor is attached and active *at this event*) and reads
// activities directly.
export interface ScanTargetRepository {
  find(
    type: "sponsor",
    eventId: string,
    targetId: string,
  ): Promise<SponsorScanTarget | null>;
  find(
    type: "activity",
    eventId: string,
    targetId: string,
  ): Promise<ActivityScanTarget | null>;
  find(
    type: "attendee",
    eventId: string,
    targetId: string,
  ): Promise<AttendeeScanTarget | null>;
}

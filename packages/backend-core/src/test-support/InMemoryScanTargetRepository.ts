import type { ScanTargetRepository } from "../application/ports/ScanTargetRepository";
import type {
  ActivityScanTarget,
  AttendeeScanTarget,
  ScanTarget,
  SponsorScanTarget,
} from "../domain/rules/scoringRules";

// Seed with a mixed bag of targets; the repo picks by (type, eventId, id).
// eventId is part of the lookup key on purpose — the DB adapter joins
// event_sponsors so a sponsor attached to a different event returns null.
export class InMemoryScanTargetRepository implements ScanTargetRepository {
  private targets: ScanTarget[];

  constructor(seed: ScanTarget[] = []) {
    this.targets = [...seed];
  }

  async find(
    type: "sponsor",
    eventId: string,
    targetId: string,
  ): Promise<SponsorScanTarget | null>;
  async find(
    type: "activity",
    eventId: string,
    targetId: string,
  ): Promise<ActivityScanTarget | null>;
  async find(
    type: "attendee",
    eventId: string,
    targetId: string,
  ): Promise<AttendeeScanTarget | null>;
  async find(
    type: ScanTarget["type"],
    eventId: string,
    targetId: string,
  ): Promise<ScanTarget | null> {
    const match = this.targets.find(
      (t) => t.type === type && t.eventId === eventId && t.id === targetId,
    );
    return match ?? null;
  }
}

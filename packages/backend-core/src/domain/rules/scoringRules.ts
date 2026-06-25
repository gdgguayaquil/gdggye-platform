// Scoring rules — single source of truth for "how many points does a scan
// grant?". Lives in the domain layer so route handlers, tests, and admin
// previews all agree. Sponsor scans are a flat constant (BWAI 2026 v1);
// activity scans read the per-activity value (organizer-configured).
//
// If we ever need per-event sponsor points, this is the only file that
// changes — the resolver signature already takes the target.

export const SPONSOR_SCAN_POINTS = 10;

export interface SponsorScanTarget {
  type: "sponsor";
  id: string;
  eventId: string;
  isActive: boolean;
}

export interface ActivityScanTarget {
  type: "activity";
  id: string;
  eventId: string;
  isActive: boolean;
  points: number;
  startsAt: Date | null;
  endsAt: Date | null;
}

export interface AttendeeScanTarget {
  type: "attendee";
  id: string;
  eventId: string;
  isActive: boolean;
}

// Unified discriminated union. Attendee is only relevant in Phase 5
// (networking scans). Carrying it now keeps the use-case's switch
// exhaustive instead of an `else throw new Error("unreachable")`.
export type ScanTarget =
  | SponsorScanTarget
  | ActivityScanTarget
  | AttendeeScanTarget;

export function resolveScanPoints(target: ScanTarget): number {
  switch (target.type) {
    case "sponsor":
      return SPONSOR_SCAN_POINTS;
    case "activity":
      return target.points;
    case "attendee":
      // Networking scans are out of Phase 2 scope; default to 0 to be safe
      // if a v1 QR ever encodes an attendee target.
      return 0;
  }
}

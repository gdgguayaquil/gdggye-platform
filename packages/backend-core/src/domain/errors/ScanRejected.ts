// Domain error thrown by validateAndRecordScan when a scan can't be honored.
// The route handler maps `reason` to an HTTP response and a rejected
// `scan_logs` row. Keep the union closed — adding a new rejection reason
// must be a deliberate, code-reviewed change.

export type ScanRejectReason =
  | "wrong_event"
  | "event_not_live"
  | "outside_event_hours"
  | "target_inactive"
  | "outside_activity_window"
  | "already_claimed"
  | "self_scan";

export class ScanRejected extends Error {
  readonly reason: ScanRejectReason;
  constructor(reason: ScanRejectReason) {
    super(`scan_rejected:${reason}`);
    this.name = "ScanRejected";
    this.reason = reason;
  }
}

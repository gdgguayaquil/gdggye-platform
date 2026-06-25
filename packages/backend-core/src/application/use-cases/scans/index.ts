export {
  validateAndRecordScan,
  type ValidateAndRecordScanInput,
  type ValidateAndRecordScanDeps,
  type ScanOutcome,
} from "./validateAndRecordScan";
export {
  ScanRejected,
  type ScanRejectReason,
} from "../../../domain/errors/ScanRejected";
export {
  SPONSOR_SCAN_POINTS,
  resolveScanPoints,
  type ScanTarget,
  type SponsorScanTarget,
  type ActivityScanTarget,
  type AttendeeScanTarget,
} from "../../../domain/rules/scoringRules";

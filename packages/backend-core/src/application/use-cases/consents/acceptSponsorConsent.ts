import {
  recordConsentEffect,
  type AcceptConsentInput,
  type AcceptConsentDeps,
  type AcceptConsentResult,
} from "./recordConsent";

// Epic B3 — sponsor data-sharing consent is OPTIONAL. Declining never
// blocks participation. Affects what shows up in sponsor reports (Phase 6).
export async function acceptSponsorConsent(
  input: AcceptConsentInput,
  deps: AcceptConsentDeps,
): Promise<AcceptConsentResult> {
  return recordConsentEffect("sponsor", input, deps);
}

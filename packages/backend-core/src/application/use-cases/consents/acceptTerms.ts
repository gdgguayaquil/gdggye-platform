import {
  recordConsentEffect,
  type AcceptConsentInput,
  type AcceptConsentDeps,
  type AcceptConsentResult,
} from "./recordConsent";

// Epic B2 — accepting terms is a required gate for event participation.
export async function acceptTerms(
  input: AcceptConsentInput,
  deps: AcceptConsentDeps,
): Promise<AcceptConsentResult> {
  return recordConsentEffect("terms", input, deps);
}

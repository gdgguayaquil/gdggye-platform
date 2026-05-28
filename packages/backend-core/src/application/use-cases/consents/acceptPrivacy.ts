import {
  recordConsentEffect,
  type AcceptConsentInput,
  type AcceptConsentDeps,
  type AcceptConsentResult,
} from "./recordConsent";

// Epic B2 — accepting privacy is a required gate for event participation.
export async function acceptPrivacy(
  input: AcceptConsentInput,
  deps: AcceptConsentDeps,
): Promise<AcceptConsentResult> {
  return recordConsentEffect("privacy", input, deps);
}

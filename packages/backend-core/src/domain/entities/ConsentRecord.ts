// Domain entity: ConsentRecord
// Append-only audit trail. Each accept/re-accept writes a new row, so we
// can prove the user consented to a specific *version* at a specific time.

export type ConsentType = "terms" | "privacy" | "sponsor";

export interface ConsentRecord {
  id: string;
  userId: string;
  consentType: ConsentType;
  version: string;
  acceptedAt: Date;
}

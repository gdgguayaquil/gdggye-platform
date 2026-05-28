import type {
  ConsentRecord,
  ConsentType,
} from "../../domain/entities/ConsentRecord";

export interface RecordConsentInput {
  userId: string;
  consentType: ConsentType;
  version: string;
  acceptedAt: Date;
}

export interface ConsentRepository {
  record(input: RecordConsentInput): Promise<ConsentRecord>;
  listForUser(userId: string): Promise<ConsentRecord[]>;
}

import type { ConsentRecord } from "../domain/entities/ConsentRecord";
import type {
  ConsentRepository,
  RecordConsentInput,
} from "../application/ports/ConsentRepository";

export class InMemoryConsentRepository implements ConsentRepository {
  private records: ConsentRecord[] = [];
  private counter = 0;

  async record(input: RecordConsentInput): Promise<ConsentRecord> {
    this.counter += 1;
    const created: ConsentRecord = {
      id: `consent-${this.counter}`,
      userId: input.userId,
      consentType: input.consentType,
      version: input.version,
      acceptedAt: input.acceptedAt,
    };
    this.records.push(created);
    return created;
  }

  async listForUser(userId: string): Promise<ConsentRecord[]> {
    return this.records.filter((r) => r.userId === userId);
  }
}

import type {
  ScanHistoryEntry,
  ScanLogRepository,
} from "../application/ports/ScanLogRepository";

export class InMemoryScanLogRepository implements ScanLogRepository {
  constructor(private rows: ScanHistoryEntry[] = []) {}

  async listForUser(
    eventId: string,
    userId: string,
  ): Promise<ScanHistoryEntry[]> {
    return this.rows
      .filter((r) => r.eventId === eventId && r.scannerUserId === userId)
      .sort((a, b) => b.scannedAt.getTime() - a.scannedAt.getTime());
  }
}

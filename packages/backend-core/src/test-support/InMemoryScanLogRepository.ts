import type {
  ScanEventSummary,
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

  async listByEvent(
    eventId: string,
    limit: number,
  ): Promise<ScanHistoryEntry[]> {
    return this.rows
      .filter((r) => r.eventId === eventId)
      .sort((a, b) => b.scannedAt.getTime() - a.scannedAt.getTime())
      .slice(0, limit);
  }

  async summaryForEvent(eventId: string): Promise<ScanEventSummary> {
    const rows = this.rows.filter((r) => r.eventId === eventId);
    const rejectedRows = rows.filter((r) => r.result === "rejected");
    const byReason = new Map<string, number>();
    for (const r of rejectedRows) {
      const reason = r.rejectReason ?? "unknown";
      byReason.set(reason, (byReason.get(reason) ?? 0) + 1);
    }
    return {
      accepted: rows.filter((r) => r.result === "accepted").length,
      rejected: rejectedRows.length,
      rejectReasons: [...byReason.entries()]
        .map(([reason, count]) => ({ reason, count }))
        .sort((a, b) => b.count - a.count),
    };
  }
}

import type { Registration } from "../domain/entities/Registration";
import type {
  EnsureRegistrationInput,
  RegistrationRepository,
} from "../application/ports/RegistrationRepository";

export class InMemoryRegistrationRepository implements RegistrationRepository {
  private rows: Registration[] = [];
  private counter = 0;

  constructor(seed: Registration[] = []) {
    this.rows = [...seed];
  }

  async findByEventAndUser(
    eventId: string,
    userId: string,
  ): Promise<Registration | null> {
    return (
      this.rows.find((r) => r.eventId === eventId && r.userId === userId) ??
      null
    );
  }

  async listByEvent(eventId: string): Promise<Registration[]> {
    return this.rows.filter((r) => r.eventId === eventId);
  }

  async ensure(input: EnsureRegistrationInput): Promise<Registration> {
    const existing = await this.findByEventAndUser(input.eventId, input.userId);
    if (existing) return existing;
    this.counter += 1;
    const created: Registration = {
      id: `reg-${this.counter}`,
      eventId: input.eventId,
      userId: input.userId,
      preCheckinStatus: "not_submitted",
      approvedAt: null,
      totalPoints: 0,
      eventRank: null,
      createdAt: new Date(),
    };
    this.rows.push(created);
    return created;
  }
}

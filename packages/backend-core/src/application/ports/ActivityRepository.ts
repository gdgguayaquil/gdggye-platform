import type { Activity } from "../../domain/entities/Activity";

export interface CreateActivityInput {
  sponsorId: string;
  eventId: string;
  name: string;
  points?: number;
  startsAt?: Date | null;
  endsAt?: Date | null;
  qrRotationSeconds?: number;
  isActive?: boolean;
}

export interface UpdateActivityInput {
  name?: string;
  points?: number;
  startsAt?: Date | null;
  endsAt?: Date | null;
  qrRotationSeconds?: number;
  isActive?: boolean;
}

export interface ActivityRepository {
  findById(id: string): Promise<Activity | null>;
  listForEvent(eventId: string): Promise<Activity[]>;
  listForSponsor(sponsorId: string): Promise<Activity[]>;
  create(input: CreateActivityInput): Promise<Activity>;
  update(id: string, patch: UpdateActivityInput): Promise<Activity>;
  setActive(id: string, isActive: boolean): Promise<Activity>;
}

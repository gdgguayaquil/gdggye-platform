import type { Activity } from "../../../domain/entities/Activity";
import type {
  ActivityRepository,
  CreateActivityInput,
  UpdateActivityInput,
} from "../../ports/ActivityRepository";

export type ActivityValidationReason =
  | "blank_name"
  | "negative_points"
  | "invalid_window";

export class ActivityValidationError extends Error {
  constructor(public readonly reason: ActivityValidationReason) {
    super(`Activity validation failed: ${reason}`);
    this.name = "ActivityValidationError";
  }
}

function validateName(name: string | undefined): void {
  if (name !== undefined && name.trim().length === 0) {
    throw new ActivityValidationError("blank_name");
  }
}

function validatePoints(points: number | undefined): void {
  if (points !== undefined && (!Number.isInteger(points) || points < 0)) {
    throw new ActivityValidationError("negative_points");
  }
}

function validateWindow(
  startsAt: Date | null | undefined,
  endsAt: Date | null | undefined,
): void {
  if (startsAt && endsAt && endsAt.getTime() <= startsAt.getTime()) {
    throw new ActivityValidationError("invalid_window");
  }
}

export interface ActivityDeps {
  activityRepo: ActivityRepository;
}

export async function listActivitiesForEvent(
  eventId: string,
  deps: ActivityDeps,
): Promise<Activity[]> {
  return deps.activityRepo.listForEvent(eventId);
}

export async function listActivitiesForSponsor(
  sponsorId: string,
  deps: ActivityDeps,
): Promise<Activity[]> {
  return deps.activityRepo.listForSponsor(sponsorId);
}

export async function getActivity(
  id: string,
  deps: ActivityDeps,
): Promise<Activity | null> {
  return deps.activityRepo.findById(id);
}

export async function createActivity(
  input: CreateActivityInput,
  deps: ActivityDeps,
): Promise<Activity> {
  validateName(input.name);
  validatePoints(input.points);
  validateWindow(input.startsAt, input.endsAt);
  return deps.activityRepo.create(input);
}

export async function updateActivity(
  id: string,
  patch: UpdateActivityInput,
  deps: ActivityDeps,
): Promise<Activity> {
  validateName(patch.name);
  validatePoints(patch.points);
  validateWindow(patch.startsAt, patch.endsAt);
  return deps.activityRepo.update(id, patch);
}

export async function setActivityActive(
  id: string,
  isActive: boolean,
  deps: ActivityDeps,
): Promise<Activity> {
  return deps.activityRepo.setActive(id, isActive);
}

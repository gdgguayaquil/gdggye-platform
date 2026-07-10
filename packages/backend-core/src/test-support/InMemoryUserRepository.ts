import type { User } from "../domain/entities/User";
import type {
  BootstrapUserInput,
  ProfileUpdate,
  UserRepository,
} from "../application/ports/UserRepository";

function emptyUser(id: string, email: string): User {
  return {
    id,
    googleId: null,
    email,
    fullName: "",
    photoUrl: null,
    company: null,
    role: null,
    phone: null,
    city: null,
    socialLinks: {},
    systemRole: "attendee",
    acceptedTermsAt: null,
    acceptedPrivacyAt: null,
    acceptedSponsorConsentAt: null,
    createdAt: new Date(0),
    updatedAt: new Date(0),
  };
}

export class InMemoryUserRepository implements UserRepository {
  private users: Map<string, User>;

  constructor(seed: User[] = []) {
    this.users = new Map(seed.map((u) => [u.id, u]));
  }

  async findById(id: string): Promise<User | null> {
    return this.users.get(id) ?? null;
  }

  async findByGoogleId(googleId: string): Promise<User | null> {
    for (const u of this.users.values()) {
      if (u.googleId === googleId) return u;
    }
    return null;
  }

  async findManyByIds(ids: string[]): Promise<User[]> {
    return ids
      .map((id) => this.users.get(id))
      .filter((u): u is User => u !== undefined);
  }

  async upsertBootstrap(input: BootstrapUserInput): Promise<User> {
    const existing = this.users.get(input.id);
    if (existing) return existing;
    const created: User = {
      ...emptyUser(input.id, input.email),
      googleId: input.googleId ?? null,
      fullName: input.fullName ?? "",
      photoUrl: input.photoUrl ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.set(created.id, created);
    return created;
  }

  async updateProfile(userId: string, patch: ProfileUpdate): Promise<User> {
    const existing = this.users.get(userId);
    if (!existing) {
      throw new Error(
        `InMemoryUserRepository.updateProfile: ${userId} not found`,
      );
    }
    const updated: User = {
      ...existing,
      ...patch,
      socialLinks: patch.socialLinks ?? existing.socialLinks,
      updatedAt: new Date(),
    };
    this.users.set(userId, updated);
    return updated;
  }

  async setConsentTimestamp(
    userId: string,
    consentType: "terms" | "privacy" | "sponsor",
    at: Date,
  ): Promise<User> {
    const existing = this.users.get(userId);
    if (!existing) {
      throw new Error(
        `InMemoryUserRepository.setConsentTimestamp: ${userId} not found`,
      );
    }
    const updated: User = {
      ...existing,
      acceptedTermsAt: consentType === "terms" ? at : existing.acceptedTermsAt,
      acceptedPrivacyAt:
        consentType === "privacy" ? at : existing.acceptedPrivacyAt,
      acceptedSponsorConsentAt:
        consentType === "sponsor" ? at : existing.acceptedSponsorConsentAt,
      updatedAt: new Date(),
    };
    this.users.set(userId, updated);
    return updated;
  }
}

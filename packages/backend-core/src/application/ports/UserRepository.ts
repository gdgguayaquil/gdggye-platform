import type { SocialLinks, User } from "../../domain/entities/User";

export interface ProfileUpdate {
  fullName?: string;
  photoUrl?: string | null;
  company?: string | null;
  role?: string | null;
  phone?: string | null;
  city?: string | null;
  socialLinks?: SocialLinks;
}

export interface BootstrapUserInput {
  id: string;
  email: string;
  googleId?: string | null;
  fullName?: string;
  photoUrl?: string | null;
}

export interface UserRepository {
  findById(id: string): Promise<User | null>;
  findByGoogleId(googleId: string): Promise<User | null>;

  // Idempotent insert keyed by `id` (= auth.users.id). Used by signInBootstrap.
  upsertBootstrap(input: BootstrapUserInput): Promise<User>;

  updateProfile(userId: string, patch: ProfileUpdate): Promise<User>;

  // Stamp the corresponding accepted_*_at column. Use-cases for terms,
  // privacy and sponsor consent each call this with their key.
  setConsentTimestamp(
    userId: string,
    consentType: "terms" | "privacy" | "sponsor",
    at: Date,
  ): Promise<User>;
}

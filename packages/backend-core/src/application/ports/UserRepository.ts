import type { SocialLinks, SystemRole, User } from "../../domain/entities/User";

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

  // Batch identity lookup — hydrates a list of registrations/scans without
  // N+1 findById calls. Order and completeness are not guaranteed; the
  // caller maps by id. An empty input returns an empty array.
  findManyByIds(ids: string[]): Promise<User[]>;

  // Admin user directory, newest first, paginated. Behind the users_self_read
  // is_staff branch. Used by the role-management screen.
  listUsers(limit: number, offset: number): Promise<User[]>;

  // Sets one user's system_role. Admin-only at both the app (requireAdmin)
  // and DB (users_admin_role_write + guard_system_role) layers.
  setSystemRole(userId: string, role: SystemRole): Promise<User>;

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

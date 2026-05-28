import type { Database } from "@gdggye/types";
import type {
  ConsentRecord,
  ConsentType,
  Registration,
  SocialLinks,
  User,
} from "@gdggye/backend-core";

type UserRow = Database["public"]["Tables"]["users"]["Row"];
type ConsentRow = Database["public"]["Tables"]["consent_records"]["Row"];
type RegistrationRow = Database["public"]["Tables"]["registrations"]["Row"];

export function rowToUser(row: UserRow): User {
  return {
    id: row.id,
    googleId: row.google_id,
    email: row.email,
    fullName: row.full_name,
    photoUrl: row.photo_url,
    company: row.company,
    role: row.role,
    phone: row.phone,
    city: row.city,
    socialLinks: (row.social_links ?? {}) as unknown as SocialLinks,
    systemRole: row.system_role,
    acceptedTermsAt: row.accepted_terms_at
      ? new Date(row.accepted_terms_at)
      : null,
    acceptedPrivacyAt: row.accepted_privacy_at
      ? new Date(row.accepted_privacy_at)
      : null,
    acceptedSponsorConsentAt: row.accepted_sponsor_consent_at
      ? new Date(row.accepted_sponsor_consent_at)
      : null,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export function rowToConsentRecord(row: ConsentRow): ConsentRecord {
  return {
    id: row.id,
    userId: row.user_id,
    consentType: row.consent_type as ConsentType,
    version: row.version,
    acceptedAt: new Date(row.accepted_at),
  };
}

export function rowToRegistration(row: RegistrationRow): Registration {
  return {
    id: row.id,
    eventId: row.event_id,
    userId: row.user_id,
    preCheckinStatus: row.pre_checkin_status,
    approvedAt: row.approved_at ? new Date(row.approved_at) : null,
    totalPoints: row.total_points,
    eventRank: row.event_rank,
    createdAt: new Date(row.created_at),
  };
}

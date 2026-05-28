// Domain entity: User
// One row per authenticated person. Identity comes from auth.users (Supabase
// Auth); this entity carries the app-side profile + consent timestamps.

export type SystemRole = "attendee" | "organizer" | "admin";

export type SocialLinks = Record<string, string>;

export interface User {
  id: string; // matches auth.users.id
  googleId: string | null;
  email: string;
  fullName: string;
  photoUrl: string | null;
  company: string | null;
  role: string | null; // job title, free text
  phone: string | null;
  city: string | null;
  socialLinks: SocialLinks;
  systemRole: SystemRole;
  acceptedTermsAt: Date | null;
  acceptedPrivacyAt: Date | null;
  acceptedSponsorConsentAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// Domain rule: a user can engage with an event only after their profile is
// complete AND the two required consents (terms + privacy) are recorded.
// Sponsor-data-sharing consent is independent and never blocks participation.
export function isProfileComplete(user: User): boolean {
  return user.fullName.trim().length > 0 && user.email.trim().length > 0;
}

export function hasRequiredConsents(user: User): boolean {
  return user.acceptedTermsAt !== null && user.acceptedPrivacyAt !== null;
}

export function canParticipateInEvents(user: User): boolean {
  return isProfileComplete(user) && hasRequiredConsents(user);
}

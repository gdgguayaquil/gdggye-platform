"use server";

import { revalidatePath } from "next/cache";

import {
  ProfileIncomplete,
  hasRequiredConsents,
  isProfileComplete,
} from "@gdggye/backend-core";

import { requireUser } from "@/lib/server/auth";
import {
  acceptPrivacy,
  acceptSponsorConsent,
  acceptTerms,
} from "@/lib/server/consents";
import { completeProfile } from "@/lib/server/users";

export interface ProfileFormState {
  ok: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
}

function readString(form: FormData, key: string): string {
  const v = form.get(key);
  return typeof v === "string" ? v.trim() : "";
}

function readBool(form: FormData, key: string): boolean {
  return form.get(key) === "on";
}

// Single server action driving the profile form. Saves profile fields,
// then records any newly-accepted consents in order so the user can
// reach an "event-eligible" state in one submit.
export async function saveProfile(
  _prev: ProfileFormState,
  formData: FormData,
): Promise<ProfileFormState> {
  const user = await requireUser();

  const fullName = readString(formData, "fullName");
  const fieldErrors: Record<string, string> = {};
  if (!fullName) fieldErrors.fullName = "Required";
  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, fieldErrors };
  }

  try {
    await completeProfile({
      userId: user.id,
      fullName,
      company: readString(formData, "company") || null,
      role: readString(formData, "role") || null,
      phone: readString(formData, "phone") || null,
      city: readString(formData, "city") || null,
    });
  } catch (e) {
    if (e instanceof ProfileIncomplete) {
      const fe: Record<string, string> = {};
      for (const f of e.missing) fe[f] = "Required";
      return { ok: false, fieldErrors: fe };
    }
    throw e;
  }

  // Consents — fire only the ones the user newly accepted on this submit.
  // Re-accepting is harmless (writes a new consent_records row), but we
  // skip it to keep the audit log tight.
  if (readBool(formData, "termsAccepted") && !user.acceptedTermsAt) {
    await acceptTerms({ userId: user.id });
  }
  if (readBool(formData, "privacyAccepted") && !user.acceptedPrivacyAt) {
    await acceptPrivacy({ userId: user.id });
  }
  if (readBool(formData, "sponsorAccepted") && !user.acceptedSponsorConsentAt) {
    await acceptSponsorConsent({ userId: user.id });
  }

  revalidatePath("/profile");

  // Surface whether the user is now event-eligible. Refresh the row to
  // pick up timestamps written by the consent use-cases.
  const updated = await requireUser();
  if (!isProfileComplete(updated) || !hasRequiredConsents(updated)) {
    return { ok: true };
  }
  return { ok: true };
}

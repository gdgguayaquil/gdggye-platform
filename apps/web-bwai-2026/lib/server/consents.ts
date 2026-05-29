import "server-only";

import {
  acceptPrivacy as acceptPrivacyUseCase,
  acceptSponsorConsent as acceptSponsorConsentUseCase,
  acceptTerms as acceptTermsUseCase,
  type AcceptConsentInput,
} from "@gdggye/backend-core";

import { SystemClock } from "./clock";
import { getSupabaseRepos } from "./supabase";

const clock = new SystemClock();

export async function acceptTerms(input: AcceptConsentInput) {
  const { consentRepo, userRepo } = await getSupabaseRepos();
  return acceptTermsUseCase(input, { consentRepo, userRepo, clock });
}

export async function acceptPrivacy(input: AcceptConsentInput) {
  const { consentRepo, userRepo } = await getSupabaseRepos();
  return acceptPrivacyUseCase(input, { consentRepo, userRepo, clock });
}

export async function acceptSponsorConsent(input: AcceptConsentInput) {
  const { consentRepo, userRepo } = await getSupabaseRepos();
  return acceptSponsorConsentUseCase(input, {
    consentRepo,
    userRepo,
    clock,
  });
}

import type { Clock } from "@gdggye/backend-core";

// Trivial real-time Clock adapter. Lives in supabase-adapters because
// the use-cases are always wired with a service-role or server client
// from this package — keeps the adapter layer the single composition root.
export class SystemClock implements Clock {
  now(): Date {
    return new Date();
  }
}

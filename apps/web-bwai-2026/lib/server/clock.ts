import "server-only";

import type { Clock } from "@gdggye/backend-core";

// App-side concrete Clock. Lives here (not in backend-core) so the use-cases
// stay infrastructure-free.
export class SystemClock implements Clock {
  now(): Date {
    return new Date();
  }
}

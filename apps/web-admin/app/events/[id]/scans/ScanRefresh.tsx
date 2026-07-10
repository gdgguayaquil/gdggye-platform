"use client";

import { useRouter } from "next/navigation";
import * as React from "react";

import { Button } from "@gdggye/ui-kit";

// Manual refresh for the scan feed. Realtime is deferred (see CLAUDE-phase4
// Epic C1) — router.refresh() re-runs the server component and pulls the
// latest scans without a full reload.
export function ScanRefresh() {
  const router = useRouter();
  const [pending, start] = React.useTransition();
  return (
    <Button
      type="button"
      variant="secondary"
      disabled={pending}
      onClick={() => start(() => router.refresh())}
    >
      {pending ? "Refreshing…" : "Refresh"}
    </Button>
  );
}

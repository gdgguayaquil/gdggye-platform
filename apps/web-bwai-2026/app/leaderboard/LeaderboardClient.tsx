"use client";

import * as React from "react";

import {
  SupabaseLeaderboardRepository,
  createSupabaseBrowserClient,
} from "@gdggye/supabase-adapters/browser";
import type { LeaderboardEntry } from "@gdggye/backend-core";

interface MyRank {
  totalPoints: number;
  rank: number | null;
}

export function LeaderboardClient({
  eventId,
  initialEntries,
  currentUserId,
  initialMyRank,
  limit,
}: {
  eventId: string;
  initialEntries: LeaderboardEntry[];
  currentUserId: string | null;
  initialMyRank: MyRank | null;
  limit: number;
}) {
  const [entries, setEntries] =
    React.useState<LeaderboardEntry[]>(initialEntries);
  const [myRank, setMyRank] = React.useState<MyRank | null>(initialMyRank);
  const [connected, setConnected] = React.useState(false);

  // Capture the supabase client + repo in refs so the realtime effect
  // doesn't churn them across renders.
  const repoRef = React.useRef<SupabaseLeaderboardRepository | null>(null);
  if (!repoRef.current) {
    repoRef.current = new SupabaseLeaderboardRepository(
      createSupabaseBrowserClient(),
    );
  }

  // Debounced refetch: bursts of scans land as multiple postgres_changes
  // messages within milliseconds. Coalesce them into a single RPC round
  // trip so the leaderboard doesn't thrash on event day.
  const refetch = React.useCallback(async () => {
    const repo = repoRef.current!;
    try {
      const next = await repo.top(eventId, limit);
      setEntries(next);
      if (currentUserId) {
        const r = await repo.userRank(eventId, currentUserId);
        setMyRank(r ? { totalPoints: r.totalPoints, rank: r.rank } : null);
      }
    } catch {
      // Network flap during a tick is fine — next tick will refresh.
    }
  }, [eventId, limit, currentUserId]);

  React.useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    let pending: ReturnType<typeof setTimeout> | null = null;
    const schedule = () => {
      if (pending) clearTimeout(pending);
      pending = setTimeout(refetch, 600);
    };

    const channel = supabase
      .channel(`leaderboard:${eventId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "registrations",
          filter: `event_id=eq.${eventId}`,
        },
        schedule,
      )
      .subscribe((status) => {
        setConnected(status === "SUBSCRIBED");
      });

    return () => {
      if (pending) clearTimeout(pending);
      void supabase.removeChannel(channel);
    };
  }, [eventId, refetch]);

  const topIds = new Set(entries.map((e) => e.userId));
  const showMePinned =
    currentUserId !== null &&
    myRank !== null &&
    !topIds.has(currentUserId) &&
    myRank.rank !== null;

  return (
    <div className="mx-auto max-w-[640px]">
      <div className="mb-3 flex items-center justify-between font-mono text-[11px] uppercase tracking-wider text-[var(--c-text-subtle)]">
        <span>Top {entries.length}</span>
        <span className="inline-flex items-center gap-1.5">
          <span
            className="inline-block h-2 w-2 rounded-full"
            style={{
              background: connected ? "var(--c-green)" : "var(--c-text-subtle)",
            }}
            aria-hidden
          />
          {connected ? "en vivo" : "conectando…"}
        </span>
      </div>

      <ol className="overflow-hidden rounded-[var(--r-lg)] border border-[var(--c-border)]">
        {entries.length === 0 ? (
          <li className="px-5 py-10 text-center text-[var(--c-text-muted)]">
            Aún no hay puntos registrados. ¡Sé el primero!
          </li>
        ) : (
          entries.map((row) => (
            <LeaderboardRow
              key={row.userId}
              row={row}
              isYou={row.userId === currentUserId}
            />
          ))
        )}
      </ol>

      {showMePinned ? (
        <div className="mt-6">
          <div className="mb-2 font-mono text-[11px] uppercase tracking-wider text-[var(--c-text-subtle)]">
            Tu posición
          </div>
          <div className="overflow-hidden rounded-[var(--r-lg)] border border-[var(--c-border)]">
            <LeaderboardRow
              row={{
                userId: currentUserId!,
                fullName: "Tú",
                photoUrl: null,
                totalPoints: myRank!.totalPoints,
                rank: myRank!.rank!,
              }}
              isYou
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}

function LeaderboardRow({
  row,
  isYou,
}: {
  row: LeaderboardEntry;
  isYou: boolean;
}) {
  const name = row.fullName.trim() || (isYou ? "Tú" : "—");
  return (
    <li
      className="grid items-center gap-3 border-b border-[var(--c-border)] px-4 py-3 last:border-b-0"
      style={{
        gridTemplateColumns: "44px 40px 1fr 80px",
        background: isYou
          ? "color-mix(in srgb, var(--c-blue) 8%, transparent)"
          : "transparent",
      }}
    >
      <div className="text-right font-mono text-sm tabular-nums text-[var(--c-text-muted)]">
        #{row.rank}
      </div>
      <div
        className="overflow-hidden rounded-full border border-[var(--c-border)] bg-[var(--c-surface)]"
        style={{ width: 40, height: 40 }}
      >
        {row.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={row.photoUrl}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center font-display text-sm text-[var(--c-text-muted)]">
            {name.slice(0, 1).toUpperCase()}
          </div>
        )}
      </div>
      <div className="min-w-0">
        <div className="truncate font-display font-semibold">
          {name}
          {isYou ? (
            <span
              className="ml-2 align-middle font-mono text-[10px] uppercase tracking-wider"
              style={{ color: "var(--c-blue)" }}
            >
              tú
            </span>
          ) : null}
        </div>
      </div>
      <div className="text-right font-mono text-sm font-semibold tabular-nums">
        {row.totalPoints}
        <span className="ml-1 text-xs font-normal text-[var(--c-text-muted)]">
          pts
        </span>
      </div>
    </li>
  );
}

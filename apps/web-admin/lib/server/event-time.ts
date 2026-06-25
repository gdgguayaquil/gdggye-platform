// Timezone helpers for converting between the admin form's
// `<input type="datetime-local">` value ("YYYY-MM-DDTHH:MM") and the
// canonical UTC Date stored in agenda_slots.start_at.
//
// `datetime-local` value is naive wall-clock — no zone info. The event's
// timezone (e.g. "America/Guayaquil") is the authority. These helpers
// resolve the naive string against that zone, and back.

interface DateTimeParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
}

function partsInZone(date: Date, timeZone: string): DateTimeParts {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts = fmt.formatToParts(date);
  const v = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((p) => p.type === type)?.value);
  return {
    year: v("year"),
    month: v("month"),
    day: v("day"),
    hour: v("hour") === 24 ? 0 : v("hour"), // Intl quirk: midnight is "24"
    minute: v("minute"),
  };
}

// Convert "YYYY-MM-DDTHH:MM" interpreted in `timeZone` → UTC Date.
//
// Strategy: build a tentative UTC timestamp from the naive components,
// then ask the target timezone what wall-clock it shows for that instant.
// The difference is the offset; apply it once.
export function localStringToUtc(
  localStr: string,
  timeZone: string,
): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(localStr);
  if (!m) return null;
  const [, ys, ms, ds, hs, mins] = m;
  const y = Number(ys);
  const mo = Number(ms);
  const d = Number(ds);
  const h = Number(hs);
  const mi = Number(mins);
  if (
    Number.isNaN(y) ||
    Number.isNaN(mo) ||
    Number.isNaN(d) ||
    Number.isNaN(h) ||
    Number.isNaN(mi)
  )
    return null;

  const tentative = Date.UTC(y, mo - 1, d, h, mi, 0);
  const tzView = partsInZone(new Date(tentative), timeZone);
  const tzInstant = Date.UTC(
    tzView.year,
    tzView.month - 1,
    tzView.day,
    tzView.hour,
    tzView.minute,
    0,
  );
  const offsetMs = tentative - tzInstant;
  return new Date(tentative + offsetMs);
}

// Format a UTC Date as "YYYY-MM-DDTHH:MM" in `timeZone`. The result is
// suitable as a `<input type="datetime-local">` default value.
export function utcToLocalString(date: Date, timeZone: string): string {
  const p = partsInZone(date, timeZone);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${p.year}-${pad(p.month)}-${pad(p.day)}T${pad(p.hour)}:${pad(p.minute)}`;
}

export function Logo({ size = 24 }: { size?: number }) {
  const dotR = size * 0.13;
  const cx = size / 2;
  const cy = size / 2;
  return (
    <span className="inline-flex items-center gap-2.5">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={cx - size * 0.28}
          cy={cy + size * 0.05}
          r={dotR}
          fill="var(--c-blue)"
        />
        <circle
          cx={cx - size * 0.1}
          cy={cy - size * 0.18}
          r={dotR}
          fill="var(--c-red)"
        />
        <circle
          cx={cx + size * 0.1}
          cy={cy - size * 0.18}
          r={dotR}
          fill="var(--c-yellow)"
        />
        <circle
          cx={cx + size * 0.28}
          cy={cy + size * 0.05}
          r={dotR}
          fill="var(--c-green)"
        />
        <path
          d={`M ${cx - size * 0.32} ${cy + size * 0.22} Q ${cx} ${cy + size * 0.4}, ${cx + size * 0.32} ${cy + size * 0.22}`}
          stroke="var(--c-text)"
          strokeWidth={size * 0.06}
          fill="none"
          strokeLinecap="round"
        />
      </svg>
      <span
        className="font-display text-base font-semibold tracking-tight"
        style={{ color: "var(--c-text)" }}
      >
        GDG{" "}
        <span className="font-medium" style={{ color: "var(--c-text-muted)" }}>
          Guayaquil
        </span>
      </span>
    </span>
  );
}

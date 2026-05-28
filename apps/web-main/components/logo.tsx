export function Logo({ size = 24 }: { size?: number }) {
  // The new mark is wider than tall (~1.78:1), so `size` drives height
  // and width scales to preserve the aspect ratio.
  const height = size;
  const width = size * (650 / 365);

  return (
    <span className="inline-flex items-center gap-2.5">
      <svg
        width={width}
        height={height}
        viewBox="0 0 650 365"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
      >
        {/* Red — upper bar, sweeps down-left */}
        <path
          transform="matrix(1.3333,0,0,-1.3333,293.3,86.54)"
          d="M0,0c10.993,-15.297 7.505,-36.609 -7.792,-47.602l-72.862,-52.364c-15.296,-10.993 -36.609,-7.504 -47.602,7.792c-10.993,15.297 -7.505,36.609 7.792,47.603L-47.602,7.792C-32.306,18.785 -10.993,15.297 0,0"
          fill="var(--c-red)"
          stroke="var(--c-text)"
          strokeWidth="6"
        />
        {/* Blue — lower-left bar, sweeps down-right */}
        <path
          transform="matrix(1.3333,0,0,-1.3333,122.29,156.38)"
          d="M0,0c-10.993,-15.297 -7.505,-36.609 7.792,-47.602l72.862,-52.364c15.296,-10.993 36.609,-7.504 47.602,7.792c10.993,15.297 7.505,36.609 -7.792,47.603L47.602,7.792C32.306,18.785 10.993,15.297 0,0"
          fill="var(--c-blue)"
          stroke="var(--c-text)"
          strokeWidth="6"
        />
        {/* Yellow — lower-right bar, sweeps down-left */}
        <path
          transform="matrix(1.3333,0,0,-1.3333,528.05,156.38)"
          d="M0,0c10.993,-15.297 7.505,-36.609 -7.792,-47.602l-72.862,-52.364c-15.296,-10.993 -36.609,-7.504 -47.602,7.792c-10.993,15.297 -7.505,36.609 7.792,47.603L-47.602,7.792C-32.306,18.785 -10.993,15.297 0,0"
          fill="var(--c-yellow)"
          stroke="var(--c-text)"
          strokeWidth="6"
        />
        {/* Green — upper bar, sweeps down-right */}
        <path
          transform="matrix(1.3333,0,0,-1.3333,357.04,86.54)"
          d="M0,0c-10.993,-15.297 -7.505,-36.609 7.792,-47.602l72.862,-52.364c15.296,-10.993 36.609,-7.504 47.602,7.792c10.993,15.297 7.505,36.609 -7.792,47.603L47.602,7.792C32.306,18.785 10.993,15.297 0,0"
          fill="var(--c-green)"
          stroke="var(--c-text)"
          strokeWidth="6"
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

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../../lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-2 rounded-full px-2.5 py-1 font-mono text-xs font-medium tracking-wide",
  {
    variants: {
      variant: {
        blue: "bg-[var(--c-blue-soft)] text-[#1b4fa8] dark:text-[var(--c-blue)]",
        green:
          "bg-[var(--c-green-soft)] text-[#1b6f30] dark:text-[var(--c-green)]",
        yellow:
          "bg-[var(--c-yellow-soft)] text-[#8a5d00] dark:text-[var(--c-yellow)]",
        red: "bg-[var(--c-red-soft)] text-[#a8261c] dark:text-[var(--c-red)]",
        neutral: "bg-[var(--c-surface-alt)] text-[var(--c-text-muted)]",
      },
    },
    defaultVariants: { variant: "neutral" },
  },
);

export interface BadgeProps
  extends
    React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };

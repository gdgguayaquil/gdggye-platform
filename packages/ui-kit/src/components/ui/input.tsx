import * as React from "react";

import { cn } from "../../lib/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", ...props }, ref) => {
    return (
      <input
        type={type}
        ref={ref}
        className={cn(
          "flex h-11 w-full min-w-0 rounded-full border border-[var(--c-border)] bg-[var(--c-surface)] px-5 text-sm text-[var(--c-text)]",
          "placeholder:text-[var(--c-text-subtle)]",
          "transition-[border-color,background-color,box-shadow] duration-150",
          "hover:border-[var(--c-border-strong)]",
          "focus-visible:border-transparent focus-visible:bg-[var(--c-bg)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--c-primary)]",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };

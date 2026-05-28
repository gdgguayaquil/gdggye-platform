import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../../lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-medium leading-none transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--c-primary)] disabled:pointer-events-none disabled:opacity-50 border border-transparent",
  {
    variants: {
      variant: {
        primary:
          "bg-[var(--c-text)] text-[var(--c-bg)] hover:-translate-y-px hover:shadow-[var(--shadow-md)]",
        secondary:
          "bg-[var(--c-surface)] text-[var(--c-text)] border-[var(--c-border)] hover:bg-[var(--c-surface-alt)] hover:border-[var(--c-border-strong)]",
        ghost:
          "bg-transparent text-[var(--c-text)] hover:bg-[var(--c-surface)]",
        outline:
          "bg-transparent text-[var(--c-text)] border-[var(--c-border)] hover:border-[var(--c-border-strong)]",
      },
      size: {
        default: "h-10 px-[18px] py-[10px] text-sm",
        sm: "h-9 px-3 text-xs",
        lg: "h-12 px-6 text-[15px]",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, type = "button", ...props }, ref) => {
    return (
      <button
        ref={ref}
        type={type}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };

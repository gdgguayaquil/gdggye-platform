import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../../lib/utils";

const buttonVariants = cva(
  // Inline-flex with items-center handles vertical centering — no leading-none,
  // which can squish text under Tailwind v4. Padding values use the canonical
  // Tailwind scale so they survive purging cleanly. Colors come from the
  // @theme bridge (`--color-text`, `--color-bg`, etc. in globals.css).
  [
    "inline-flex items-center justify-center gap-2",
    "whitespace-nowrap rounded-full font-medium transition-all",
    "border border-transparent",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
    "focus-visible:ring-[var(--c-primary)]",
    "disabled:pointer-events-none disabled:opacity-50",
  ].join(" "),
  {
    variants: {
      variant: {
        primary:
          "bg-text text-bg hover:-translate-y-px hover:shadow-[var(--shadow-md)]",
        secondary:
          "bg-surface text-text border-border hover:bg-surface-alt hover:border-border-strong",
        ghost: "bg-transparent text-text hover:bg-surface",
        outline:
          "bg-transparent text-text border-border hover:border-border-strong",
      },
      size: {
        default: "h-10 px-5 text-sm",
        sm: "h-9 px-3 text-xs",
        lg: "h-12 px-6 text-base",
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
    VariantProps<typeof buttonVariants> {
  /**
   * Render the button's styles onto the single child element instead of a
   * native `<button>`. Use this to style a `<Link>`/`<a>` as a button without
   * nesting a `<button>` inside an `<a>` (invalid HTML). shadcn calls this
   * pattern `asChild`; we implement it dependency-free via `cloneElement`.
   */
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant, size, type = "button", asChild = false, ...props },
    ref,
  ) => {
    const classes = cn(buttonVariants({ variant, size }), className);

    if (asChild) {
      const { children, ...rest } = props;
      if (!React.isValidElement(children)) {
        throw new Error(
          "Button: `asChild` expects a single React element child.",
        );
      }
      const child = children as React.ReactElement<{ className?: string }>;
      return React.cloneElement(child, {
        ...rest,
        ...child.props,
        ref,
        className: cn(classes, child.props.className),
      } as Record<string, unknown>);
    }

    return <button ref={ref} type={type} className={classes} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };

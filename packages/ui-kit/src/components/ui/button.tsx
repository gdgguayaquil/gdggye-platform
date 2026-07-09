import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../../lib/utils";

const buttonVariants = cva(
  // Every color below reads a `--c-*` token injected by the theme engine, so
  // buttons restyle themselves across themes and light/dark with no
  // component-level work. Interaction model: hover shifts a surface, active
  // presses (scale), focus draws a token ring. `transition-all` covers the
  // v4 `translate`/`scale` properties the press/lift states animate.
  [
    "inline-flex select-none items-center justify-center gap-2",
    "whitespace-nowrap rounded-full font-medium",
    "border border-transparent",
    "transition-all duration-150 ease-out",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
    "focus-visible:ring-[var(--c-primary)] focus-visible:ring-offset-[var(--c-bg)]",
    "active:scale-[0.98]",
    "disabled:pointer-events-none disabled:opacity-45",
  ].join(" "),
  {
    variants: {
      variant: {
        primary: [
          "bg-[var(--c-text)] text-[var(--c-bg)]",
          "hover:-translate-y-px hover:shadow-[var(--shadow-md)]",
          "hover:bg-[color-mix(in_srgb,var(--c-text)_88%,var(--c-bg))]",
          "active:translate-y-0 active:shadow-none",
        ].join(" "),
        secondary: [
          "border-[var(--c-border)] bg-[var(--c-surface)] text-[var(--c-text)]",
          "hover:border-[var(--c-border-strong)] hover:bg-[var(--c-surface-alt)]",
        ].join(" "),
        ghost: [
          "bg-transparent text-[var(--c-text-muted)]",
          "hover:bg-[var(--c-surface-alt)] hover:text-[var(--c-text)]",
        ].join(" "),
        outline: [
          "border-[var(--c-border)] bg-transparent text-[var(--c-text)]",
          "hover:border-[var(--c-border-strong)] hover:bg-[var(--c-surface)]",
        ].join(" "),
        // Destructive actions (admin: Detach, Delete). Soft field + deep red
        // text — same recipe as .chip-red, sized up to a control.
        danger: [
          "bg-[var(--c-red-soft)] text-[#a8261c] dark:text-[var(--c-red)]",
          "hover:bg-[color-mix(in_srgb,var(--c-red-soft)_82%,var(--c-red))]",
          "focus-visible:ring-[var(--c-red)]",
        ].join(" "),
      },
      size: {
        sm: "h-8 gap-1.5 px-3.5 text-[13px]",
        default: "h-10 px-5 text-sm",
        lg: "h-12 px-7 text-[15px]",
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

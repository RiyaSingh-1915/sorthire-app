import { cn } from "@/lib/utils";
import { HTMLAttributes } from "react";

export function Badge({
  className,
  variant = "neutral",
  ...props
}: HTMLAttributes<HTMLSpanElement> & {
  variant?: "neutral" | "apply" | "skip" | "signal";
}) {
  const variants = {
    neutral: "bg-current/8 text-current",
    apply: "bg-apply/15 text-apply",
    skip: "bg-skip/15 text-skip",
    signal: "bg-signal/15 text-signal",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}

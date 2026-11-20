
import type { ComponentProps } from "react";
import { cn } from "cn";

type BadgeVariant =
    | "default"
    | "success"
    | "warning"
    | "danger"
    | "outline";

interface BadgeProps extends ComponentProps<"span"> {
    variant?: BadgeVariant;
}

const badgeStyles: Record<BadgeVariant, string> = {
    default: "bg-irent-accent-soft text-irent-primary",
    success: "bg-irent-success-soft text-irent-success",
    warning: "bg-amber-50 text-amber-700",
    danger: "bg-irent-danger-soft text-irent-danger",
    outline: "border border-irent-border bg-irent-surface text-irent-muted",
};

function Badge({
    variant = "default",
    className,
    ...props
}: BadgeProps) {
    return (
        <span
            className={cn(
                "inline-flex items-center rounded-lg px-3 py-1 text-xs font-semibold",
                badgeStyles[variant],
                className
            )}
            {...props}
        />
    );
}

export { Badge };

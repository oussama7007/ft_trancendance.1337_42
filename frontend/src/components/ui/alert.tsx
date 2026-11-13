
import type { ComponentProps } from "react";
import { cn } from "cn";

type AlertVariant = "info" | "success" | "warning" | "danger";

interface AlertProps extends ComponentProps<"div"> {
    variant?: AlertVariant;
}

const alertStyles: Record<AlertVariant, string> = {
    info: "border-sky-200 bg-sky-50 text-sky-800",
    success: "border-emerald-200 bg-emerald-50 text-emerald-800",
    warning: "border-amber-200 bg-amber-50 text-amber-800",
    danger: "border-irent-danger bg-irent-danger-soft text-irent-danger",
};

function Alert({
    variant = "info",
    className,
    ...props
}: AlertProps) {
    return (
        <div
            role={variant === "danger" ? "alert" : "status"}
            className={cn(
                "rounded-xl border p-3 text-sm font-medium",
                alertStyles[variant],
                className
            )}
            {...props}
        />
    );
}

export { Alert };

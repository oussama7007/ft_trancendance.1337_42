
import type { ComponentProps } from "react";
import { cn } from "cn";

function Textarea({
    className,
    ...props
}: ComponentProps<"textarea">) {
    return (
        <textarea
            data-slot="textarea"
            className={cn(
                "w-full min-h-28 rounded-xl border border-irent-border bg-irent-surface p-3 text-sm text-irent-text outline-none placeholder:text-irent-muted focus:border-irent-accent focus:ring-2 focus:ring-irent-accent-soft disabled:opacity-50",
                className
            )}
            {...props}
        />
    );
}

export { Textarea };

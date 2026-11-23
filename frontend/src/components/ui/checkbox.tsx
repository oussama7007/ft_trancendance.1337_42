
import type { ComponentProps } from "react";
import { cn } from "cn";

interface CheckboxProps extends Omit<ComponentProps<"input">, "type"> {
    label: string;
}

function Checkbox({
    label,
    className,
    ...props
}: CheckboxProps) {
    return (
        <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-irent-text">
            <input
                type="checkbox"
                className={cn(
                    "h-4 w-4 accent-irent-accent",
                    className
                )}
                {...props}
            />

            <span>{label}</span>
        </label>
    );
}

export { Checkbox };

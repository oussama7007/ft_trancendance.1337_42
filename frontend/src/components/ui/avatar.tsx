


import { useEffect, useState } from "react";
import { cn } from "cn";

interface AvatarProps {
    src?: string;
    alt: string;
    fallback: string;
    className?: string;
}

function Avatar({
    src,
    alt,
    fallback,
    className,
}: AvatarProps) {
    const [hasError, setHasError] = useState(false);

    useEffect(() => {
        setHasError(false);
    }, [src]);

    return (
        <div
            className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-irent-background font-bold text-irent-primary",
                className
            )}
        >
            {src && !hasError ? (
                <img
                    src={src}
                    alt={alt}
                    onError={() => setHasError(true)}
                    className="h-full w-full object-cover"
                />
            ) : (
                <span role="img" aria-label={alt}>
                    {fallback}
                </span>
            )}
        </div>
    );
}

export { Avatar };

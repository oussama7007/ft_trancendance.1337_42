import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";

interface ProfileSectionProps {
    title: string;
    icon: LucideIcon;
    children: ReactNode;
}

export function ProfileSection({
    title,
    icon: Icon,
    children,
}: ProfileSectionProps) {
    return (
        <Card role="region" aria-label={title}>
            <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-irent-accent-soft text-irent-accent">
                    <Icon size={19} />
                </div>

                <h2 className="text-lg font-bold text-irent-primary">
                    {title}
                </h2>
            </div>

            {children}
        </Card>
    );
}
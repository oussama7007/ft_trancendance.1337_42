import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface AccountSectionProps {
    title: string;
    icon: LucideIcon;
    children: ReactNode;
    action?: ReactNode;
}

export function AccountSection({
    title,
    icon: Icon,
    children,
    action,
}: AccountSectionProps) {
    return (
        <Card role="region" aria-label={title}>
            <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-irent-accent-soft text-irent-accent">
                        <Icon size={19} />
                    </div>

                    <h2 className="text-lg font-bold text-irent-primary">
                        {title}
                    </h2>
                </div>

                {action && (
                    <div className="shrink-0">
                        {action}
                    </div>
                )}
            </div>

            {children}
        </Card>
    );
}

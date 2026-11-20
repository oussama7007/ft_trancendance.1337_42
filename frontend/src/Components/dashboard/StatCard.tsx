import React from 'react';
import { TrendingDown, TrendingUp, type LucideIcon } from 'lucide-react';

interface StatCardProps {
    label: string;
    value: number;
    change: number | null;
    icon: LucideIcon;
    comparisonLabel: string;
}

export const StatCard: React.FC<StatCardProps> = ({
    label,
    value,
    change,
    icon: Icon,
    comparisonLabel,
}) => {
    const isUp = change !== null && change >= 0;
    const TrendIcon = isUp ? TrendingUp : TrendingDown;

    return (
        <div className="rounded-2xl border border-gray-200/65 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-gray-500">{label}</span>
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-(--color-accent-soft) text-(--color-accent)">
                    <Icon size={18} />
                </div>
            </div>

            <p className="mt-3 text-2xl font-black text-gray-900">
                {value.toLocaleString('en-US')}
            </p>

            {change !== null && (
                <p className="mt-2 flex flex-wrap items-center gap-1.5 text-xs font-bold">
                    <span
                        className={`flex items-center gap-1 rounded-full px-2 py-0.5 ${
                            isUp ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'
                        }`}
                    >
                        <TrendIcon size={12} />
                        {isUp ? '+' : ''}
                        {change}%
                    </span>
                    <span className="text-gray-400">{comparisonLabel}</span>
                </p>
            )}
        </div>
    );
};

import React from 'react';
import {
    Area,
    AreaChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import type { Language } from '../../types';
import type { DailyPoint } from '../../types/analytics';

interface ViewsChartProps {
    data: DailyPoint[];
    title: string;
    seriesLabel: string;
    lang: Language;
}

// ar-MA keeps Latin digits, like the rest of the site
const LOCALES: Record<Language, string> = {
    ar: 'ar-MA',
    fr: 'fr-FR',
    en: 'en-GB',
};

const AXIS_TEXT = { fontSize: 11, fill: '#6b7280' };

export const ViewsChart: React.FC<ViewsChartProps> = ({ data, title, seriesLabel, lang }) => {
    const isRTL = lang === 'ar';

    const formatDay = (isoDate: string) =>
        new Date(isoDate).toLocaleDateString(LOCALES[lang], { day: 'numeric', month: 'short' });

    return (
        <div className="rounded-2xl border border-gray-200/65 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-sm font-black text-gray-900">{title}</h2>

            <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                        <XAxis
                            dataKey="date"
                            tickFormatter={formatDay}
                            tick={AXIS_TEXT}
                            tickLine={false}
                            axisLine={false}
                            minTickGap={28}
                            reversed={isRTL}
                        />
                        <YAxis
                            tick={AXIS_TEXT}
                            tickLine={false}
                            axisLine={false}
                            width={40}
                            orientation={isRTL ? 'right' : 'left'}
                        />
                        <Tooltip
                            labelFormatter={(label: unknown) => formatDay(String(label))}
                            formatter={(value: unknown): [string, string] => [String(value), seriesLabel]}
                            contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 12 }}
                        />
                        <Area
                            type="monotone"
                            dataKey="views"
                            stroke="var(--color-accent)"
                            strokeWidth={2.5}
                            fill="var(--color-accent)"
                            fillOpacity={0.15}
                            activeDot={{ r: 5 }}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

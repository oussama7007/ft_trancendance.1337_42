import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Language } from '../types';
import type { AnalyticsData, AnalyticsRange } from '../types/analytics';
import { translations } from '../translations';
import { fetchAnalytics } from '../api/analytics';
import { ApiError } from '../api/apiError';
import { Building2, Eye, MessageCircle } from 'lucide-react';
import { StatCard } from '../Components/dashboard/StatCard';
import { ViewsChart } from '../Components/dashboard/ViewsChart';
import { TopListingsTable } from '../Components/dashboard/TopListingsTable';

const RANGES: AnalyticsRange[] = ['7d', '30d', '90d'];

const CARDS = [
    { key: 'views', icon: Eye },
    { key: 'contacts', icon: MessageCircle },
    { key: 'activeListings', icon: Building2 },
] as const;

const getChange = (current: number, previous: number): number | null =>
    previous === 0 ? null : Math.round(((current - previous) / previous) * 100);

interface DashboardPageProps {
    lang: Language;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ lang }) => {
    const t = translations[lang].dashboardPage;
    const isRTL = lang === 'ar';

    const [range, setRange] = useState<AnalyticsRange>('30d');
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);
    const [isSessionExpired, setIsSessionExpired] = useState(false);
    useEffect(() => {
        const controller = new AbortController();

        async function loadAnalytics() {
            setIsLoading(true);
            setHasError(false);
            setIsSessionExpired(false);

            try {
                const result = await fetchAnalytics(
                    range,
                    controller.signal
                );

                setData(result);
            } catch (error) {
                if (controller.signal.aborted) return;

                // // the sign-in cookie is missing or expired
                if (error instanceof ApiError && error.status === 401) {
                    setIsSessionExpired(true);
                    return;
                }

                console.error(error);
                setHasError(true);
            } finally {
                if (!controller.signal.aborted) {
                    setIsLoading(false);
                }
            }
        }

        loadAnalytics();

        return () => controller.abort();
    }, [range]);

    return (
        <main
            dir={isRTL ? 'rtl' : 'ltr'}
            className="mx-auto min-h-screen w-full max-w-[1600px] px-4 py-8 md:px-8"
        >
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h1 className="text-lg font-black text-gray-900 md:text-xl">{t.title}</h1>

                <div className="flex gap-2">
                    {RANGES.map((item) => (
                        <button
                            key={item}
                            type="button"
                            onClick={() => setRange(item)}
                            className={`cursor-pointer rounded-xl px-4 py-2 text-xs font-bold transition ${
                                range === item
                                    ? 'bg-(--color-accent) text-white'
                                    : 'border border-gray-200 bg-white text-gray-700 hover:bg-(--color-accent-soft) hover:text-(--color-accent)'
                            }`}
                        >
                            {t.ranges[item]}
                        </button>
                    ))}
                </div>
            </div>

            {isLoading ? (
                <p className="py-16 text-center text-sm font-bold text-gray-500">{t.loading}</p>
            ) : isSessionExpired ? (
                <div className="py-16 text-center">
                    <p className="mb-4 text-sm font-bold text-gray-700">{t.sessionExpired}</p>
                    <Link
                        to="/signin"
                        className="inline-block rounded-xl bg-(--color-accent) px-5 py-2.5 text-xs font-bold text-white transition hover:bg-(--color-accent-dark)"
                    >
                        {translations[lang].navbar.signIn}
                    </Link>
                </div>
            ) : hasError || !data ? (
                <p className="py-16 text-center text-sm font-bold text-red-500">{t.loadError}</p>
            ) : (
                <>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                        {CARDS.map(({ key, icon }) => (
                            <StatCard
                                key={key}
                                label={t.kpi[key]}
                                value={data.summary[key]}
                                change={getChange(data.summary[key], data.previous[key])}
                                icon={icon}
                                comparisonLabel={t.vsPrevious}
                            />
                        ))}
                    </div>

                    <div className="mt-6">
                        <ViewsChart
                            data={data.daily}
                            title={t.viewsChartTitle}
                            seriesLabel={t.kpi.views}
                            lang={lang}
                        />
                    </div>

                    <div className="mt-6">
                        <TopListingsTable
                            items={data.topListings}
                            title={t.topListingsTitle}
                            listingLabel={t.listingColumn}
                            cityLabel={t.cityColumn}
                            viewsLabel={t.kpi.views}
                            emptyLabel={t.noData}
                            lang={lang}
                        />
                    </div>
                </>
            )}
        </main>
    );
};

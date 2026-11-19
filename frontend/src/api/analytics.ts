import type { AnalyticsData, AnalyticsRange } from '../types/analytics';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';


const USE_MOCK = true;

const RANGE_DAYS: Record<AnalyticsRange, number> = { '7d': 7, '30d': 30, '90d': 90 };


const buildDaily = (days: number) =>
    Array.from({ length: days }, (_, index) => {
        const date = new Date();
        date.setDate(date.getDate() - (days - 1 - index));
        return {
            date: date.toISOString().slice(0, 10),
            views: 40 + ((index * 37) % 60) + index,
        };
    });


const buildMock = (range: AnalyticsRange): AnalyticsData => {
    const days = RANGE_DAYS[range];

    return {
        summary: { views: days * 82, contacts: days * 6, searches: days * 23, activeListings: 14 },
        previous: { views: days * 73, contacts: days * 5, searches: days * 25, activeListings: 12 },
        daily: buildDaily(days),
        topListings: [
            { id: 1, title: { ar: 'شقة قرب الترامواي', fr: 'Appartement près du tram', en: 'Apartment near the tram' }, city: { ar: 'الرباط', fr: 'Rabat', en: 'Rabat' }, views: 412 },
            { id: 2, title: { ar: 'رياض تقليدي', fr: 'Riad traditionnel', en: 'Traditional riad' }, city: { ar: 'مراكش', fr: 'Marrakech', en: 'Marrakech' }, views: 367 },
            { id: 3, title: { ar: 'استوديو عصري', fr: 'Studio moderne', en: 'Modern studio' }, city: { ar: 'الدار البيضاء', fr: 'Casablanca', en: 'Casablanca' }, views: 290 },
            { id: 4, title: { ar: 'فيلا مع مسبح', fr: 'Villa avec piscine', en: 'Villa with pool' }, city: { ar: 'أكادير', fr: 'Agadir', en: 'Agadir' }, views: 244 },
            { id: 5, title: { ar: 'منزل عائلي', fr: 'Maison familiale', en: 'Family house' }, city: { ar: 'خريبكة', fr: 'Khouribga', en: 'Khouribga' }, views: 198 },
        ],
    };
};

export async function fetchAnalytics(
    range: AnalyticsRange,
    signal?: AbortSignal,
): Promise<AnalyticsData> {
    if (USE_MOCK) {
        return buildMock(range);
    }

    const response = await fetch(`${API_URL}/analytics?range=${range}`, {
        credentials: 'include',
        signal,
    });

    if (!response.ok) {
        throw new Error(`Failed to load analytics (${response.status})`);
    }

    return response.json();
}


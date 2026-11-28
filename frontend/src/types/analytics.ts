import type { Language } from './index';

export type AnalyticsRange = '7d' | '30d' | '90d';

export interface AnalyticsSummary {
    views: number;
    contacts: number;
    activeListings: number;
}

export interface DailyPoint {
    date: string;
    views: number;
}

export interface TopListing {
    id: number;
    title: Record<Language, string>;
    city: Record<Language, string>;
    views: number;
}

export interface AnalyticsData {
    summary: AnalyticsSummary;
    previous: AnalyticsSummary;
    daily: DailyPoint[];
    topListings: TopListing[];
}

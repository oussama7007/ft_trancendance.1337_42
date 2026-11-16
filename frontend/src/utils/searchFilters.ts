import type { PriceRange, PropertyType, SearchFilters } from '../types';

const TYPES: PropertyType[] = ['apartment', 'house', 'studio', 'riad', 'villa'];
const PRICES: PriceRange[] = ['', '0-1500', '1500-3000', '3000+'];


export const SORT_OPTIONS = ['id:DESC', 'price:ASC', 'price:DESC', 'bedrooms:DESC'] as const;
export type SortValue = (typeof SORT_OPTIONS)[number];
export const DEFAULT_SORT: SortValue = 'id:DESC';

export interface ListingsQuery {
    filters: SearchFilters;
    sort: SortValue;
    page: number;
}

export const filtersFromParams = (params: URLSearchParams): SearchFilters => {
    const type = params.get('type') ?? '';
    const priceRange = params.get('priceRange') ?? '';

    return {
        city: params.get('city') ?? '',
        type: TYPES.includes(type as PropertyType) ? (type as PropertyType) : '',
        priceRange: PRICES.includes(priceRange as PriceRange) ? (priceRange as PriceRange) : '',
    };
};

export const filtersToParams = (filters: SearchFilters): URLSearchParams => {
    const params = new URLSearchParams();
    if (filters.city) params.set('city', filters.city);
    if (filters.type) params.set('type', filters.type);
    if (filters.priceRange) params.set('priceRange', filters.priceRange);
    return params;
};

export const sortFromParams = (params: URLSearchParams): SortValue => {
    const sort = params.get('sort') ?? '';
    return SORT_OPTIONS.includes(sort as SortValue) ? (sort as SortValue) : DEFAULT_SORT;
};

export const pageFromParams = (params: URLSearchParams): number => {
    const page = Number(params.get('page'));
    return Number.isInteger(page) && page > 1 ? page : 1;
};

export const queryToParams = ({ filters, sort, page }: ListingsQuery): URLSearchParams => {
    const params = filtersToParams(filters);
    if (sort !== DEFAULT_SORT) params.set('sort', sort);
    if (page > 1) params.set('page', String(page));
    return params;
};
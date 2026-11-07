import type { PriceRange, PropertyType, SearchFilters } from '../types';

const TYPES: PropertyType[] = ['apartment', 'house', 'studio', 'riad', 'villa'];
const PRICES: PriceRange[] = ['', '0-1500', '1500-3000', '3000+'];

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

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { Language, Listing, PriceRange, SearchFilters } from '../types';
import { filtersFromParams, filtersToParams } from '../utils/searchFilters';
import { translations } from '../translations';
import { fetchListings } from '../api/listings';
import { ListingCard } from '../Components/ListingCard';
import { HomeFilterFields } from '../Components/home/HomeFilterFields';
import { PropertyDetailsDrawer } from '../Components/home/PropertyDetailsDrawer';

const PRICE_LIMITS: Record<PriceRange, { minPrice?: number; maxPrice?: number }> = {
    '': {},
    '0-1500': { maxPrice: 1500 },
    '1500-3000': { minPrice: 1501, maxPrice: 3000 },
    '3000+': { minPrice: 3001 },
};

interface ListingsPageProps {
    lang: Language;
}

export const ListingsPage: React.FC<ListingsPageProps> = ({ lang }) => {
    const t = translations[lang].homePage;
    const isRTL = lang === 'ar';

    const [searchParams, setSearchParams] = useSearchParams();
    const { city, type: propertyType, priceRange } = filtersFromParams(searchParams);

    const updateFilters = (changes: Partial<SearchFilters>) => {
        setSearchParams(
            filtersToParams({ city, type: propertyType, priceRange, ...changes }),
            { replace: true },
        );
    };

    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);
    const [activeDetailItem, setActiveDetailItem] = useState<Listing | null>(null);

    const [listings, setListings] = useState<Listing[]>([]);
    useEffect(() => {
        const controller = new AbortController();
        setIsLoading(true);
        setHasError(false);

        const timeoutId = setTimeout(async () => {
            try {
                const data = await fetchListings(
                    { city, type: propertyType, ...PRICE_LIMITS[priceRange] },
                    controller.signal,
                );
                setListings(data);
            } catch (error) {
                if (controller.signal.aborted) return;
                console.error(error);
                setHasError(true);
            } finally {
                if (!controller.signal.aborted) setIsLoading(false);
            }
        }, 300);

        return () => {
            clearTimeout(timeoutId);
            controller.abort();
        };
    }, [city, propertyType, priceRange]);

    return (
        <main
            dir={isRTL ? 'rtl' : 'ltr'}
            className="w-full max-w-[1600px] mx-auto px-4 md:px-8 py-8 min-h-screen"
        >
            <h1 className="text-lg md:text-xl font-black text-gray-900 mb-6">
                {t.tabList}
            </h1>
            <div className="bg-white p-3.5 rounded-2xl shadow-xl flex flex-col md:flex-row items-center gap-3 border border-gray-200/65 relative mb-8">
                <HomeFilterFields
                    city={city}
                    onCityChange={(value) => updateFilters({ city: value })}
                    propertyType={propertyType}
                    onPropertyTypeChange={(value) => updateFilters({ type: value })}
                    priceRange={priceRange}
                    onPriceRangeChange={(value) => updateFilters({ priceRange: value })}
                    labels={t}
                />
            </div>

            {isLoading ? (
                <p className="text-center text-sm font-bold text-gray-500 py-16">
                    {t.loading}
                </p>
            ) : hasError ? (
                <p className="text-center text-sm font-bold text-red-500 py-16">
                    {t.loadError}
                </p>
            ) : listings.length === 0 ? (
                <p className="text-center text-sm font-bold text-gray-500 py-16">
                    {t.noRentals}
                </p>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {listings.map((item) => (
                        <ListingCard
                            key={item.id}
                            item={item}
                            lang={lang}
                            availableLabel={t.available}
                            detailsLabel={t.details}
                            onSelect={setActiveDetailItem}

                        />
                    ))}
                </div>
            )}

            <PropertyDetailsDrawer
                item={activeDetailItem}
                lang={lang}
                title={t.detailsTitle}
                contactLabel={t.contactBtn}
                locationLabel={t.location}
                priceLabel={t.price}
                perMonthLabel={t.perMonth}
                closeLabel={t.close}
                onClose={() => setActiveDetailItem(null)}
                onContact={(listing) => {
                    console.log('Contact:', listing);
                    setActiveDetailItem(null);
                }}
            />

        </main>
    );
};

import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import type { Language, Listing, PriceRange, SearchFilters } from '../types';
import { filtersFromParams,pageFromParams, queryToParams, sortFromParams, SORT_OPTIONS,  type SortValue,} from '../utils/searchFilters';
import { translations } from '../translations';
import { fetchListings, type PaginationMeta, type SortBy, type SortOrder, } from '../api/listings';
import { ListingCard } from '../Components/ListingCard';
import { HomeFilterFields } from '../Components/home/HomeFilterFields';
import { PropertyDetailsDrawer } from '../Components/home/PropertyDetailsDrawer';

import { ArrowDownWideNarrow, Check, ChevronDown, ChevronLeft, ChevronRight} from 'lucide-react';


const LIMIT = 12;
const getPageNumbers = (totalPages: number): number[] => {
    return Array.from(
        { length: totalPages },
        (_, index) => index + 1
    );
};

const PRICE_LIMITS: Record<PriceRange, { minPrice?: number; maxPrice?: number }> = {
    '': {},
    '0-1500': { maxPrice: 1500 },
    '1500-3000': { minPrice: 1501, maxPrice: 3000 },
    '3000+': { minPrice: 3001 },
};

interface ListingsPageProps {
    lang: Language;
    currentUserId?: number;
}

export const ListingsPage: React.FC<ListingsPageProps> = ({ lang, currentUserId }) => {
    const navigate = useNavigate();
    const t = translations[lang].homePage;

    const SORT_LABELS: Record<SortValue, string> = {
        'id:DESC': t.sorting.newest,
        'price:ASC': t.sorting.priceLowToHigh,
        'price:DESC': t.sorting.priceHighToLow,
        'bedrooms:DESC': t.sorting.mostBedrooms,
    };

    const isRTL = lang === 'ar';

    const [searchParams, setSearchParams] = useSearchParams();
    const { city, type: propertyType, priceRange } = filtersFromParams(searchParams);
    const sortValue = sortFromParams(searchParams);
    const page = pageFromParams(searchParams);
    const [sortBy, sortOrder] = sortValue.split(':') as [SortBy, SortOrder];

    const current: SearchFilters = { city, type: propertyType, priceRange };

    const apply = (filters: SearchFilters, sort: SortValue, p: number) =>
        setSearchParams(queryToParams({ filters, sort, page: p }), { replace: true });


    const updateFilters = (changes: Partial<SearchFilters>) => {
        apply({ ...current, ...changes }, sortValue, 1);
    };

    const updateSort = (value: SortValue) => apply(current, value, 1);
    const goToPage = (p: number) => {
        apply(current, sortValue, p);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);
    const [activeDetailItem, setActiveDetailItem] = useState<Listing | null>(null);

    const [listings, setListings] = useState<Listing[]>([]);
    const [meta, setMeta] = useState<PaginationMeta | null>(null);
    const [isSortOpen, setIsSortOpen] = useState(false);
  

    useEffect(() => {
        const controller = new AbortController();
        setIsLoading(true);
        setHasError(false);

        const timeoutId = setTimeout(async () => {
            try {
                const {data, meta} = await fetchListings(
                    { city, type: propertyType, ...PRICE_LIMITS[priceRange] , sortBy, sortOrder, page, limit:LIMIT},
                    controller.signal,
                );
                setListings(data);
                setMeta(meta);
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
    }, [city, propertyType, priceRange,sortBy, sortOrder, page]);

    const handleContactListing = (_listing: Listing, conversationId?: number) => {
        setActiveDetailItem(null);
        navigate(conversationId ? `/chat?conversationId=${conversationId}` : '/chat');
    };

    return (
        <main
            dir={isRTL ? 'rtl' : 'ltr'}
            className="w-full max-w-[1600px] mx-auto px-4 md:px-8 py-8 min-h-screen"
        >
            <h1 className="text-lg md:text-xl font-black text-gray-900 mb-6">
                {t.tabList}
            </h1>
            <div className="bg-white p-3.5 rounded-2xl shadow-xl flex flex-col md:flex-row items-stretch md:items-center gap-3 border border-gray-200/65 relative mb-8">
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
        
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">

                {/* Results count */}
                <p className="text-xs font-bold text-gray-500">
                    {meta ? `${meta.total}` : ''}
                </p>

                {/* Sorting dropdown */}
                <div className="relative">

                    {/* Dropdown trigger */}
                    <button
                        type="button"
                        onClick={() => setIsSortOpen((prev) => !prev)}
                        className="flex w-full sm:w-auto justify-between gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-xs font-bold text-gray-700 hover:bg-(--color-accent-soft) hover:text-(--color-accent) transition cursor-pointer"
                    >
                        <ArrowDownWideNarrow className="w-4 h-4" />

                        {SORT_LABELS[sortValue]}

                        <ChevronDown
                            className={`w-4 h-4 transition-transform ${
                                isSortOpen ? 'rotate-180' : ''
                            }`}
                        />
                    </button>

                    {/* Dropdown menu */}
                    {isSortOpen && (
                        <div className="absolute top-full end-0 mt-2 w-56 max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50">
                            {SORT_OPTIONS.map((value) => (
                                <button
                                    type="button"
                                    key={value}
                                    onClick={() => {
                                        updateSort(value);
                                        setIsSortOpen(false);
                                    }}
                                    className="w-full px-4 py-2.5 text-xs font-bold text-gray-700 hover:bg-(--color-accent-soft) hover:text-(--color-accent) cursor-pointer transition border-t border-gray-50 flex items-center justify-between text-start"
                                >
                                    {SORT_LABELS[value]}

                                    {sortValue === value && (
                                        <Check className="w-4 h-4 text-(--color-accent)" />
                                    )}
                                </button>
                            ))}

                        </div>
                    )}

                </div>
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
                            isMine={item.ownerId === currentUserId}
                        />
                    ))}
                </div>
            )}
            {meta && meta.totalPage > 1 && (
                <div className="flex flex-wrap justify-center items-center gap-1.5 sm:gap-2 mt-8 px-1">

                    {/* Previous button */}
                    <button
                        type="button"
                        onClick={() => goToPage(page - 1)}
                        disabled={page === 1}
                        className="p-2 rounded-xl border border-gray-200 bg-white text-gray-700 hover:bg-(--color-accent-soft) hover:text-(--color-accent) disabled:opacity-40 disabled:cursor-not-allowed transition"
                    >
                        {isRTL ? (
                            <ChevronRight className="w-4 h-4" />
                        ) : (
                            <ChevronLeft className="w-4 h-4" />
                        )}
                    </button>

                    {/* Page numbers */}
                    {getPageNumbers(meta.totalPage).map((pageNumber) => (
                        <button
                            key={pageNumber}
                            type="button"
                            onClick={() => goToPage(pageNumber)}
                            className={`w-9 h-9 rounded-xl text-xs font-bold transition ${
                                page === pageNumber
                                    ? 'bg-(--color-accent) text-white'
                                    : 'border border-gray-200 bg-white text-gray-700 hover:bg-(--color-accent-soft) hover:text-(--color-accent)'
                            }`}
                        >
                            {pageNumber}
                        </button>
                    ))}

                    {/* Next button */}
                    <button
                        type="button"
                        onClick={() => goToPage(page + 1)}
                        disabled={page === meta.totalPage}
                        className="p-2 rounded-xl border border-gray-200 bg-white text-gray-700 hover:bg-(--color-accent-soft) hover:text-(--color-accent) disabled:opacity-40 disabled:cursor-not-allowed transition"
                    >
                        {isRTL ? (
                            <ChevronLeft className="w-4 h-4" />
                        ) : (
                            <ChevronRight className="w-4 h-4" />
                        )}
                    </button>

                </div>
            )}

            <PropertyDetailsDrawer
                item={activeDetailItem}
                lang={lang}
                title={t.detailsTitle}
                contactLabel={t.contactBtn}
                locationLabel={t.location}
                ownerLabel={t.owner}
                currentUserId={currentUserId}
                yourListingLabel={t.yourListing}
                priceLabel={t.price}
                perMonthLabel={t.perMonth}
                closeLabel={t.close}
                onClose={() => setActiveDetailItem(null)}
                onContact={handleContactListing}
            />

        </main>
    );
};

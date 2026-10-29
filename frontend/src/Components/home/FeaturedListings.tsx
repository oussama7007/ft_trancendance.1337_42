import { ListingCard } from "../ListingCard";

import type { Language, Listing } from "../../types";
import type React from "react";

interface FeaturedListingsProps {
    listings: Listing[];
    lang: Language;
    featuredLabel: string;
    availableLabel: string;
    detailsLabel: string;
    onSelect: (item: Listing) => void;
}

export const FeaturedListing: React.FC<FeaturedListingsProps> = ({
    listings,
    lang,
    featuredLabel,
    availableLabel,
    detailsLabel,
    onSelect,
}) => {
    const featuredListings = listings.slice(0, 3);

    if (featuredListings.length === 0) {
        return null;
    }

    return (
        <section className="w-full max-w-[1600px] mx-auto mb-16">

            {/* Title */}
            <div className="flex justify-between items-center mb-6 px-2 mt-3">
                <h2 className="text-sm md:text-base font-black text-gray-900 tracking-tight flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-(--color-accent)" />
                    {featuredLabel}
                </h2>
            </div>

            {/* Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">

                {featuredListings.map((item) => (

                    <ListingCard
                        key={item.id}
                        item={item}
                        lang={lang}
                        availableLabel={availableLabel}
                        detailsLabel={detailsLabel}
                        onSelect={onSelect}
                    />

                ))}

            </div>

        </section>
    );
};
import { MapPin, ArrowRight, BedDouble, User } from "lucide-react";
import type React from "react";
import type { Language, Listing } from "../types";
import { translations } from '../translations';
import { ImageSlider, getListingImages } from './ImageSlider';

interface ListingCardProps {
    item: Listing;
    lang: Language;
    availableLabel: string;
    detailsLabel: string;
    onSelect: (item: Listing) => void;
    isMine?: boolean;
}

export const ListingCard: React.FC<ListingCardProps> = ({
    item,
    lang,
    availableLabel,
    detailsLabel,
    onSelect,
    isMine = false,
}) => {
    return (
        <article
            onClick={() => onSelect(item)}
            className={`bg-white rounded-3xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 cursor-pointer flex flex-col group ${
                isMine ? 'border-2 border-(--color-accent) ring-4 ring-(--color-accent-soft)' : 'border border-gray-100'
            }`}
        >
            {/* Image slider */}
            <div className="h-56 overflow-hidden relative bg-gray-100">
                <ImageSlider
                    images={getListingImages(item)}
                    alt={item.title[lang]}
                    previousLabel={translations[lang].homePage.previousImage}
                    nextLabel={translations[lang].homePage.nextImage}
                    imageClassName="group-hover:scale-105 transition duration-500"
                    fallback={
                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                            <MapPin className="w-10 h-10 text-amber-600" />
                        </div>
                    }
                />

                {/* Your listing */}
                {isMine && (
                    <span className="absolute top-3 start-3 flex items-center gap-1 bg-(--color-accent) text-white font-black text-[10px] px-2.5 py-1.5 rounded-xl shadow-md">
                        <User className="w-3 h-3" />
                        {translations[lang].homePage.yourListing}
                    </span>
                )}

                {/* Price */}
                <span className="absolute top-3 end-3 bg-white/90 backdrop-blur-md text-(--color-accent) font-black text-xs px-3 py-1.5 rounded-xl shadow-md">
                    {item.price} {translations[lang].homePage.currency}
                </span>
            </div>

            {/* Content */}
            <div className="p-5 flex flex-col justify-between flex-1">
                <div>
                    <h3 className="text-xs md:text-sm font-black text-gray-900 mb-1 break-words line-clamp-2">
                        {item.title[lang]}
                    </h3>

                    <p className="text-[11px] text-gray-500 font-bold mb-3 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-red-500" />
                        {item.city[lang]}
                    </p>
                    <p className="text-[11px] text-gray-500 font-bold mb-3 flex items-center gap-1">
                        <BedDouble className="w-3.5 h-3.5 text-(--color-accent)" />
                        {item.bedrooms} {translations[lang].homePage.bedrooms}
                    </p>
                </div>

                {/* Bottom */}
                <div className="pt-3 border-t border-gray-100 flex justify-between items-center">
                    <span className="text-[10px] font-black text-(--color-success) bg-(--color-success-soft) px-2.5 py-1 rounded-lg">
                        {availableLabel}
                    </span>

                    <span className="text-[10px] font-black text-(--color-accent) group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition flex items-center gap-1">
                        {detailsLabel}
                        <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
                    </span>
                </div>
            </div>
        </article>
    );
};

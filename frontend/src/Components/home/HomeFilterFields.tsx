import React, { useState } from 'react';
import { Building2, House, Sofa, Landmark, Castle, MapPin, ChevronDown, Wallet } from 'lucide-react';
import type { PriceRange, PropertyType } from '../../types';

type PropertyFilter = PropertyType | '';

export interface HomeFilterLabels {
    locationPlaceholder: string;

    propType: string;
    apt: string;
    house: string;
    studio: string;
    riad: string;
    villa: string;

    priceRange: string;
    priceAny: string;
    price0To1500: string;
    price1500To3000: string;
    price3000Plus: string;
}

interface HomeFilterFieldsProps {
    city: string;
    onCityChange: (value: string) => void;

    propertyType: PropertyFilter;
    onPropertyTypeChange: (value: PropertyFilter) => void;

    priceRange: PriceRange;
    onPriceRangeChange: (value: PriceRange) => void;

    labels: HomeFilterLabels;
}

const propertyOptions = [
    { value: 'apartment' as const, icon: Building2, labelKey: 'apt' as const, color: 'text-sky-500' },
    { value: 'house' as const, icon: House, labelKey: 'house' as const, color: 'text-emerald-500' },
    { value: 'studio' as const, icon: Sofa, labelKey: 'studio' as const, color: 'text-violet-500' },
    { value: 'riad' as const, icon: Landmark, labelKey: 'riad' as const, color: 'text-amber-600' },
    { value: 'villa' as const, icon: Castle, labelKey: 'villa' as const, color: 'text-rose-500' },
];

const priceOptions = [
    { value: '' as const, labelKey: 'priceAny' as const },
    { value: '0-1500' as const, labelKey: 'price0To1500' as const },
    { value: '1500-3000' as const, labelKey: 'price1500To3000' as const },
    { value: '3000+' as const, labelKey: 'price3000Plus' as const },
];

export const HomeFilterFields: React.FC<HomeFilterFieldsProps> = ({
    city,
    onCityChange,
    propertyType,
    onPropertyTypeChange,
    priceRange,
    onPriceRangeChange,
    labels,
}) => {
    const [isPropTypeOpen, setIsPropTypeOpen] = useState(false);
    const [isPriceOpen, setIsPriceOpen] = useState(false);

    const selectedProperty = propertyOptions.find((option) => option.value === propertyType);
    const selectedPrice = priceOptions.find((option) => option.value === priceRange);
    const SelectedPropertyIcon = selectedProperty?.icon;

    const closeMenus = () => {
        setIsPropTypeOpen(false);
        setIsPriceOpen(false);
    };

    return (
        <>
            {/*Location*/}
            <div className="flex-1 w-full bg-gray-50 hover:bg-gray-100/80 transition-all duration-300 hover:scale-[1.02] hover:shadow-md px-4 py-3 rounded-xl border-gray-200/60 flex items-center gap-2 ">
                <MapPin className="w-4 h-4 text-rose-500 shrink-0" />
                <input
                    type="text"
                    value={city}
                    onChange={(event) => onCityChange(event.target.value)}
                    placeholder={labels.locationPlaceholder}
                    className="w-full bg-transparent outline-none text-xs font-bold text-gray-800 placeholder:text-gray-400"
                />
            </div>

            {/*Property type*/}
            <div className="flex-1 w-full relative">
                <button
                    type="button"
                    onClick={() => {
                        setIsPropTypeOpen((prev) => !prev);
                        setIsPriceOpen(false);
                    }}
                    className="w-full bg-gray-50 hover:bg-gray-100/80 transition-all duration-300 hover:scale-[1.02] hover:shadow-md px-4 py-3 rounded-xl border border-gray-200/60 flex items-center justify-between cursor-pointer select-none"
                >
                    <div className="flex items-center gap-2">
                        {SelectedPropertyIcon && (
                            <SelectedPropertyIcon className={`w-4 h-4 ${selectedProperty?.color}`} />
                        )}
                        <span className="text-xs font-bold text-gray-700">
                            {selectedProperty ? labels[selectedProperty.labelKey] : labels.propType}
                        </span>
                    </div>
                    <ChevronDown
                        className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-300 ${
                            isPropTypeOpen ? 'rotate-180' : ''
                        }`}
                    />
                </button>
                {isPropTypeOpen && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50">
                        {propertyOptions.map((option) => {
                            const Icon = option.icon;
                            return (
                                <button
                                    type="button"
                                    key={option.value}
                                    onClick={() => {
                                        onPropertyTypeChange(option.value);
                                        closeMenus();
                                    }}
                                    className="w-full px-4 py-2.5 text-xs font-bold text-gray-700 hover:bg-(--color-accent-soft) hover:text-(--color-accent) cursor-pointer transition border-t border-gray-50 flex items-center gap-2 text-left"
                                >
                                    <Icon className={`w-4 h-4 ${option.color}`} />
                                    {labels[option.labelKey]}
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>

            {/*Price*/}
            <div className="w-full md:w-[180px] relative">
                <button
                    type="button"
                    onClick={() => {
                        setIsPriceOpen((prev) => !prev);
                        setIsPropTypeOpen(false);
                    }}
                    className="w-full bg-gray-50 hover:bg-gray-100/80 transition-all duration-300 hover:scale-[1.02] hover:shadow-md px-4 py-3 rounded-xl border border-gray-200/60 flex items-center justify-between cursor-pointer select-none"
                >
                    <div className="flex items-center gap-2 overflow-hidden">
                        <Wallet className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span className="text-xs font-bold text-gray-700 truncate">
                            {selectedPrice && selectedPrice.labelKey !== 'priceAny'
                                ? labels[selectedPrice.labelKey]
                                : labels.priceRange}
                        </span>
                    </div>
                    <ChevronDown
                        className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-300 shrink-0 ${
                            isPriceOpen ? 'rotate-180' : ''
                        }`}
                    />
                </button>
                {isPriceOpen && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50">
                        {priceOptions.map((option, index) => (
                            <button
                                type="button"
                                key={option.value || 'any-price'}
                                onClick={() => {
                                    onPriceRangeChange(option.value);
                                    closeMenus();
                                }}
                                className={`w-full px-4 py-2.5 text-xs font-bold cursor-pointer transition text-left ${
                                    index > 0 ? 'border-t border-gray-50' : ''
                                } ${
                                    option.value === priceRange
                                        ? 'bg-(--color-accent-soft) text-(--color-accent)'
                                        : 'text-gray-700 hover:bg-(--color-accent-soft) hover:text-(--color-accent)'
                                }`}
                            >
                                {labels[option.labelKey]}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
};

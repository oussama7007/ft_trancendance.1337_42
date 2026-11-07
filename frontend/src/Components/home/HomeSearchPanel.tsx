import React, { useState } from "react";
import {Search, User, Mars, Venus,Globe2, MapPin, ChevronDown, Wallet} from 'lucide-react';
import { SearchTabs } from "./SearchTabs";
import { HomeFilterFields } from "./HomeFilterFields";




type HomeTab = 'home' | 'roommate' | 'list';
type PropertyType = 'apartment' | 'house' | 'studio' | 'riad' | 'villa' |'';
type PriceRange = '' | '0-1500' | '1500-3000' | '3000+';
type GenderPreference = '' | 'any' | 'male' | 'female';

interface HomeLabels {
    tabHome: string;
    tabRoommate: string;
    tabList: string;
    tabAddListing: string;

    locationPlaceholder: string;
    roommateLocationPlaceholder: string;

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

    budgetPlaceholder: string;

    genderPref: string;
    any: string;
    male: string;
    female: string;

    searchBtn: string;
}

interface HomeSearchPanelProps {
    activeTab: HomeTab;
    onTabChange: (tab: HomeTab) => void;

    isLoggedIn: boolean;
    onNavigate: (page: string) => void;

    searchQuery: string;
    onSearchQueryChange: (value: string) => void;

    propertyType: PropertyType;
    onPropertyTypeChange: (value: PropertyType) => void;

    priceRange: PriceRange;
    onPriceRangeChange: (value: PriceRange) => void;

    roommateLocation: string;
    onRoommateLocationChange: (value: string) => void;

    budget: string;
    onBudgetChange: (value: string) => void;

    roommateGender: GenderPreference;
    onRoommateGenderChange: (value: GenderPreference) => void;

    onSearch: () => void;
    roommateChoice: React.ReactNode;
    showRoommateSearch: boolean;

    labels: HomeLabels;
}


const genderOptions = [
  {
    value: '' as const,
    labelKey: 'genderPref' as const,
    icon: User,
    color: 'text-gray-400'
  },
  {
    value: 'any' as const,
    labelKey: 'any' as const,
    icon: Globe2,
    color: 'text-sky-500'
  },
  {
    value: 'male' as const,
    labelKey: 'male' as const,
    icon: Mars,
    color: 'text-blue-500'
  },
  {
    value: 'female' as const,
    labelKey: 'female' as const,
    icon: Venus,
    color: 'text-pink-500'
  },
];

export const HomeSearchPanel: React.FC<HomeSearchPanelProps> = ({
    activeTab,
    onTabChange,
    isLoggedIn,
    onNavigate,

    searchQuery,
    onSearchQueryChange,

    propertyType,
    onPropertyTypeChange,

    priceRange,
    onPriceRangeChange,

    roommateLocation,
    onRoommateLocationChange,

    budget,
    onBudgetChange,

    roommateGender,
    onRoommateGenderChange,

    onSearch,
    roommateChoice,
    showRoommateSearch,
    labels,

}) => {
    const [isGenderOpen, setIsGenderOpen] = useState(false);

    const selectedGender = genderOptions.find((option) => option.value === roommateGender);

    const closeOtherMenus = () => {
        setIsGenderOpen(false);
    };

    const SelectedGenderIcon = selectedGender?.icon;

    return (
        <div>
            <SearchTabs 
                activeTab={activeTab} onChange={onTabChange} isLoggedIn={isLoggedIn} onNavigate={onNavigate}
                labels={{
                    home : labels.tabHome,
                    roommate: labels.tabRoommate,
                    list: labels.tabAddListing,
                }}
            />

            {activeTab === 'roommate' && roommateChoice}

            {(activeTab !== 'roommate' || showRoommateSearch) && (
            <div className="bg-white p-3.5 rounded-2xl shadow-xl flex flex-col md:flex-row items-center gap-3 border border-gray-200/65 relative">
            {/*=========================home Search*/}
                {activeTab === 'home' && (
                <>
                    <HomeFilterFields
                        city={searchQuery}
                        onCityChange={onSearchQueryChange}
                        propertyType={propertyType}
                        onPropertyTypeChange={onPropertyTypeChange}
                        priceRange={priceRange}
                        onPriceRangeChange={onPriceRangeChange}
                        labels={labels}
                    />
                        </>
                )}
                {/*=======================Roommate search*/}
                {activeTab === 'roommate' && (
                <>
                    {/*location*/}
                    <div className="flex-1 w-full bg-gray-50 hover:bg-gray-100/80 transition-all duration-300 hover:scale-[1.02] hover:shadow-md px-4 py-3 rounded-xl border border-gray-200/60 flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-rose-500 shrink-0"/>
                        <input type="text" value={roommateLocation} onChange={(event) => onRoommateLocationChange(event.target.value)} 
                            placeholder={labels.roommateLocationPlaceholder} className="w-full bg-transparent outline-none text-xs font-bold text-gray-800 placeholder:text-gray-400"
                        />
                    </div>
                    {/*Budget*/}
                    <div className="flex-1 w-full bg-gray-50 hover:bg-gray-100/80 transition-all duration-300 hover:scale-[1.02] hover:shadow-md px-4 py-3 rounded-xl border border-gray-200/60 flex items-center gap-2">
                        <Wallet className="w-4 h-4 text-emerald-500 shrink-0"/>
                        <input type="text" value={budget} onChange={(event) => onBudgetChange(event.target.value)}
                        placeholder={labels.budgetPlaceholder}
                        className="w-full bg-transparent outline-none text-xs font-bold text-gray-800 placeholder:text-gray-400"
                        />
                    </div>
                    {/*Gender*/}
                    <div className="w-full md:w-[180px] relative">
                        <button type="button" onClick={()=>{
                            setIsGenderOpen((prev)=> !prev);
                        }}
                            className="w-full bg-gray-50 hover:bg-gray-100/80 transition-all duration-300 hover:scale-[1.02] hover:shadow-md px-4 py-3 rounded-xl border border-gray-200/60 flex items-center justify-between cursor-pointer select-none"
                        >
                            <div className="flex items-center gap-2">
                                {SelectedGenderIcon && (<SelectedGenderIcon className={`w-4 h-4 ${selectedGender?.color}`}/>)}
                                <span className="text-xs font-bold text-gray-700 truncate">
                                    {selectedGender ? labels[selectedGender.labelKey] : labels.genderPref}
                                </span>
                            </div>
                            <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-300 
                                ${isGenderOpen ? 'rotate-180' : ''}
                            
                            `}/>
                        </button>
                        {isGenderOpen && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl border border-gray-100 overflow-hidden z-50">
                                {genderOptions.map((option) => {
                                    const Icon = option.icon;
                                    return(
                                        <button type="button" key={option.value || 'gender-default'}
                                            onClick={() => {
                                                onRoommateGenderChange(option.value);
                                                closeOtherMenus();
                                            }}
                                            className={`w-full py-2.5 text-xs font-bold cursor-pointer transition flex items-center gap-2 text-start 
                                                ${option.value === roommateGender 
                                                    ? 'bg-(--color-accent-soft) text-(--color-accent)' 
                                                    : 'text-gray-700 hover:bg-(--color-accent-soft) hover:text-(--color-accent)'
                                                }
                                                `}
                                        >
                                            <Icon className={`w-4 h-4 ${option.color}`}/>
                                            {labels[option.labelKey]}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </>
                )}
                {/*search button*/}
                <button type="button" onClick={onSearch} className="w-full flex flex-[0.3] md:w-auto bg-(--color-accent) text-white px-7 py-3 rounded-xl font-black text-xs hover:bg-(--color-accent-dark) transition cursor-pointer shadow-md justify-center gap-2 shrink-0">
                        <Search className="w-4 h-4"/>
                        {labels.searchBtn}
                        
                </button>
            </div>
            )}
        </div>
    );
};
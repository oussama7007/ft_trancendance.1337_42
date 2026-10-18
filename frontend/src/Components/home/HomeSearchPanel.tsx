import React, { useState } from "react";
import {Search, Building2, House, Sofa, Landmark, User, Mars, Venus,Globe2, MapPin, ChevronDown, Wallet} from 'lucide-react';
import { SearchTabs } from "./SearchTabs";




type HomeTab = 'home' | 'roommate' | 'list';
type PropertyType = 'apartment' | 'house' | 'studio' | 'riad' | 'villa' |'';
type PriceRange = '' | '0-1500' | '1500-3000' | '3000+';
type GenderPreference = '' | 'any' | 'male' | 'female';

interface HomeLabels {
    tabHome: string;
    tabRoommate: string;
    tabList: string;

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

    labels: HomeLabels;
}


const propertyOptions = [
    {
        value: 'apartment' as const,
        icon: Building2,
        labelKey: 'apt' as const,
    },
    {
        value: 'house' as const,
        icon: Building2,
        labelKey: 'house' as const,
    },
    {
        value: 'studio' as const,
        icon: Sofa,
        labelKey: 'studio' as const,
  },
  {
        value: 'riad' as const,
        icon: Landmark,
        labelKey: 'riad' as const,
  },
  {
        value: 'villa' as const,
        icon : House,
        labelKey: 'villa' as const,
    }
];

const priceOptions = [
  {
    value: '' as const,
    labelKey: 'priceAny' as const,
  },
  {
    value: '0-1500' as const,
    labelKey: 'price0To1500' as const,
  },
  {
    value: '1500-3000' as const,
    labelKey: 'price1500To3000' as const,
  },
  {
    value: '3000+' as const,
    labelKey: 'price3000Plus' as const,
  },
];
const genderOptions = [
  {
    value: '' as const,
    labelKey: 'genderPref' as const,
    icon: User,
  },
  {
    value: 'any' as const,
    labelKey: 'any' as const,
    icon: Globe2,
  },
  {
    value: 'male' as const,
    labelKey: 'male' as const,
    icon: Mars,
  },
  {
    value: 'female' as const,
    labelKey: 'female' as const,
    icon: Venus,
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
    labels,

}) => {
    const [isPropTypeOpen, setIsPropTypeOpen] = useState(false);
    const [isPriceOpen, setIsPriceOpen] = useState(false);
    const [isGenderOpen, setIsGenderOpen] = useState(false);

    const selectedProperty = propertyOptions.find((option) => option.value === propertyType);

    const selectedPrice = priceOptions.find((option) => option.value === priceRange);

    const selectedGender = genderOptions.find((option) => option.value === roommateGender);

    const closeOtherMenus = () => {
        setIsPropTypeOpen(false);
        setIsPriceOpen(false);
        setIsGenderOpen(false);
    };

    const SelectedPropertyIcon = selectedProperty?.icon;
    const SelectedGenderIcon = selectedGender?.icon;

    return (
        <div>
            <SearchTabs 
                activeTab={activeTab} onChange={onTabChange} isLoggedIn={isLoggedIn} onNavigate={onNavigate}
                labels={{
                    home : labels.tabHome,
                    roommate: labels.tabRoommate,
                    list: labels.tabList,
                }}
            />

            <div className="bg-white p-3.5 rounded-2xl shadow-xl flex flex-col md:flex-row items-center gap-3 border border-gray-200/65 relative">
            {/*=========================home Search*/}
                {activeTab === 'home' && (
                <>
                    {/*Location*/}
                    <div className="flex-1 w-full bg-gray-50 hover:bg-gray-100/80 transition-all duration-300 hover:scale-[1.02] hover:shadow-md px-4 py-3 rounded-xl border-gray-200/60 flex items-center gap-2 ">
                        <MapPin className="w-4 h-4 text-gray-400 shrink-0"/>
                        <input type="text" value={searchQuery} onChange={(event) => onSearchQueryChange(event.target.value)} 
                        placeholder={labels.locationPlaceholder}
                        className="w-full bg-transparent outline-none text-xs font-bold text-gray-800 placeholder:text-gray-400"
                        />
                    </div>
                    {/*Property type*/}
                    <div className="flex-1 w-full relative">
                        <button type="button" 
                            onClick={() =>{
                                setIsPropTypeOpen((prev) => !prev);
                                setIsPriceOpen(false);
                                setIsGenderOpen(false)
                            }}
                            className="w-full bg-gray-50 hover:bg-gray-100/80 transition-all duration-300 hover:scale-[1.02] hover:shadow-md px-4 py-3 rounded-xl border border-gray-200/60 flex items-center justify-between cursor-pointer select-none"
                        >
                                <div className="flex items-center gap-2">
                                    {SelectedPropertyIcon && (<SelectedPropertyIcon className="w-4 h-4 text-gray-400" />)}
                                    <span className="text-xs font-bold text-gray-700">
                                        {selectedProperty ? labels[selectedProperty.labelKey] : labels.propType}
                                    </span>
                                </div>
                                    <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-300
                                        ${isPropTypeOpen ? 'rotate-180' : ''}`}/>
                        </button>
                        {isPropTypeOpen && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50">
                                {propertyOptions.map((option) => {
                                    const Icon = option.icon;
                                    return(
                                        <button type="button" key={option.value} onClick={()=> {
                                            onPropertyTypeChange(option.value);
                                            closeOtherMenus();
                                        }}
                                            className="w-full px-4 py-2.5 text-xs font-bold text-gray-700 hover:bg-(--color-accent-soft) hover:text-(--color-accent) cursor-pointer transition border-t border-gray-50 flex items-center gap-2 text-left">
                                                <Icon className="w-4 h-4 text-gray-400"/>
                                                {labels[option.labelKey]}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                    {/*Price*/}
                    <div className="w-full md:w-[180px] relative">
                        <button type="button" onClick={()=>{
                            setIsPriceOpen((prev) => !prev);
                            setIsPropTypeOpen(false);
                            setIsGenderOpen(false);
                        }}
                            className="w-full bg-gray-50 hover:bg-gray-100/80 transition-all duration-300 hover:scale-[1.02] hover:shadow-md px-4 py-3 rounded-xl border border-gray-200/60 flex items-center justify-between cursor-pointer select-none"

                        >
                            <div className="flex items-center gap-2 overflow-hidden">
                                <Wallet className="w-4 h-4 text-gray-400 shrink-0"/>
                                <span className="text-xs font-bold text-gray-700 truncate">
                                    {selectedPrice && selectedPrice.labelKey !== 'priceAny'
                                        ? labels[selectedPrice.labelKey]
                                        : labels.priceRange
                                    }
                                </span>
                            </div>
                            <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-300 shrink-0 ${isPriceOpen ? 'rotate-180' : ''}`}/>
                        </button>
                         {isPriceOpen && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50">
                                {priceOptions.map((option, index) => (
                                    <button
                                    type="button"
                                    key={option.value || 'any-price'}
                                    onClick={() => {
                                        onPriceRangeChange(option.value);
                                        closeOtherMenus();
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
                )}
                {/*=======================Roommate search*/}
                {activeTab === 'roommate' && (
                <>
                    {/*location*/}
                    <div className="flex-1 w-full bg-gray-50 hover:bg-gray-100/80 transition-all duration-300 hover:scale-[1.02] hover:shadow-md px-4 py-3 rounded-xl border border-gray-200/60 flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-400 shrink-0"/>
                        <input type="text" value={roommateLocation} onChange={(event) => onRoommateLocationChange(event.target.value)} 
                            placeholder={labels.roommateLocationPlaceholder} className="w-full bg-transparent outline-none text-xs font-bold text-gray-800 placeholder:text-gray-400"
                        />
                    </div>
                    {/*Budget*/}
                    <div className="flex-1 w-full bg-gray-50 hover:bg-gray-100/80 transition-all duration-300 hover:scale-[1.02] hover:shadow-md px-4 py-3 rounded-xl border border-gray-200/60 flex items-center gap-2">
                        <Wallet className="w-4 h-4 text-gray-400 shrink-0"/>
                        <input type="text" value={budget} onChange={(event) => onBudgetChange(event.target.value)}
                        placeholder={labels.budgetPlaceholder}
                        className="w-full bg-transparent outline-none text-xs font-bold text-gray-800 placeholder:text-gray-400"
                        />
                    </div>
                    {/*Gender*/}
                    <div className="w-full md:w-[180px] relative">
                        <button type="button" onClick={()=>{
                            setIsGenderOpen((prev)=> !prev);
                            setIsPropTypeOpen(false);
                            setIsPriceOpen(false);
                        }}
                            className="w-full bg-gray-50 hover:bg-gray-100/80 transition-all duration-300 hover:scale-[1.02] hover:shadow-md px-4 py-3 rounded-xl border border-gray-200/60 flex items-center justify-between cursor-pointer select-none"
                        >
                            <div className="flex items-center gap-2">
                                {SelectedGenderIcon && (<SelectedGenderIcon className="w-4 h-4 text-gray-400"/>)}
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
                                            className={`w-full py-2.5 text-xs font-bold cursor-pointer transition flex items-center gap-2 text-left 
                                                ${option.value === roommateGender 
                                                    ? 'bg-(--color-accent-soft) text-(--color-accent)' 
                                                    : 'text-gray-700 hover:bg-(--color-accent-soft) hover:text-(--color-accent)'
                                                }
                                                `}
                                        >
                                            <Icon className="w-4 h-4 text-gray-400"/>
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
        </div>
    );
};
import React, {useState, useMemo, useEffect} from 'react';
import type { Language, Listing } from '../types';
import {translations} from '../translations';
import { PropertyMap, type MapMarker, type MapCameraProps } from '../Components/home/PropertyMap';
import { HomeSearchPanel } from '../Components/home/HomeSearchPanel';
import { FeaturedListing } from '../Components/home/FeaturedListings';



interface HomePageProps {
    setActivePage : (page: string) => void;
    lang: Language;
    listings: Listing[];
    onSelectListing: (item: Listing) => void;
    isLoggedIn: boolean;
    onSearch?: (query: string) => void;
}

type HomeTab = 'home' | 'roommate' | 'list';

type PropertyType = '' | 'apartment' | 'house' | 'villa' | 'studio' | 'riad';

type PriceRange = '' | '0-1500' | '1500-3000' | '3000+';

type GenderPreference = '' | 'any' | 'male' | 'female';

const CITIES = [
    {
    ar: 'الرباط',
    fr: 'Rabat',
    en: 'Rabat',
    lat: 34.0209,
    lng: -6.8416,
  },
  {
    ar: 'الدار البيضاء',
    fr: 'Casablanca',
    en: 'Casablanca',
    lat: 33.5883,
    lng: -7.6114,
  },
  {
    ar: 'مراكش',
    fr: 'Marrakech',
    en: 'Marrakech',
    lat: 31.6295,
    lng: -7.9811,
  },
  {
    ar: 'خريبكة',
    fr: 'Khouribga',
    en: 'Khouribga',
    lat: 32.8817,
    lng: -6.9063,
  },
  {
    ar: 'طنجة',
    fr: 'Tangier',
    en: 'Tangier',
    lat: 35.7595,
    lng: -5.834,
  },
  {
    ar: 'فاس',
    fr: 'Fez',
    en: 'Fez',
    lat: 34.0181,
    lng: -5.0078,
  },
  {
    ar: 'أكادير',
    fr: 'Agadir',
    en: 'Agadir',
    lat: 30.4278,
    lng: -9.5981,
  },
  {
    ar: 'مكناس',
    fr: 'Meknes',
    en: 'Meknes',
    lat: 33.8938,
    lng: -5.5473,
  },
  {
    ar: 'وجدة',
    fr: 'Oujda',
    en: 'Oujda',
    lat: 34.6812,
    lng: -1.9036,
  },
  {
    ar: 'تطوان',
    fr: 'Tetouan',
    en: 'Tetouan',
    lat: 35.5889,
    lng: -5.3626,
  },
];

const findCityCoords = (cityObj?: Record<Language, string>) =>{
  if (!cityObj){
    return CITIES.find((city) => city.en === 'Khouribga') || CITIES[0];
  }
    const match = CITIES.find((city)=> {
        const matchesArabic = cityObj.ar && (
            city.ar === cityObj.ar || city.ar.includes(cityObj.ar) || cityObj.ar.includes(city.ar)
        );

        const matchesLatin = 
            cityObj.fr && city.fr.toLowerCase() === cityObj.fr.toLowerCase() || 
            cityObj.en && city.en.toLowerCase() === cityObj.en.toLowerCase();

        return matchesArabic || matchesLatin;
    });

    return (match
       ||
       CITIES.find((city) => city.en === 'Khouribga')
       ||
        CITIES[0]);
};

const detectNearestCity= (lat: number, lng: number)=>{
    let nearest = CITIES[0];
    let miniDistance = Infinity;

    CITIES.forEach((city)=>{
        const distance = Math.pow(city.lat - lat, 2) + Math.pow(city.lng - lng, 2);
        if (distance < miniDistance){
            miniDistance = distance;
            nearest = city;
        }
    });
    return nearest.fr;
};


export const HomePage: React.FC<HomePageProps> = ({
    setActivePage,
    lang,
    listings,
    onSelectListing,
    isLoggedIn,
    onSearch,
}) => {

  // language
    const currentLang = translations[lang].homePage;
    const isRTL = lang === 'ar';


    // search state
    const [activeTab, setActiveTab] = useState<HomeTab>('home');
    const [searchQuery, setSearchQuery] = useState('');
    const [propertyType, setPropertyType] = useState<PropertyType>(''); // ola apartement , apres nxofo 
    const [priceRange, setPriceRange] = useState<PriceRange>('');
    const [roommateLocation, setRoommateLocation] = useState('');
    const [budget, setBudget] = useState('');
    const [roommateGender, setRoommateGender] = useState<GenderPreference>('');


    // Details state
    const [activeDetailItem, setActiveDetailItem] = useState<MapMarker | null>(null);


    // map state

    const [cameraProps, setCameraProps] = useState<MapCameraProps>({
      center: { // map center 
        lat: 31.7917,
        lng: -7.0926, 
      },
      zoom: 5.5, // morocoo north africa
      tilt: 0, // camera titlllllll 
      heading: 0, // direction camera west | east | south | North
    });

    // google maps api
    const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEYS; //

    // convert listings to MapMarkers

    const mapMarkers = useMemo<MapMarker[]>(()=>{
      return (listings || []).map((item, index) => {
     

      const cityMatch = findCityCoords(item.city);
      const angle = (index * 130 * Math.PI) / 180;
      const radius = 0.0015 + (index % 3) * 0.001;
      const latOffset = Math.cos(angle) * radius;
      const lngOffset = Math.sin(angle) * radius;
      const district = item.district;
      const districtEnFr = item.districtEnFr;

      return {
        id: `listing-${item.id}`,
        city:{
          ar:cityMatch.ar,
          fr:cityMatch.fr,
          en:cityMatch.en,
        },

        lat: cityMatch.lat + latOffset,
        lng: cityMatch.lng + lngOffset,

        title: item.title,
        price: Number(item.price),
        category: 'home',
        type: item.type,
        image: item.imageUrl,
        description: {
          ar: district ? `${district} - ${cityMatch.ar}` : cityMatch.ar,
          fr: districtEnFr ? `${districtEnFr} - ${cityMatch.fr}` : cityMatch.fr,
          en: districtEnFr ? `${districtEnFr} - ${cityMatch.en}` : cityMatch.en,
        },
      };
    });
  }, [listings]);


  // location 
  useEffect(()=>{
    if (!navigator.geolocation){ // api 
      return;
    }
  
    navigator.geolocation.getCurrentPosition(// navigator it is object we give me info browser/device
      (position) => { // callback 1 succes
        const userLat = position.coords.latitude;
        const userLng = position.coords.longitude;

        const nearestFr = detectNearestCity(userLat, userLng);
        setSearchQuery(nearestFr);
        setCameraProps({
          center: {
            lat: userLat,
            lng: userLng,
          },
          zoom: 14,
          tilt: 75,
          heading: 30,
        });
      },
      () => {setSearchQuery('')}, //callback 2 user dont allow location
      {enableHighAccuracy: true,} // option the browser : w give exact location for exemple use gps...  
    );
  }, []);

  // search input

  const handleSearchChange = (value: string) =>{
    setSearchQuery(value);

    const normalizedValue = value.toLocaleLowerCase();
    const foundCity = CITIES.find((city) => 
      city.ar.toLowerCase().includes(normalizedValue) ||
      city.fr.toLowerCase().includes(normalizedValue) ||
      city.en.toLowerCase().includes(normalizedValue)
    );
    if (foundCity && value.trim() !== ''){
      setCameraProps((prev) => ({// callback previews state
        ...prev,// spread operator --> copie props the prev state , hnaya ana asln knmodifi kolxi ya3ni n9der mnst3mlx hd preview ga3 
        center:{
          lat: foundCity.lat,
          lng: foundCity.lng,
        },

        zoom: 17,
        tilt: 75,
        heading: 45,
      }));
    }
  };


  //search button

  const handlSearchClick = () => {
    if (activeTab === 'roommate'){
      // data rommate oussama

      onSearch?.(roommateLocation || budget);
    }
    else{
      onSearch?.(searchQuery); // ?. ila onsearch existe call him , sinon mdir wlo : optionel chaining
    }
    setActivePage('listings');
  };


  //filter markers

  const filteredMarkers = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    return mapMarkers.filter((marker) => {
      const matchesSearch = query === ''  || marker.city.ar.toLowerCase().includes(query)
                                          || marker.city.fr.toLowerCase().includes(query)
                                          || marker.city.en.toLowerCase().includes(query);

      const matchesType = propertyType === '' || marker.type === propertyType;

      let matchesPrice = true;
      if (priceRange === '0-1500'){matchesPrice = marker.price <= 1500;}
      if (priceRange === '1500-3000'){matchesPrice = marker.price > 1500 && marker.price <= 3000;}
      if (priceRange === '3000+'){matchesPrice = marker.price > 3000;};

      const matchesTab = activeTab === 'list' || marker.category === activeTab;

      return (matchesSearch && matchesType && matchesPrice && matchesTab);
    })
  }, [mapMarkers, searchQuery, propertyType, priceRange, activeTab]);

  // marker click

  const handleMarkerClick = (marker: MapMarker) => {setActiveDetailItem(marker)};

  // contact map

  const handlContactListing = (marker: MapMarker) => {
    const listing = listings.find((item) => `listing-${item.id}` === marker.id);
    if (!listing){
      return;
    }
    onSelectListing(listing);
    setActiveDetailItem(null);
  }

    return(
      <div dir={isRTL ? 'rtl' : 'ltr'} className='w-screen min-h-screen font-sans bg-(--color-background) relative'>
        {/*Ticker pup*/}
        <div className='w-full bg-(--color-accent) text-white py-2.5'>
          <div className='overflow-hidden w-full whitespace-nowrap '  >
            <div className={`animate-ticker items-center ${isRTL ? 'ticker-rtl' : 'ticker-ltr'}`}>
                <div className='flex items-center gap-12 px-6'>
                  <span className='text-xs md:text-sm font-black tracking-wider'>
                    {currentLang.ticker1}
                  </span>
                  <span className='text-xs md:text-sm font-black tracking-wider'>
                    {currentLang.ticker2}
                  </span>
                </div>
                <div className='flex items-center gap-12 px-6'>
                  <span className='text-xs md:text-sm font-black tracking-wider'>
                    {currentLang.ticker2}
                  </span>
                  <span className='text-xs md:text-sm font-black tracking-wider'>
                    {currentLang.ticker1}
                  </span>
                </div>
            </div>
          </div>
        </div>
        {/*Main content*/}
      <main className='w-full flex-1 flex flex-col px-4 md:px-8 pb-8 pt-6 md:pt-8 max-w-[1400px] mx-auto'>
        {/*Hero*/}
        <section className='text-center pb-4 px-2 shrink-0 max-w-2xl mx-auto'>
          <h1 className='text-lg md:text-xl font-black text-gray-900 tracking-tight'>
            {currentLang.titleMain}{' '} 
            <span className='text-(--color-accent)'>
              {currentLang.titleAccent}
            </span>
          </h1>
          <p className='text-xs text-gray-500 font-medium mt-1.5'>
            {currentLang.subtitle}
          </p>
        </section>

        {/*Search*/}

        <HomeSearchPanel
         activeTab={activeTab}
          onTabChange={setActiveTab}

          isLoggedIn={isLoggedIn}
          onNavigate={setActivePage}

          searchQuery={searchQuery}
          onSearchQueryChange={
            handleSearchChange
          }

          propertyType={propertyType}
          onPropertyTypeChange={
            setPropertyType
          }

          priceRange={priceRange}
          onPriceRangeChange={
            setPriceRange
          }

          roommateLocation={
            roommateLocation
          }
          onRoommateLocationChange={
            setRoommateLocation
          }

          budget={budget}
          onBudgetChange={setBudget}

          roommateGender={
            roommateGender
          }
          onRoommateGenderChange={
            setRoommateGender
          }

          onSearch={
            handlSearchClick
          }

          labels={currentLang}
        />
        {/*Map*/}
        <PropertyMap 
          markers={filteredMarkers}
          cameraProps={cameraProps}
          apiKey={googleMapsApiKey}
          onCameraChanged= {setCameraProps}
          onMarkerClick={
            handleMarkerClick
          }
        />
      
      <FeaturedListing
        listings={listings}
        lang={lang}
        featuredLabel={currentLang.featured}
        availableLabel={currentLang.available}
        detailsLabel={currentLang.detailsTitle}
        onSelect={onSelectListing}
      
      
      />


      </main>
      </div>
    );


    



};

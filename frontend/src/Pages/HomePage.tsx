import React, {useState, useMemo, useEffect} from 'react';
import type { Language, Listing, SearchFilters } from '../types';
import {translations} from '../translations';
import { PropertyMap, type MapMarker, type MapCameraProps } from '../Components/home/PropertyMap';
import { HomeSearchPanel } from '../Components/home/HomeSearchPanel';
import { FeaturedListing } from '../Components/home/FeaturedListings';
import { PropertyDetailsDrawer } from '../Components/home/PropertyDetailsDrawer';

import { fetchListings } from '../api/listings';
import { fetchRoommates } from '../api/roommates';
import type { Roommate } from '../types/roommate';
import { RoommateResults } from '../Components/roommates/RoommateResults';
import { RoommateDetailsModal } from '../Components/roommates/RoommateDetailsModal';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { filtersFromParams, filtersToParams } from '../utils/searchFilters';

interface HomePageProps {
    lang: Language;
    onSelectListing: (item: Listing) => void;
    isLoggedIn: boolean;
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

const DEFAULT_CAMERA : MapCameraProps = {
  center: {
    lat: 31.7917,
    lng: -7.0926,
  },
  zoom: 5.5,
  tilt: 0,
  heading: 0,

};

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

const findCityByName = (value: string) => {
  const normalizedValue = value.trim().toLowerCase();
  if (normalizedValue === '') {
    return undefined;
  }
  return CITIES.find((city) =>
    city.ar.toLowerCase().includes(normalizedValue) ||
    city.fr.toLowerCase().includes(normalizedValue) ||
    city.en.toLowerCase().includes(normalizedValue)
  );
};

const cameraForRooms = (rooms: Roommate[]): MapCameraProps => ({
  center: {
    lat: rooms.reduce((sum, room) => sum + room.lat, 0) / rooms.length,
    lng: rooms.reduce((sum, room) => sum + room.lng, 0) / rooms.length,
  },
  zoom: rooms.length === 1 ? 15 : 12.5,
  tilt: 45,
  heading: 0,
});

let hasDetectedLocation = false;

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
    lang,
    onSelectListing,
    isLoggedIn,
}) => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const initialFilters = filtersFromParams(searchParams);

    const currentLang = translations[lang].homePage;
    const isRTL = lang === 'ar';

    const [activeTab, setActiveTab] = useState<HomeTab>('home');
    const [searchQuery, setSearchQuery] = useState(initialFilters.city);
    const [propertyType, setPropertyType] = useState<PropertyType>(initialFilters.type);
    const [priceRange, setPriceRange] = useState<PriceRange>(initialFilters.priceRange);
    const [roommateLocation, setRoommateLocation] = useState('');
    const [budget, setBudget] = useState('');
    const [roommateGender, setRoommateGender] = useState<GenderPreference>('');

    const [activeDetailItem, setActiveDetailItem] = useState<Listing | null>(null);

    const [roommates, setRoommates] = useState<Roommate[]>([]);
    const [activeRoommate, setActiveRoommate] = useState<Roommate | null>(null);
    const [hasRoommateError, setHasRoommateError] = useState(false);

    const [cameraProps, setCameraProps] = useState<MapCameraProps>(DEFAULT_CAMERA);

    const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

const [listings, setListings] = useState<Listing[]>([]);

useEffect(() => {
  const controller = new AbortController();

  const timeoutId = setTimeout(async () => {
    let minPrice: number | undefined;
    let maxPrice: number | undefined;

    if (priceRange === '0-1500') { maxPrice = 1500; }
    if (priceRange === '1500-3000') { minPrice = 1501; maxPrice = 3000; }
    if (priceRange === '3000+') { minPrice = 3001; }

    try {
      const data = await fetchListings(
        { city: searchQuery, type: propertyType, minPrice, maxPrice },
        controller.signal,
      );
      setListings(data);
    } catch (error) {
      if (controller.signal.aborted) return;
      console.error(error);
    }
  }, 300);

  return () => {
    clearTimeout(timeoutId);
    controller.abort();
  };
}, [searchQuery, propertyType, priceRange]);

useEffect(() => {
  if (activeTab !== 'roommate') {
    return;
  }
  const controller = new AbortController();

  const timeoutId = setTimeout(async () => {
    const typedCity = findCityByName(roommateLocation);
    try {
      const data = await fetchRoommates(
        {
          city: typedCity ? typedCity.en : roommateLocation,
          maxBudget: Number(budget) > 0 ? Number(budget) : undefined,
          gender: roommateGender === 'male' || roommateGender === 'female' ? roommateGender : undefined,
        },
        controller.signal,
      );
      setRoommates(data);
      setHasRoommateError(false);

      if (roommateLocation.trim() !== '' && data.length > 0) {
        setCameraProps(cameraForRooms(data));
      } else if (typedCity) {
        setCameraProps({ center: { lat: typedCity.lat, lng: typedCity.lng }, zoom: 12.5, tilt: 45, heading: 0 });
      } else {
        setCameraProps(DEFAULT_CAMERA);
      }
    } catch (error) {
      if (controller.signal.aborted) return;
      console.error(error); // technical detail for developers, in the browser console only
      setRoommates([]);
      setHasRoommateError(true); // the user only sees a simple message under the map
    }
  }, 300);

  return () => {
    clearTimeout(timeoutId);
    controller.abort();
  };
}, [activeTab, roommateLocation, budget, roommateGender]);

const roommateMarkers = useMemo<MapMarker[]>(() => {
  return roommates.map((room) => {
    const city = findCityCoords({ ar: '', fr: room.city, en: room.city });
    const place = `${room.district} - ${room.city}`;
    return {
      id: `roommate-${room.id}`,
      city: { ar: city.ar, fr: city.fr, en: city.en },
      lat: room.lat,
      lng: room.lng,
      title: { ar: place, fr: place, en: place },
      price: room.price,
      category: 'roommate',
      type: 'apartment',
      description: { ar: place, fr: place, en: place },
    };
  });
}, [roommates]);

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

  useEffect(()=>{

    if (hasDetectedLocation || initialFilters.city || !navigator.geolocation) {
      return;
    }
    hasDetectedLocation = true;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userLat = position.coords.latitude;
        const userLng = position.coords.longitude;

        const nearestFr = detectNearestCity(userLat, userLng);
        setSearchQuery(nearestFr);
        setCameraProps({
          center: {
            lat: userLat,
            lng: userLng,
          },
          zoom: 17.5,
          tilt: 55,
          heading: 30,
        });
      },
      () => {setSearchQuery('')},
      {enableHighAccuracy: true,}
    );
  }, []);

  const handleSearchChange = (value: string) =>{
    setSearchQuery(value);

    if (value.trim() === ''){
      setCameraProps(DEFAULT_CAMERA);
      return ;
    }
    const normalizedValue = value.toLocaleLowerCase();
    const foundCity = CITIES.find((city) =>
      city.ar.toLowerCase().includes(normalizedValue) ||
      city.fr.toLowerCase().includes(normalizedValue) ||
      city.en.toLowerCase().includes(normalizedValue)
    );
    if (foundCity && value.trim() !== ''){
      setCameraProps((prev) => ({
        ...prev,
        center:{
          lat: foundCity.lat,
          lng: foundCity.lng,
        },

        zoom: 17.5,
        tilt: 55,
        heading: 45,
      }));
    }
  };

  const handlSearchClick = () => {
    if (activeTab === 'roommate') {
      if (roommates.length > 0) {
        setCameraProps(cameraForRooms(roommates));
      }
      return;
    }

    const homeFilters: SearchFilters = { city: searchQuery, type: propertyType, priceRange };

    navigate({ pathname: '/', search: filtersToParams(homeFilters).toString() }, { replace: true });
    navigate({ pathname: '/listings', search: filtersToParams(homeFilters).toString() });
  };

const filteredMarkers = useMemo(() => {
  return mapMarkers.filter(
    (marker) => activeTab === 'list' || marker.category === activeTab,
  );
}, [mapMarkers, activeTab]);

  const handleMarkerClick = (marker: MapMarker) => {
    const listing = listings.find((item) => `listing-${item.id}` === marker.id);
    if (!listing){
      return;
    }

    setActiveDetailItem(listing)
  };

  const handleRoommateMarkerClick = (marker: MapMarker) => {
    const room = roommates.find((item) => `roommate-${item.id}` === marker.id);
    if (room) {
      setActiveRoommate(room);
    }
  };

  const handlContactListing = (listing: Listing) => {
    onSelectListing(listing);
    setActiveDetailItem(null);
  }

    return(
      <div dir={isRTL ? 'rtl' : 'ltr'} className='w-screen min-h-screen font-sans bg-(--color-background) relative'>

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

      <main className='w-full flex-1 flex flex-col px-4 md:px-8 pb-8 pt-6 md:pt-8 max-w-[1600px] mx-auto'>

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

        <HomeSearchPanel
         activeTab={activeTab}
          onTabChange={setActiveTab}

          isLoggedIn={isLoggedIn}
          onNavigate={(page) => navigate('/' + page)}

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

        <PropertyMap
          markers={activeTab === 'roommate' ? roommateMarkers : filteredMarkers}
          cameraProps={cameraProps}
          apiKey={googleMapsApiKey}
          onCameraChanged= {setCameraProps}
          onMarkerClick={
            activeTab === 'roommate' ? handleRoommateMarkerClick : handleMarkerClick
          }
        />

      {activeTab === 'roommate' ? (
        <RoommateResults
          rooms={roommates}
          hasError={hasRoommateError}
          title={currentLang.roomsTitle}
          emptyLabel={currentLang.roomsEmpty}
          errorLabel={currentLang.roomsError}
          onSelect={setActiveRoommate}
        />
      ) : (
        <FeaturedListing
          listings={listings}
          lang={lang}
          featuredLabel={currentLang.featured}
          availableLabel={currentLang.available}
          detailsLabel={currentLang.detailsTitle}
          onSelect={setActiveDetailItem}
        />
      )}

      <RoommateDetailsModal
        room={activeRoommate}
        labels={currentLang}
        onClose={() => setActiveRoommate(null)}
      />

      <PropertyDetailsDrawer
        item={activeDetailItem}
        lang={lang}
        title={currentLang.detailsTitle}
        contactLabel={currentLang.contactBtn}
        locationLabel={currentLang.location}
        priceLabel={currentLang.price}
        perMonthLabel={currentLang.perMonth}

        onClose={() => setActiveDetailItem(null)}
        onContact={handlContactListing}
      />

      </main>
      </div>
    );

};

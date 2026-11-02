import React from "react";
import {APIProvider, AdvancedMarker, Map} from '@vis.gl/react-google-maps';
import { Home as HomeIcon } from 'lucide-react';
import type { Language } from '../../types';




export interface MapMarker{
    id: string;
    city: {
        ar: string;
        fr: string;
        en: string
    };
    lat: number;
    lng: number;

    title :{
        ar: string;
        fr: string;
        en: string;
    };
    price: number;
    category: 'home' | 'roommate';
    type: 'apartment' | 'house' | 'studio' | 'riad' | 'villa';

    description: {
        ar: string;
        fr: string;
        en: string;
    };

    image?: string;
}

export interface MapCameraProps{
    center: {
        lat: number;
        lng: number;
    };
    zoom: number;
    tilt: number;
    heading: number;
}

interface PropertyMapProps {
    markers: MapMarker[];
    cameraProps: MapCameraProps;
    apiKey: string;
    currencyLabel: string;
    lang: Language;

    onCameraChanged: (camera: MapCameraProps) => void;
    onMarkerClick: (marker: MapMarker) => void;
}
const mapId = import.meta.env.VITE_GOOGLE_MAPS_MAP_ID;

export const PropertyMap: React.FC<PropertyMapProps> = ({
    markers,
    cameraProps,
    apiKey,
    onCameraChanged,
    onMarkerClick,
    currencyLabel,
    lang, 
}) => {
    return (
            <div className="w-full h-[65vh] md:h-[80vh]  min-h-[380px] md:min-h-[550px] mt-4 rounded-3xl overflow-hidden shadow-2xl border border-gray-100">
            <APIProvider apiKey={apiKey} language={lang}>
                <Map
                    center={cameraProps.center}
                    zoom={cameraProps.zoom}
                    tilt={cameraProps.tilt}
                    heading={cameraProps.heading}
                    mapId={mapId}
                    gestureHandling="greedy"
                    renderingType="VECTOR"
                    onCameraChanged={(event) => onCameraChanged(event.detail)}
                    style={{width: '100%', height: '100%',}}     
                >
                    {markers.map((marker) => (
                       <AdvancedMarker
                        key={marker.id}
                        position={{
                            lat: marker.lat,
                            lng: marker.lng,
                        }}
                        onClick={() => onMarkerClick(marker)}
                        >
                            <div className="marker-3d-bounce group cursor-pointer flex flex-col items-center py-2">
                                {/*Price*/}
                                <div className="bg-(--color-accent) text-white font-black text-xs md:text-sm px-3.5 py-1.5 rounded-full shadow-2xl border-2 border-white mb-1.5 whitespace-nowrap transition-all duration-300 scale-100 group-hover:scale-[1.35] group-hover:-translate-y-2 origin-bottom">
                                    {marker.price} {currencyLabel}
                                </div>
                                {/*Icon*/}
                                <div className="bg-white p-2.5 rounded-2xl shadow-2xl border-2 border-(--color-accent) flex items-center justify-center transition-all duration-300 group-hover:scale-[1.3]">
                                    <HomeIcon className="w-5 h-5 text-red-500"/>
                                </div>
                            </div>
                       </AdvancedMarker>
                    ))}
                </Map>
            </APIProvider>
        </div>
    );
};
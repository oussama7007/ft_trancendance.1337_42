import React from "react";


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
    price: string;
    category: 'home' | 'rommate';
    type: 'apartment' | 'house' | 'studio' | 'riad';

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
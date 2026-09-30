export type Language = 'ar' | 'fr' | 'en';

export type PropertyType =
    | 'apartment'
    | 'house'
    | 'studio'
    | 'riad'
    | 'villa';

export interface Listing {
    id: number;
    ownerId: number;
    city: string;
    cityEnFr: string;

    title: Record<Language, string>;
    description: Record<Language, string>; // object (key o value)
    district: string;
    districtEnFr: string;

    price: number;
    bedrooms: number;

    hasWifi: boolean;
    imageUrl: string;
    images?:string[];
    video?: string;
    ownerName: string;

    lat: number;
    lng: number;

    type: PropertyType;

}


export type Language = 'ar' | 'fr' | 'en';

export type PropertyType =
    | 'apartment'
    | 'house'
    | 'studio'
    | 'riad'
    | 'villa';

export type PriceRange = '' | '0-1500' | '1500-3000' | '3000+';

export interface SearchFilters {
    city: string;
    type: PropertyType | '';
    priceRange: PriceRange;
}

export interface Listing {
    id: number;
    ownerId: number;
    // city: string;
    city: Record<Language, string>;
    // cityEnFr: string;

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
    avatarUrl?: string;
}

export interface User {
  id: number;

  firstName: string;
  lastName: string;
  fullName: string;
  gender?: string;
  email: string;
 

  dateOfBirth: string;

 

  avatar?: string;
    avatarUrl?: string | null;
  instagram?: string | null;
  facebook?: string | null;
  linkedin?: string | null;

  bio?: string | null;

  role?: 'user' | 'admin';

  createdAt?: string;
  updatedAt?: string;
}

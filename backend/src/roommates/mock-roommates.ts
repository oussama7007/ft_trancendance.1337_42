export interface Roommate {
  id: number;
  city: string;
  district: string;
  price: number;
  ownerName: string;
  roommates: string[];
  genderPreference?: string;
  hasWifi: boolean;
  lat: number;
  lng: number;
}

export const MOCK_ROOMMATES: Roommate[] = [
  {
    id: 1,
    city: 'casablanca',
    district: 'maarif',
    price: 1800,
    ownerName: 'Karim',
    roommates: ['Amine', 'Yassine'],
    genderPreference: 'male',
    hasWifi: true,
    lat: 33.5786,
    lng: -7.6343,
  },
  {
    id: 2,
    city: 'casablanca',
    district: 'bourgogne',
    price: 2600,
    ownerName: 'Sara',
    roommates: ['Salma'],
    genderPreference: 'female',
    hasWifi: true,
    lat: 33.5985,
    lng: -7.645,
  },
  {
    id: 3,
    city: 'rabat',
    district: 'agdal',
    price: 1500,
    ownerName: 'Omar',
    roommates: ['Mehdi', 'Hamza'],
    genderPreference: 'male',
    hasWifi: false,
    lat: 33.9986,
    lng: -6.853,
  },
];

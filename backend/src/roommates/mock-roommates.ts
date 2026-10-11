export interface Roommate {
  id: number;
  city: string;
  district: string;
  price: number;
  ownerName: string;
  roommates: string[];
  genderPreference?: string;
  hasWifi: boolean;
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
  },
];

import type { Language } from '../types';

export type City = Record<Language, string> & {
    lat: number;
    lng: number;
};

export const CITIES: City[] = [
    { ar: 'الرباط حي', fr: 'Rabat', en: 'Rabat', lat: 34.0209, lng: -6.8416 },
    { ar: 'الدار البيضاء', fr: 'Casablanca', en: 'Casablanca', lat: 33.5883, lng: -7.6114 },
    { ar: 'مراكش', fr: 'Marrakech', en: 'Marrakech', lat: 31.6295, lng: -7.9811 },
    { ar: 'خريبكة', fr: 'Khouribga', en: 'Khouribga', lat: 32.8817, lng: -6.9063 },
    { ar: 'طنجة', fr: 'Tangier', en: 'Tangier', lat: 35.7595, lng: -5.834 },
    { ar: 'فاس', fr: 'Fez', en: 'Fez', lat: 34.0181, lng: -5.0078 },
    { ar: 'أكادير', fr: 'Agadir', en: 'Agadir', lat: 30.4278, lng: -9.5981 },
    { ar: 'مكناس', fr: 'Meknes', en: 'Meknes', lat: 33.8938, lng: -5.5473 },
    { ar: 'وجدة', fr: 'Oujda', en: 'Oujda', lat: 34.6812, lng: -1.9036 },
    { ar: 'تطوان', fr: 'Tetouan', en: 'Tetouan', lat: 35.5889, lng: -5.3626 },
];

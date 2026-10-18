import type { Listing } from '../types';

export const mockListings: Listing[] = [
  {
    id: 1,
    ownerId: 101,
    city: {
          ar: 'الرباط',
          fr: 'Rabat',
          en: 'Rabat',
        },
    title: {
      ar: 'شقة جميلة في حي أكدال',
      fr: 'Bel appartement à Agdal',
      en: 'Beautiful apartment in Agdal',
    },
    description: {
      ar: 'شقة مريحة ومجهزة بالكامل قريبة من جميع الخدمات.',
      fr: 'Appartement confortable et entièrement équipé, proche de toutes les commodités.',
      en: 'Comfortable and fully equipped apartment close to all amenities.',
    },
    district: 'أكدال',
    districtEnFr: 'Agdal',
    price: 2500,
    bedrooms: 2,
    hasWifi: true,
    imageUrl:
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80',
    images: [
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80',
    ],
    ownerName: 'Ahmed',
    lat: 34.0209,
    lng: -6.8416,
    type: 'apartment',
  },

  {
    id: 2,
    ownerId: 102,
    city: {
          ar: 'الدار البيضاء',
          fr: 'Casablanca',
          en: 'Casablanca',
        },
    title: {
      ar: 'ستوديو عصري في وسط الدار البيضاء',
      fr: 'Studio moderne au centre de Casablanca',
      en: 'Modern studio in central Casablanca',
    },
    description: {
      ar: 'ستوديو صغير وعصري مناسب للطلبة والمهنيين.',
      fr: 'Studio moderne idéal pour étudiants et professionnels.',
      en: 'Modern studio ideal for students and professionals.',
    },
    district: 'المعاريف',
    districtEnFr: 'Maarif',
    price: 1800,
    bedrooms: 1,
    hasWifi: true,
    imageUrl:
      'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80',
    images: [
      'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80',
    ],
    ownerName: 'Youssef',
    lat: 33.5883,
    lng: -7.6114,
    type: 'studio',
  },

  {
    id: 3,
    ownerId: 103,
    city: {
          ar: 'مراكش',
          fr: 'Marrakech',
          en: 'Marrakech',
        },
    title: {
      ar: 'فيلا فاخرة في مراكش',
      fr: 'Villa luxueuse à Marrakech',
      en: 'Luxury villa in Marrakech',
    },
    description: {
      ar: 'فيلا واسعة ومريحة مع مساحة كبيرة مناسبة للعائلات.',
      fr: 'Grande villa confortable avec beaucoup d’espace, idéale pour les familles.',
      en: 'Spacious and comfortable villa with plenty of space for families.',
    },
    district: 'المدينة',
    districtEnFr: 'Medina',
    price: 5500,
    bedrooms: 4,
    hasWifi: true,
    imageUrl:
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80',
    images: [
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80',
    ],
    ownerName: 'Omar',
    lat: 31.6295,
    lng: -7.9811,
    type: 'villa',
  },

  {
    id: 4,
    ownerId: 104,
    city: {
          ar: 'خريبكة',
          fr: 'Khouribga',
          en: 'Khouribga',
        },
    title: {
      ar: 'شقة اقتصادية في خريبكة',
      fr: 'Appartement économique à Khouribga',
      en: 'Affordable apartment in Khouribga',
    },
    description: {
      ar: 'شقة بسيطة ومناسبة للطلبة والميزانية المحدودة.',
      fr: 'Appartement simple et adapté aux étudiants et aux petits budgets.',
      en: 'Simple apartment suitable for students and smaller budgets.',
    },
    district: 'وسط المدينة',
    districtEnFr: 'Centre-ville',
    price: 1200,
    bedrooms: 2,
    hasWifi: false,
    imageUrl:
      'https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=1200&q=80',
    images: [
      'https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=1200&q=80',
    ],
    ownerName: 'Hassan',
    lat: 32.8817,
    lng: -6.9063,
    type: 'apartment',
  },

  {
    id: 5,
    ownerId: 105,
    city: {
          ar: 'طنجة',
          fr: 'Tanger',
          en: 'Tangier',
        },
    title: {
      ar: 'منزل واسع في طنجة',
      fr: 'Grande maison à Tanger',
      en: 'Spacious house in Tangier',
    },
    description: {
      ar: 'منزل واسع وقريب من البحر والمواصلات.',
      fr: 'Grande maison proche de la mer et des transports.',
      en: 'Spacious house close to the sea and public transportation.',
    },
    district: 'مالاباطا',
    districtEnFr: 'Malabata',
    price: 3200,
    bedrooms: 3,
    hasWifi: true,
    imageUrl:
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
    images: [
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
    ],
    ownerName: 'Karim',
    lat: 35.7595,
    lng: -5.834,
    type: 'house',
  },
];
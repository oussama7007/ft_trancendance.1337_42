
import { MigrationInterface, QueryRunner } from 'typeorm';

const img = (id: string) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1200&q=80`;

const cities = [
  {
    ar: 'الرباط حي', fr: 'Rabat', en: 'Rabat',
    districts: ['أكدال', 'حي الرياض', 'حسان', 'العكاري', 'أكدال العليا'],
    lat: 34.0209, lng: -6.8416,
  },
  {
    ar: 'الدار البيضاء', fr: 'Casablanca', en: 'Casablanca',
    districts: ['المعاريف', 'أنفا', 'بوركون', 'الوازيس', 'وسط المدينة'],
    lat: 33.5883, lng: -7.6114,
  },
  {
    ar: 'مراكش', fr: 'Marrakech', en: 'Marrakech',
    districts: ['جليز', 'المدينة', 'النخيل', 'أكدال', 'المسيرة'],
    lat: 31.6295, lng: -7.9811,
  },
  {
    ar: 'خريبكة', fr: 'Khouribga', en: 'Khouribga',
    districts: ['وسط المدينة', 'القدس', 'الفتح', 'النهضة', 'الرياض'],
    lat: 32.8817, lng: -6.9063,
  },
  {
    ar: 'طنجة', fr: 'Tangier', en: 'Tangier',
    districts: ['مالاباطا', 'وسط المدينة', 'إيبيريا', 'بني مكادة', 'مرشان'],
    lat: 35.7595, lng: -5.834,
  },
  {
    ar: 'فاس', fr: 'Fez', en: 'Fez',
    districts: ['فاس الجديد', 'أكدال', 'زواغة', 'المدينة القديمة', 'النرجس'],
    lat: 34.0181, lng: -5.0078,
  },
  {
    ar: 'أكادير', fr: 'Agadir', en: 'Agadir',
    districts: ['تالبرجت', 'فونتي', 'الداخلة', 'وسط المدينة', 'أنزا'],
    lat: 30.4278, lng: -9.5981,
  },
  {
    ar: 'مكناس', fr: 'Meknes', en: 'Meknes',
    districts: ['حمرية', 'المدينة القديمة', 'تولال', 'البساتين', 'الزيتون'],
    lat: 33.8938, lng: -5.5473,
  },
  {
    ar: 'وجدة', fr: 'Oujda', en: 'Oujda',
    districts: ['وسط المدينة', 'القدس', 'السلام', 'النجد', 'الوفاق'],
    lat: 34.6812, lng: -1.9036,
  },
  {
    ar: 'تطوان', fr: 'Tetouan', en: 'Tetouan',
    districts: ['المضيق', 'المدينة القديمة', 'الولاية', 'سانية الرمل', 'الطويلع'],
    lat: 35.5889, lng: -5.3626,
  },
];

const types = ['apartment', 'house', 'studio', 'riad', 'villa'];

const prices = [
  1000, 1200, 1500, 1800, 2000,
  2300, 2500, 2800, 3000, 3200,
  3500, 3800, 4000, 4500, 5000,
  5500, 6000, 6500, 7000, 8000,
  9000, 10000,
];

const imageIds = [
  'photo-1522708323590-d24dbb6b0267',
  'photo-1505693416388-ac5ce068fe85',
  'photo-1502672260266-1c1ef2d93688',
  'photo-1564013799919-ab600027ffc6',
  'photo-1512917774080-9991f1c4c750',
  'photo-1600607687939-ce8a6c25118c',
  'photo-1600210492486-724fe5c67fb0',
  'photo-1600566753086-00f18fb6b3ea',
];

const owners = [
  'Ahmed', 'Salma', 'Youssef', 'Karim', 'Sara',
  'Omar', 'Imane', 'Hamza', 'Nadia', 'Mehdi',
];

const listings = Array.from({ length: 50 }, (_, i) => {
  const city = cities[Math.floor(i / 5)];
  const type = types[i % types.length];
  const image = img(imageIds[i % imageIds.length]);
  const bedrooms = (i % 5) + 1;
  const price = prices[i % prices.length];

  return {
    ownerId: 201 + i,

    cityAr: city.ar,
    cityFr: city.fr,
    cityEn: city.en,

    titleAr: `${type} جميلة في ${city.ar} رقم ${i + 1}`,
    titleFr: `Beau logement à ${city.fr} numéro ${i + 1}`,
    titleEn: `Beautiful property in ${city.en} number ${i + 1}`,

    descriptionAr: `عقار مريح ومجهز في ${city.ar}، قريب من جميع الخدمات.`,
    descriptionFr: `Logement confortable à ${city.fr}, proche de toutes les commodités.`,
    descriptionEn: `Comfortable property in ${city.en}, close to all amenities.`,

    district: city.districts[i % 5],
    districtEnFr: city.districts[i % 5],

    price,
    bedrooms,
    hasWifi: i % 2 === 0,

    imageUrl: image,
    images: [
      image,
      img(imageIds[(i + 1) % imageIds.length]),
    ],

    ownerName: owners[i % owners.length],

    lat: city.lat + (i % 5) * 0.001,
    lng: city.lng + (i % 5) * 0.001,

    type,
  };
});

export class SeedListings1792000000000
  implements MigrationInterface {
  name = 'SeedListings1792000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const l of listings) {
      await queryRunner.query(
        `INSERT INTO "listing" (
          "ownerId", "cityAr", "cityFr", "cityEn",
          "titleAr", "titleFr", "titleEn",
          "descriptionAr", "descriptionFr", "descriptionEn",
          "district", "districtEnFr",
          "price", "bedrooms", "hasWifi",
          "imageUrl", "images", "ownerName",
          "lat", "lng", "type"
        )
        VALUES (
          $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,
          $11,$12,$13,$14,$15,$16,$17::text[],
          $18,$19,$20,$21
        )`,
        [
          l.ownerId,
          l.cityAr,
          l.cityFr,
          l.cityEn,
          l.titleAr,
          l.titleFr,
          l.titleEn,
          l.descriptionAr,
          l.descriptionFr,
          l.descriptionEn,
          l.district,
          l.districtEnFr,
          l.price,
          l.bedrooms,
          l.hasWifi,
          l.imageUrl,
          l.images,
          l.ownerName,
          l.lat,
          l.lng,
          l.type,
        ],
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DELETE FROM "listing"
       WHERE "ownerId" BETWEEN 201 AND 250
       AND "titleEn" LIKE 'Beautiful property in % number %'`,
    );
  }
}

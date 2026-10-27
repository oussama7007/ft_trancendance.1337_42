import { MigrationInterface, QueryRunner } from "typeorm";

const img = (id: string) =>
    `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1200&q=80`;

const listings = [
    {
        ownerId: 101, cityAr: 'الرباط', cityFr: 'Rabat', cityEn: 'Rabat',
        titleAr: 'شقة جميلة في حي أكدال', titleFr: 'Bel appartement à Agdal', titleEn: 'Beautiful apartment in Agdal',
        descriptionAr: 'شقة مريحة ومجهزة بالكامل قريبة من جميع الخدمات.',
        descriptionFr: 'Appartement confortable et entièrement équipé, proche de toutes les commodités.',
        descriptionEn: 'Comfortable and fully equipped apartment close to all amenities.',
        district: 'أكدال', districtEnFr: 'Agdal', price: 2500, bedrooms: 2, hasWifi: true,
        imageUrl: img('photo-1522708323590-d24dbb6b0267'),
        images: [img('photo-1522708323590-d24dbb6b0267'), img('photo-1505693416388-ac5ce068fe85')],
        ownerName: 'Ahmed', lat: 34.0209, lng: -6.8416, type: 'apartment',
    },
    {
        ownerId: 102, cityAr: 'الدار البيضاء', cityFr: 'Casablanca', cityEn: 'Casablanca',
        titleAr: 'ستوديو عصري في وسط الدار البيضاء', titleFr: 'Studio moderne au centre de Casablanca', titleEn: 'Modern studio in central Casablanca',
        descriptionAr: 'ستوديو عصري وهادئ مناسب لطالب أو موظف.',
        descriptionFr: 'Studio moderne et calme, idéal pour un étudiant ou un employé.',
        descriptionEn: 'Modern and quiet studio, ideal for a student or professional.',
        district: 'المعاريف', districtEnFr: 'Maarif', price: 3200, bedrooms: 1, hasWifi: true,
        imageUrl: img('photo-1502672260266-1c1ef2d93688'),
        images: [img('photo-1502672260266-1c1ef2d93688')],
        ownerName: 'Salma', lat: 33.5883, lng: -7.6322, type: 'studio',
    },
    {
        ownerId: 103, cityAr: 'مراكش', cityFr: 'Marrakech', cityEn: 'Marrakech',
        titleAr: 'رياض تقليدي في المدينة القديمة', titleFr: 'Riad traditionnel dans la médina', titleEn: 'Traditional riad in the medina',
        descriptionAr: 'رياض أصيل بفناء داخلي ومسبح صغير.',
        descriptionFr: 'Riad authentique avec patio intérieur et petite piscine.',
        descriptionEn: 'Authentic riad with an inner courtyard and a small pool.',
        district: 'المدينة', districtEnFr: 'Médina', price: 6500, bedrooms: 4, hasWifi: true,
        imageUrl: img('photo-1564013799919-ab600027ffc6'),
        images: [img('photo-1564013799919-ab600027ffc6')],
        ownerName: 'Youssef', lat: 31.6295, lng: -7.9811, type: 'riad',
    },
    {
        ownerId: 104, cityAr: 'طنجة', cityFr: 'Tanger', cityEn: 'Tangier',
        titleAr: 'فيلا بإطلالة على البحر', titleFr: 'Villa avec vue sur la mer', titleEn: 'Villa with sea view',
        descriptionAr: 'فيلا واسعة بحديقة وإطلالة بانورامية على البحر.',
        descriptionFr: 'Grande villa avec jardin et vue panoramique sur la mer.',
        descriptionEn: 'Spacious villa with a garden and panoramic sea view.',
        district: 'مالاباطا', districtEnFr: 'Malabata', price: 9000, bedrooms: 5, hasWifi: false,
        imageUrl: img('photo-1512917774080-9991f1c4c750'),
        images: [img('photo-1512917774080-9991f1c4c750')],
        ownerName: 'Karim', lat: 35.7595, lng: -5.8340, type: 'villa',
    },
];

export class SeedListings1791900000000 implements MigrationInterface {
    name = 'SeedListings1791900000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        for (const l of listings) {
            await queryRunner.query(
                `INSERT INTO "listing" ("ownerId","cityAr","cityFr","cityEn","titleAr","titleFr","titleEn","descriptionAr","descriptionFr","descriptionEn","district","districtEnFr","price","bedrooms","hasWifi","imageUrl","images","ownerName","lat","lng","type")
                 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21)`,
                [
                    l.ownerId, l.cityAr, l.cityFr, l.cityEn, l.titleAr, l.titleFr, l.titleEn,
                    l.descriptionAr, l.descriptionFr, l.descriptionEn, l.district, l.districtEnFr,
                    l.price, l.bedrooms, l.hasWifi, l.imageUrl, l.images.join(','),
                    l.ownerName, l.lat, l.lng, l.type,
                ],
            );
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DELETE FROM "listing" WHERE "ownerId" IN (101,102,103,104)`);
    }

}

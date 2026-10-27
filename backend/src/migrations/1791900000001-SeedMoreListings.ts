import { MigrationInterface, QueryRunner } from "typeorm";

const img = (id: string) =>
    `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1200&q=80`;

const listings = [
    {
        ownerId: 105, cityAr: 'فاس', cityFr: 'Fès', cityEn: 'Fes',
        titleAr: 'شقة واسعة قرب الجامعة', titleFr: "Grand appartement près de l'université", titleEn: 'Spacious apartment near the university',
        descriptionAr: 'شقة واسعة ومشمسة قريبة من الجامعة ووسائل النقل.',
        descriptionFr: "Appartement spacieux et lumineux, proche de l'université et des transports.",
        descriptionEn: 'Spacious, sunny apartment close to the university and public transport.',
        district: 'سايس', districtEnFr: 'Saïss', price: 1800, bedrooms: 3, hasWifi: true,
        imageUrl: img('photo-1560448204-e02f11c3d0e2'),
        images: [img('photo-1560448204-e02f11c3d0e2')],
        ownerName: 'Hassan', lat: 34.0331, lng: -5.0003, type: 'apartment',
    },
    {
        ownerId: 106, cityAr: 'أكادير', cityFr: 'Agadir', cityEn: 'Agadir',
        titleAr: 'ستوديو قريب من الشاطئ', titleFr: 'Studio proche de la plage', titleEn: 'Studio close to the beach',
        descriptionAr: 'ستوديو مفروش على بعد دقائق من الشاطئ.',
        descriptionFr: 'Studio meublé à quelques minutes de la plage.',
        descriptionEn: 'Furnished studio a few minutes from the beach.',
        district: 'الكورنيش', districtEnFr: 'Corniche', price: 2200, bedrooms: 1, hasWifi: true,
        imageUrl: img('photo-1493809842364-78817add7ffb'),
        images: [img('photo-1493809842364-78817add7ffb')],
        ownerName: 'Imane', lat: 30.4278, lng: -9.5981, type: 'studio',
    },
    {
        ownerId: 107, cityAr: 'مكناس', cityFr: 'Meknès', cityEn: 'Meknes',
        titleAr: 'منزل عائلي بحديقة', titleFr: 'Maison familiale avec jardin', titleEn: 'Family house with a garden',
        descriptionAr: 'منزل هادئ بحديقة ومرآب مناسب للعائلات.',
        descriptionFr: 'Maison calme avec jardin et garage, idéale pour les familles.',
        descriptionEn: 'Quiet house with a garden and garage, ideal for families.',
        district: 'حمرية', districtEnFr: 'Hamria', price: 4000, bedrooms: 4, hasWifi: false,
        imageUrl: img('photo-1568605114967-8130f3a36994'),
        images: [img('photo-1568605114967-8130f3a36994')],
        ownerName: 'Nadia', lat: 33.8935, lng: -5.5473, type: 'house',
    },
    {
        ownerId: 108, cityAr: 'الدار البيضاء', cityFr: 'Casablanca', cityEn: 'Casablanca',
        titleAr: 'شقة فاخرة بإطلالة على الكورنيش', titleFr: 'Appartement de luxe vue corniche', titleEn: 'Luxury apartment with corniche view',
        descriptionAr: 'شقة فاخرة بإطلالة على البحر وخدمات متكاملة.',
        descriptionFr: 'Appartement de luxe avec vue sur la mer et services complets.',
        descriptionEn: 'Luxury apartment with sea view and full amenities.',
        district: 'عين الذئاب', districtEnFr: 'Ain Diab', price: 8500, bedrooms: 3, hasWifi: true,
        imageUrl: img('photo-1545324418-cc1a3fa10c00'),
        images: [img('photo-1545324418-cc1a3fa10c00')],
        ownerName: 'Omar', lat: 33.5950, lng: -7.6690, type: 'apartment',
    },
];

export class SeedMoreListings1791900000001 implements MigrationInterface {
    name = 'SeedMoreListings1791900000001'

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
        await queryRunner.query(`DELETE FROM "listing" WHERE "ownerId" IN (105,106,107,108)`);
    }

}

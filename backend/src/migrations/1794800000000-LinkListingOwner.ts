import { MigrationInterface, QueryRunner } from 'typeorm';
import { randomBytes } from 'node:crypto';
import * as bcrypt from 'bcrypt';

// TEST DATA ONLY. The sample listings (seed migrations) pointed to owners that did
// not exist. These demo owners take them over so the foreign key can be added and
// the contact/chat flow can be tested. Real users and listings come from sign-up
// and the add-listing page.
const DEMO_OWNERS = [
    { firstName: 'Hassan', lastName: 'Alaoui', gender: 'male', contact: 'hassan.owner@irent.local' },
    { firstName: 'Imane', lastName: 'Bennani', gender: 'female', contact: 'imane.owner@irent.local' },
    { firstName: 'Youssef', lastName: 'Tazi', gender: 'male', contact: 'youssef.owner@irent.local' },
    { firstName: 'Salma', lastName: 'Idrissi', gender: 'female', contact: 'salma.owner@irent.local' },
];

export class LinkListingOwner1794800000000 implements MigrationInterface {
    name = 'LinkListingOwner1794800000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1) create the demo owners (the password comes from DEMO_OWNER_PASSWORD)
        const password = process.env.DEMO_OWNER_PASSWORD || randomBytes(32).toString('hex');
        const passwordHash = await bcrypt.hash(password, 10);

        const ownerIds: number[] = [];

        for (const owner of DEMO_OWNERS) {
            const [row] = await queryRunner.query(
                `INSERT INTO "user" ("firstName", "lastName", "dateOfBirth", "gender", "email", "passwordHash")
                 VALUES ($1, $2, '1990-01-01', $3, $4, $5)
                 ON CONFLICT ("email") DO UPDATE SET "email" = EXCLUDED."email"
                 RETURNING "id"`,
                [owner.firstName, owner.lastName, owner.gender, owner.contact, passwordHash],
            );
            ownerIds.push(row.id);
        }
    // 2) give the orphan listings to the demo owners, one after the other,
    //    and write the owner's real name on the listing
    const orphans: { id: number }[] = await queryRunner.query(
        `SELECT "id" FROM "listing"
        WHERE "ownerId" NOT IN (SELECT "id" FROM "user")
        ORDER BY "id"`,
    );

    for (const [index, listing] of orphans.entries()) {
        const owner = DEMO_OWNERS[index % DEMO_OWNERS.length];
        const ownerId = ownerIds[index % ownerIds.length];

        await queryRunner.query(
            `UPDATE "listing" SET "ownerId" = $1, "ownerName" = $2 WHERE "id" = $3`,
            [ownerId, `${owner.firstName} ${owner.lastName}`, listing.id],
        );
    }

        // 4) now every listing has a real owner, so the database can enforce it
        await queryRunner.query(
            `ALTER TABLE "listing" ADD CONSTRAINT "FK_listing_owner"
            FOREIGN KEY ("ownerId") REFERENCES "user"("id") ON DELETE CASCADE`,
        );

    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "listing" DROP CONSTRAINT "FK_listing_owner"`);

    }
}

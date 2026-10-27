import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateListing1791893269202 implements MigrationInterface {
    name = 'CreateListing1791893269202'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "listing" ("id" SERIAL NOT NULL, "ownerId" integer NOT NULL, "cityAr" character varying NOT NULL, "cityFr" character varying NOT NULL, "cityEn" character varying NOT NULL, "titleAr" character varying NOT NULL, "titleFr" character varying NOT NULL, "titleEn" character varying NOT NULL, "descriptionAr" text NOT NULL, "descriptionFr" text NOT NULL, "descriptionEn" text NOT NULL, "district" character varying NOT NULL, "districtEnFr" character varying NOT NULL, "price" integer NOT NULL, "bedrooms" integer NOT NULL, "hasWifi" boolean NOT NULL DEFAULT false, "imageUrl" character varying NOT NULL, "images" text, "video" character varying, "ownerName" character varying NOT NULL, "lat" double precision NOT NULL, "lng" double precision NOT NULL, "type" character varying NOT NULL, CONSTRAINT "PK_381d45ebb8692362c156d6b87d7" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "listing"`);
    }

}

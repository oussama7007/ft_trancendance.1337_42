import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateRoommatePost1792700000000 implements MigrationInterface {
  name = 'CreateRoommatePost1792700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "roommate_post" (
        "id" SERIAL NOT NULL,
        "listingId" integer NOT NULL,
        "monthlyShare" integer NOT NULL,
        "peopleWanted" integer NOT NULL,
        "genderPreference" character varying NOT NULL DEFAULT 'any',
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_roommate_post_listing" UNIQUE ("listingId"),
        CONSTRAINT "PK_roommate_post" PRIMARY KEY ("id"),
        CONSTRAINT "FK_roommate_post_listing" FOREIGN KEY ("listingId") REFERENCES "listing"("id") ON DELETE CASCADE
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "roommate_post"`);
  }
}

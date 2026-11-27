import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateListingViews1795500000000 implements MigrationInterface {
  name = 'CreateListingViews1795500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE "listing_views" (
      "id" SERIAL NOT NULL,
      "listingId" integer NOT NULL,
      "viewerId" integer NOT NULL,
      "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
      CONSTRAINT "PK_listing_views" PRIMARY KEY ("id"),
      CONSTRAINT "FK_listing_views_listing" FOREIGN KEY ("listingId") REFERENCES "listing"("id") ON DELETE CASCADE,
      CONSTRAINT "FK_listing_views_viewer" FOREIGN KEY ("viewerId") REFERENCES "user"("id") ON DELETE CASCADE
    )`);
    await queryRunner.query(
      `CREATE INDEX "IDX_listing_views_listing_created" ON "listing_views" ("listingId", "createdAt")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_listing_views_listing_created"`);
    await queryRunner.query(`DROP TABLE "listing_views"`);
  }
}

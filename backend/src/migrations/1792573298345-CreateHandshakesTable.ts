import { MigrationInterface, QueryRunner } from 'typeorm';

// Creates the `handshakes` table. TypeORM's synchronize is turned off in this
// project, so every table change has to go through a migration.
//
// Run it from backend/ (the connection comes from backend/.env):
//   npx typeorm-ts-node-commonjs migration:run -d src/data-source.ts
//   npx typeorm-ts-node-commonjs migration:revert -d src/data-source.ts
//
// Never edit a migration that has already been shared, write a new one.
export class CreateHandshakesTable1792573298345 implements MigrationInterface {
  name = 'CreateHandshakesTable1792573298345';

  // Creates the table. The unique rule must keep the same name as the @Unique
  // in handshake.entity.ts. The check is a safety net: the database itself
  // refuses a handshake between a user and themselves.
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "handshakes" (
        "id" SERIAL NOT NULL,
        "listing_id" integer NOT NULL,
        "owner_id" integer NOT NULL,
        "client_id" integer NOT NULL,
        "owner_approved" boolean NOT NULL DEFAULT false,
        "client_approved" boolean NOT NULL DEFAULT false,
        "confirmed_at" TIMESTAMPTZ,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_handshakes_id" PRIMARY KEY ("id"),
        CONSTRAINT "unique_handshake" UNIQUE ("listing_id", "client_id"),
        CONSTRAINT "CHK_handshake_different_users" CHECK ("owner_id" <> "client_id")
      )
    `);
  }

  // Undoes `up`. Used by migration:revert.
  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "handshakes"`);
  }
}

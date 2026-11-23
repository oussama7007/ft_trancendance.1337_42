import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateHandshakesTable1792573298345 implements MigrationInterface {
  name = 'CreateHandshakesTable1792573298345';

  // creates the handshakes table
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

  // drops the table
  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "handshakes"`);
  }
}

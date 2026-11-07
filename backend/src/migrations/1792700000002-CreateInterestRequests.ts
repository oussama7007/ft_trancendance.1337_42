import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateInterestRequests1792700000002 implements MigrationInterface {
  name = 'CreateInterestRequests1792700000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."interest_requests_status_enum" AS ENUM('PENDING', 'ACCEPTED', 'REJECTED')`,
    );
    await queryRunner.query(`
      CREATE TABLE "interest_requests" (
        "id" SERIAL NOT NULL,
        "tenantId" integer NOT NULL,
        "ownerId" integer NOT NULL,
        "listingId" integer NOT NULL,
        "status" "public"."interest_requests_status_enum" NOT NULL DEFAULT 'PENDING',
        "conversationId" integer,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_interest_requests" PRIMARY KEY ("id")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "interest_requests"`);
    await queryRunner.query(`DROP TYPE "public"."interest_requests_status_enum"`);
  }
}

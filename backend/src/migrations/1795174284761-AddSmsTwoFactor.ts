import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSmsTwoFactor1795174284761 implements MigrationInterface {
    name = 'AddSmsTwoFactor1795174284761'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "login_challenge" ("id" SERIAL NOT NULL, "tokenHash" character varying(64) NOT NULL, "userId" integer NOT NULL, "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL, CONSTRAINT "UQ_a8473caca72f9b3d22cb920b03b" UNIQUE ("tokenHash"), CONSTRAINT "PK_179c2cb373394f4f74956209237" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "user" ADD "phoneNumber" character varying(20)`);
        await queryRunner.query(`ALTER TABLE "user" ADD CONSTRAINT "UQ_f2578043e491921209f5dadd080" UNIQUE ("phoneNumber")`);
        await queryRunner.query(`ALTER TABLE "user" ADD "phoneVerified" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "user" ADD "sms2faEnabled" boolean NOT NULL DEFAULT false`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "sms2faEnabled"`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "phoneVerified"`);
        await queryRunner.query(`ALTER TABLE "user" DROP CONSTRAINT "UQ_f2578043e491921209f5dadd080"`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "phoneNumber"`);
        await queryRunner.query(`DROP TABLE "login_challenge"`);
    }

}

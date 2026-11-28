import { MigrationInterface, QueryRunner } from "typeorm";

export class FixAuthChallenges1795320000000 implements MigrationInterface {
    name = 'FixAuthChallenges1795320000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "password_reset_token" ADD COLUMN IF NOT EXISTS "attempts" integer NOT NULL DEFAULT 0`);

        await queryRunner.query(`ALTER TABLE "registration_session" ADD "token" uuid NOT NULL DEFAULT gen_random_uuid()`);
        await queryRunner.query(`ALTER TABLE "registration_session" ADD CONSTRAINT "UQ_registration_session_token" UNIQUE ("token")`);

        await queryRunner.query(`ALTER TABLE "registration_session" ADD "verificationAttempts" integer NOT NULL DEFAULT 0`);

        await queryRunner.query(`UPDATE "registration_session" SET "verificationCode" = NULL, "verificationCodeExpiresAt" = NULL WHERE "isVerified" = false`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "registration_session" DROP COLUMN "verificationAttempts"`);
        await queryRunner.query(`ALTER TABLE "registration_session" DROP CONSTRAINT "UQ_registration_session_token"`);
        await queryRunner.query(`ALTER TABLE "registration_session" DROP COLUMN "token"`);
        await queryRunner.query(`ALTER TABLE "password_reset_token" DROP COLUMN IF EXISTS "attempts"`);
    }
}

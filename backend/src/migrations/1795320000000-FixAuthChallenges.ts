import { MigrationInterface, QueryRunner } from "typeorm";

export class FixAuthChallenges1795320000000 implements MigrationInterface {
    name = 'FixAuthChallenges1795320000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // The PasswordResetToken entity uses "attempts", but no earlier
        // migration created it, so every password reset query failed.
        await queryRunner.query(`ALTER TABLE "password_reset_token" ADD COLUMN IF NOT EXISTS "attempts" integer NOT NULL DEFAULT 0`);

        // Registration sessions were identified only by their sequential id,
        // which made it possible to guess another person's verified session.
        // A random token now identifies the session in every request.
        await queryRunner.query(`ALTER TABLE "registration_session" ADD "token" uuid NOT NULL DEFAULT gen_random_uuid()`);
        await queryRunner.query(`ALTER TABLE "registration_session" ADD CONSTRAINT "UQ_registration_session_token" UNIQUE ("token")`);

        // Limit wrong verification code attempts.
        await queryRunner.query(`ALTER TABLE "registration_session" ADD "verificationAttempts" integer NOT NULL DEFAULT 0`);

        // Verification codes are now stored hashed. Codes stored in plain text
        // before this migration can no longer be checked, so clear them.
        await queryRunner.query(`UPDATE "registration_session" SET "verificationCode" = NULL, "verificationCodeExpiresAt" = NULL WHERE "isVerified" = false`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "registration_session" DROP COLUMN "verificationAttempts"`);
        await queryRunner.query(`ALTER TABLE "registration_session" DROP CONSTRAINT "UQ_registration_session_token"`);
        await queryRunner.query(`ALTER TABLE "registration_session" DROP COLUMN "token"`);
        await queryRunner.query(`ALTER TABLE "password_reset_token" DROP COLUMN IF EXISTS "attempts"`);
    }
}

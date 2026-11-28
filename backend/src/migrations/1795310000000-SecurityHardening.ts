import { MigrationInterface, QueryRunner } from "typeorm";

export class SecurityHardening1795310000000 implements MigrationInterface {
    name = 'SecurityHardening1795310000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create separate totp_login_challenge table for login challenges
        // This keeps login challenges separate from enrollment challenges,
        // avoiding confusion and making the security model clearer.
        await queryRunner.query(`CREATE TABLE "totp_login_challenge" (
            "id" SERIAL NOT NULL,
            "userId" integer NOT NULL,
            "tokenHash" character varying(64) NOT NULL,
            "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL,
            "attempts" integer NOT NULL DEFAULT 0,
            CONSTRAINT "UQ_totp_login_challenge_tokenHash" UNIQUE ("tokenHash"),
            CONSTRAINT "PK_totp_login_challenge" PRIMARY KEY ("id")
        )`);

        await queryRunner.query(`ALTER TABLE "totp_login_challenge" ADD CONSTRAINT "FK_totp_login_challenge_user" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE`);

        // Add password_reset_grant column for single-use password reset authorization
        // Replaces the boolean 'used' flag with a cryptographically secure grant token
        await queryRunner.query(`ALTER TABLE "password_reset_token" ADD "grantHash" character varying(128)`);

        // Add session version for JWT revocation support
        await queryRunner.query(`ALTER TABLE "user" ADD "sessionVersion" integer NOT NULL DEFAULT 0`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "sessionVersion"`);
        await queryRunner.query(`ALTER TABLE "password_reset_token" DROP COLUMN "grantHash"`);
        await queryRunner.query(`ALTER TABLE "totp_login_challenge" DROP CONSTRAINT "FK_totp_login_challenge_user"`);
        await queryRunner.query(`DROP TABLE "totp_login_challenge"`);
    }
}

import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTotpTwoFactor1795300000000 implements MigrationInterface {
    name = 'AddTotpTwoFactor1795300000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add TOTP columns to user table
        await queryRunner.query(`ALTER TABLE "user" ADD "totpEnabled" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "user" ADD "totpSecretEncrypted" text`);
        await queryRunner.query(`ALTER TABLE "user" ADD "totpLastUsedStep" character varying`);

        // Create totp_enrollment table (for pending enrollment and login challenges)
        await queryRunner.query(`CREATE TABLE "totp_enrollment" (
            "id" SERIAL NOT NULL,
            "userId" integer NOT NULL,
            "secretEncrypted" text NOT NULL,
            "tokenHash" character varying(64) NOT NULL,
            "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL,
            "attempts" integer NOT NULL DEFAULT 0,
            CONSTRAINT "UQ_5f1e4a3c2b9d8f7a1e6d3c4b5a6f7e8d" UNIQUE ("tokenHash"),
            CONSTRAINT "PK_totp_enrollment" PRIMARY KEY ("id")
        )`);

        // Create totp_recovery_codes table
        await queryRunner.query(`CREATE TABLE "totp_recovery_codes" (
            "id" SERIAL NOT NULL,
            "userId" integer NOT NULL,
            "codeHash" character varying(128) NOT NULL,
            "used" boolean NOT NULL DEFAULT false,
            "usedAt" TIMESTAMP WITH TIME ZONE,
            CONSTRAINT "PK_totp_recovery_codes" PRIMARY KEY ("id")
        )`);

        // Add foreign key constraints
        await queryRunner.query(`ALTER TABLE "totp_enrollment" ADD CONSTRAINT "FK_totp_enrollment_user" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE`);
        await queryRunner.query(`ALTER TABLE "totp_recovery_codes" ADD CONSTRAINT "FK_totp_recovery_codes_user" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "totp_recovery_codes" DROP CONSTRAINT "FK_totp_recovery_codes_user"`);
        await queryRunner.query(`ALTER TABLE "totp_enrollment" DROP CONSTRAINT "FK_totp_enrollment_user"`);
        await queryRunner.query(`DROP TABLE "totp_recovery_codes"`);
        await queryRunner.query(`DROP TABLE "totp_enrollment"`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "totpLastUsedStep"`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "totpSecretEncrypted"`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "totpEnabled"`);
    }

}

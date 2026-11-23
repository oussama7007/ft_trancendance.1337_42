import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateEmailChangeChallenge1795200000000 implements MigrationInterface {
    name = 'CreateEmailChangeChallenge1795200000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "email_change_challenge" (
                "id" SERIAL NOT NULL,
                "userId" integer NOT NULL,
                "pendingEmail" character varying NOT NULL,
                "codeHash" character varying(64) NOT NULL,
                "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL,
                "attempts" integer NOT NULL DEFAULT 0,
                CONSTRAINT "UQ_email_change_challenge_user" UNIQUE ("userId"),
                CONSTRAINT "PK_email_change_challenge" PRIMARY KEY ("id")
            )
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "email_change_challenge"`);
    }
}

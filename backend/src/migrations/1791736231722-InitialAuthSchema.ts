import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialAuthSchema1791736231722 implements MigrationInterface {
    name = 'InitialAuthSchema1791736231722'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "registration_session" ("id" SERIAL NOT NULL, "firstName" character varying NOT NULL, "lastName" character varying NOT NULL, "dateOfBirth" character varying NOT NULL, "gender" character varying NOT NULL, "cin" character varying, "contact" character varying, "verificationCode" character varying, "verificationCodeExpiresAt" TIMESTAMP, "isVerified" boolean NOT NULL DEFAULT false, CONSTRAINT "PK_faed2fd56327e038efcb3b53150" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "user" ("id" SERIAL NOT NULL, "firstName" character varying NOT NULL, "lastName" character varying NOT NULL, "dateOfBirth" character varying NOT NULL, "gender" character varying NOT NULL, "cin" character varying, "contact" character varying NOT NULL, "passwordHash" character varying NOT NULL, CONSTRAINT "UQ_dd2bcd064eb3b10ad6cd4fcbbb1" UNIQUE ("contact"), CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "user"`);
        await queryRunner.query(`DROP TABLE "registration_session"`);
    }

}

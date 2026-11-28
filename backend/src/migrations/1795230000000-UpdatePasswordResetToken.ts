import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class UpdatePasswordResetToken1795230000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS "password_reset_challenge"`);

        await queryRunner.createTable(
            new Table({
                name: 'password_reset_token',
                columns: [
                    {
                        name: 'id',
                        type: 'integer',
                        isPrimary: true,
                        isGenerated: true,
                        generationStrategy: 'increment',
                    },
                    {
                        name: 'userId',
                        type: 'integer',
                        isUnique: true,
                    },
                    {
                        name: 'tokenHash',
                        type: 'varchar',
                        length: '128',
                    },
                    {
                        name: 'expiresAt',
                        type: 'timestamptz',
                    },
                    {
                        name: 'used',
                        type: 'boolean',
                        default: false,
                    },
                    {
                        name: 'createdAt',
                        type: 'timestamptz',
                        default: 'CURRENT_TIMESTAMP',
                    },
                ],
            }),
        );

        await queryRunner.query(
            `CREATE INDEX "IDX_password_reset_token_hash" ON "password_reset_token" ("tokenHash")`,
        );

        await queryRunner.query(
            `CREATE INDEX "IDX_password_reset_token_expires" ON "password_reset_token" ("expiresAt")`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable('password_reset_token');
    }
}

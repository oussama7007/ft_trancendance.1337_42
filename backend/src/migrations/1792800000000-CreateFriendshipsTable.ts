import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateFriendshipsTable1792800000000 implements MigrationInterface {
  name = 'CreateFriendshipsTable1792800000000';

  // creates the friendships table and its indexes
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "friendships" (
        "id" SERIAL NOT NULL,
        "requester_id" integer NOT NULL,
        "addressee_id" integer NOT NULL,
        "status" varchar(10) NOT NULL DEFAULT 'pending',
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_friendships_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_friendships_requester" FOREIGN KEY ("requester_id")
          REFERENCES "user"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_friendships_addressee" FOREIGN KEY ("addressee_id")
          REFERENCES "user"("id") ON DELETE CASCADE,
        CONSTRAINT "CHK_friendship_not_self" CHECK ("requester_id" <> "addressee_id"),
        CONSTRAINT "CHK_friendship_status" CHECK ("status" IN ('pending', 'accepted'))
      )
    `);

    // only one row per pair no matter who sent the request
    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_friendships_pair"
        ON "friendships" (LEAST("requester_id", "addressee_id"), GREATEST("requester_id", "addressee_id"))
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_friendships_addressee" ON "friendships" ("addressee_id")
    `);
  }

  // drops the table
  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "friendships"`);
  }
}

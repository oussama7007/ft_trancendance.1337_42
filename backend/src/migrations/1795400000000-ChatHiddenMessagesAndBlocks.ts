import { MigrationInterface, QueryRunner } from 'typeorm';

export class ChatHiddenMessagesAndBlocks1795400000000 implements MigrationInterface {
  name = 'ChatHiddenMessagesAndBlocks1795400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE "hidden_messages" (
      "message_id" integer NOT NULL,
      "user_id" integer NOT NULL,
      "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
      CONSTRAINT "PK_hidden_messages" PRIMARY KEY ("message_id", "user_id"),
      CONSTRAINT "FK_hidden_messages_message" FOREIGN KEY ("message_id") REFERENCES "messages"("id") ON DELETE CASCADE,
      CONSTRAINT "FK_hidden_messages_user" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE
    )`);
    await queryRunner.query(`CREATE INDEX "IDX_hidden_messages_user" ON "hidden_messages" ("user_id")`);

    await queryRunner.query(`CREATE TABLE "user_blocks" (
      "blocker_id" integer NOT NULL,
      "blocked_id" integer NOT NULL,
      "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
      CONSTRAINT "PK_user_blocks" PRIMARY KEY ("blocker_id", "blocked_id"),
      CONSTRAINT "CHK_user_blocks_different_users" CHECK ("blocker_id" <> "blocked_id"),
      CONSTRAINT "FK_user_blocks_blocker" FOREIGN KEY ("blocker_id") REFERENCES "user"("id") ON DELETE CASCADE,
      CONSTRAINT "FK_user_blocks_blocked" FOREIGN KEY ("blocked_id") REFERENCES "user"("id") ON DELETE CASCADE
    )`);
    await queryRunner.query(`CREATE INDEX "IDX_user_blocks_blocked" ON "user_blocks" ("blocked_id")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_user_blocks_blocked"`);
    await queryRunner.query(`DROP TABLE "user_blocks"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_hidden_messages_user"`);
    await queryRunner.query(`DROP TABLE "hidden_messages"`);
  }
}

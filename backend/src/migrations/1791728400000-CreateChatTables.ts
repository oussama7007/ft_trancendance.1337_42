import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateChatTables1791728400000 implements MigrationInterface {
    name = 'CreateChatTables1791728400000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`       CREATE TABLE "conversations" (
        "id" SERIAL NOT NULL,
        "participant_one_id" integer NOT NULL,
        "participant_two_id" integer NOT NULL,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "CHK_conversation_different_participants"
          CHECK ("participant_one_id" <> "participant_two_id"),
        CONSTRAINT "PK_conversations_id" PRIMARY KEY ("id")
      )
    `);

        await queryRunner.query(`
  CREATE TABLE "messages" (
    "id" SERIAL NOT NULL,
    "conversation_id" integer NOT NULL,
    "sender_id" integer NOT NULL,
    "content" text NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT "PK_messages_id" PRIMARY KEY ("id"),
    CONSTRAINT "FK_messages_conversation"
      FOREIGN KEY ("conversation_id")
      REFERENCES "conversations"("id")
      ON DELETE CASCADE
  )
`);

        await queryRunner.query(`
  CREATE INDEX "IDX_messages_conversation_id"
  ON "messages" ("conversation_id")
`);

    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`       DROP INDEX "IDX_messages_conversation_id"
    `);

        await queryRunner.query(`DROP TABLE "messages"`);
        await queryRunner.query(`DROP TABLE "conversations"`);

    }
}

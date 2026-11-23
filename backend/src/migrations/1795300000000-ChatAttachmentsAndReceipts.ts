import { MigrationInterface, QueryRunner } from 'typeorm';

export class ChatAttachmentsAndReceipts1795300000000 implements MigrationInterface {
  name = 'ChatAttachmentsAndReceipts1795300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "messages" ALTER COLUMN "content" SET DEFAULT ''`);
    await queryRunner.query(`ALTER TABLE "messages" ADD "type" character varying(10) NOT NULL DEFAULT 'text'`);
    await queryRunner.query(`ALTER TABLE "messages" ADD "attachment_path" character varying(255)`);
    await queryRunner.query(`ALTER TABLE "messages" ADD "attachment_name" character varying(255)`);
    await queryRunner.query(`ALTER TABLE "messages" ADD "attachment_mime" character varying(120)`);
    await queryRunner.query(`ALTER TABLE "messages" ADD "attachment_size" integer`);
    await queryRunner.query(`ALTER TABLE "messages" ADD "audio_duration" integer`);
    await queryRunner.query(`ALTER TABLE "messages" ADD "read_at" TIMESTAMP WITH TIME ZONE`);
    await queryRunner.query(`ALTER TABLE "messages" ADD "deleted_at" TIMESTAMP WITH TIME ZONE`);

    await queryRunner.query(`UPDATE "messages" SET "content" = left("content", 4000) WHERE char_length("content") > 4000`);
    await queryRunner.query(`ALTER TABLE "messages" ADD CONSTRAINT "CHK_messages_type" CHECK ("type" IN ('text', 'image', 'audio', 'file'))`);
    await queryRunner.query(`ALTER TABLE "messages" ADD CONSTRAINT "CHK_messages_content_length" CHECK (char_length("content") <= 4000)`);

    await queryRunner.query(`UPDATE "messages" SET "read_at" = "created_at" WHERE "read_at" IS NULL`);

    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_messages_conversation_id_id" ON "messages" ("conversation_id", "id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_messages_unread" ON "messages" ("conversation_id", "sender_id") WHERE "read_at" IS NULL AND "deleted_at" IS NULL`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_messages_sender_attachment" ON "messages" ("sender_id") WHERE "attachment_size" IS NOT NULL`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_conversations_participant_one" ON "conversations" ("participant_one_id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_conversations_participant_two" ON "conversations" ("participant_two_id")`);

    await queryRunner.query(`ALTER TABLE "conversations" DROP CONSTRAINT IF EXISTS "CHK_conversation_different_participants"`);
    await queryRunner.query(`ALTER TABLE "conversations" ADD CONSTRAINT "CHK_conversation_different_participants" CHECK ("participant_one_id" <> "participant_two_id")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_conversations_participant_two"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_conversations_participant_one"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_messages_sender_attachment"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_messages_unread"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_messages_conversation_id_id"`);
    await queryRunner.query(`ALTER TABLE "messages" DROP CONSTRAINT "CHK_messages_content_length"`);
    await queryRunner.query(`ALTER TABLE "messages" DROP CONSTRAINT "CHK_messages_type"`);
    await queryRunner.query(`ALTER TABLE "messages" DROP COLUMN "deleted_at"`);
    await queryRunner.query(`ALTER TABLE "messages" DROP COLUMN "read_at"`);
    await queryRunner.query(`ALTER TABLE "messages" DROP COLUMN "audio_duration"`);
    await queryRunner.query(`ALTER TABLE "messages" DROP COLUMN "attachment_size"`);
    await queryRunner.query(`ALTER TABLE "messages" DROP COLUMN "attachment_mime"`);
    await queryRunner.query(`ALTER TABLE "messages" DROP COLUMN "attachment_name"`);
    await queryRunner.query(`ALTER TABLE "messages" DROP COLUMN "attachment_path"`);
    await queryRunner.query(`ALTER TABLE "messages" DROP COLUMN "type"`);
    await queryRunner.query(`ALTER TABLE "messages" ALTER COLUMN "content" DROP DEFAULT`);
  }
}

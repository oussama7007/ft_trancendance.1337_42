import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUserSettingsFields1795144126730 implements MigrationInterface {
    name = 'AddUserSettingsFields1795144126730'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "reviews" DROP CONSTRAINT "FK_reviews_handshake"`);
        await queryRunner.query(`ALTER TABLE "reviews" DROP CONSTRAINT "FK_reviews_reviewer"`);
        await queryRunner.query(`ALTER TABLE "reviews" DROP CONSTRAINT "FK_reviews_reviewed"`);
        await queryRunner.query(`ALTER TABLE "messages" DROP CONSTRAINT "FK_messages_conversation"`);
        await queryRunner.query(`ALTER TABLE "roommate_post" DROP CONSTRAINT "FK_roommate_post_listing"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_reviews_reviewed_id"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_messages_conversation_id"`);
        await queryRunner.query(`ALTER TABLE "handshakes" DROP CONSTRAINT "CHK_handshake_different_users"`);
        await queryRunner.query(`ALTER TABLE "reviews" DROP CONSTRAINT "CHK_review_rating"`);
        await queryRunner.query(`ALTER TABLE "reviews" DROP CONSTRAINT "CHK_review_role"`);
        await queryRunner.query(`ALTER TABLE "reviews" DROP CONSTRAINT "CHK_review_comment_length"`);
        await queryRunner.query(`ALTER TABLE "reviews" DROP CONSTRAINT "CHK_review_different_users"`);
        await queryRunner.query(`ALTER TABLE "conversations" DROP CONSTRAINT "CHK_conversation_different_participants"`);
        await queryRunner.query(`ALTER TABLE "user" ADD "bio" text`);
        await queryRunner.query(`ALTER TABLE "user" ADD "avatarUrl" character varying`);
        await queryRunner.query(`ALTER TABLE "user" ADD "linkedin" character varying`);
        await queryRunner.query(`ALTER TABLE "user" ADD "instagram" character varying`);
        await queryRunner.query(`ALTER TABLE "user" ADD "facebook" character varying`);
        await queryRunner.query(`ALTER TABLE "user" ADD "googleId" character varying`);
        await queryRunner.query(`ALTER TABLE "user" ADD CONSTRAINT "UQ_470355432cc67b2c470c30bef7c" UNIQUE ("googleId")`);
        await queryRunner.query(`ALTER TABLE "user" ADD "googleEmail" character varying`);
        await queryRunner.query(`ALTER TABLE "roommate_post" ALTER COLUMN "listingId" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "handshakes" ADD CONSTRAINT "FK_0a83a21f02bd25becb2bebab5f0" FOREIGN KEY ("listing_id") REFERENCES "listing"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "reviews" ADD CONSTRAINT "FK_92e950a2513a79bb3fab273c92e" FOREIGN KEY ("reviewer_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "reviews" ADD CONSTRAINT "FK_1123bdcd1a413af360b73464d4a" FOREIGN KEY ("handshake_id") REFERENCES "handshakes"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "messages" ADD CONSTRAINT "FK_3bc55a7c3f9ed54b520bb5cfe23" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "roommate_post" ADD CONSTRAINT "FK_b4067e1c9eff37e7e8aeb32def5" FOREIGN KEY ("listingId") REFERENCES "listing"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "roommate_post" DROP CONSTRAINT "FK_b4067e1c9eff37e7e8aeb32def5"`);
        await queryRunner.query(`ALTER TABLE "messages" DROP CONSTRAINT "FK_3bc55a7c3f9ed54b520bb5cfe23"`);
        await queryRunner.query(`ALTER TABLE "reviews" DROP CONSTRAINT "FK_1123bdcd1a413af360b73464d4a"`);
        await queryRunner.query(`ALTER TABLE "reviews" DROP CONSTRAINT "FK_92e950a2513a79bb3fab273c92e"`);
        await queryRunner.query(`ALTER TABLE "handshakes" DROP CONSTRAINT "FK_0a83a21f02bd25becb2bebab5f0"`);
        await queryRunner.query(`ALTER TABLE "roommate_post" ALTER COLUMN "listingId" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "googleEmail"`);
        await queryRunner.query(`ALTER TABLE "user" DROP CONSTRAINT "UQ_470355432cc67b2c470c30bef7c"`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "googleId"`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "facebook"`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "instagram"`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "linkedin"`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "avatarUrl"`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "bio"`);
        await queryRunner.query(`ALTER TABLE "conversations" ADD CONSTRAINT "CHK_conversation_different_participants" CHECK ((participant_one_id <> participant_two_id))`);
        await queryRunner.query(`ALTER TABLE "reviews" ADD CONSTRAINT "CHK_review_different_users" CHECK ((reviewer_id <> reviewed_id))`);
        await queryRunner.query(`ALTER TABLE "reviews" ADD CONSTRAINT "CHK_review_comment_length" CHECK ((char_length(comment) <= 500))`);
        await queryRunner.query(`ALTER TABLE "reviews" ADD CONSTRAINT "CHK_review_role" CHECK (((role)::text = ANY ((ARRAY['owner'::character varying, 'roommate'::character varying])::text[])))`);
        await queryRunner.query(`ALTER TABLE "reviews" ADD CONSTRAINT "CHK_review_rating" CHECK (((rating >= 1) AND (rating <= 5)))`);
        await queryRunner.query(`ALTER TABLE "handshakes" ADD CONSTRAINT "CHK_handshake_different_users" CHECK ((owner_id <> client_id))`);
        await queryRunner.query(`CREATE INDEX "IDX_messages_conversation_id" ON "messages" USING btree ("conversation_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_reviews_reviewed_id" ON "reviews" USING btree ("reviewed_id") `);
        await queryRunner.query(`ALTER TABLE "roommate_post" ADD CONSTRAINT "FK_roommate_post_listing" FOREIGN KEY ("listingId") REFERENCES "listing"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "messages" ADD CONSTRAINT "FK_messages_conversation" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "reviews" ADD CONSTRAINT "FK_reviews_reviewed" FOREIGN KEY ("reviewed_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "reviews" ADD CONSTRAINT "FK_reviews_reviewer" FOREIGN KEY ("reviewer_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "reviews" ADD CONSTRAINT "FK_reviews_handshake" FOREIGN KEY ("handshake_id") REFERENCES "handshakes"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}

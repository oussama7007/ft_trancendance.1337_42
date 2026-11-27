import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateReviewsTables1792600000000 implements MigrationInterface
{
    name = 'CreateReviewsTables1792600000000';

    // creates the reviews table
    public async up(queryRunner: QueryRunner): Promise<void>
    {
        await queryRunner.query(`
            CREATE TABLE "reviews" (
                "id" SERIAL NOT NULL,
                "handshake_id" integer NOT NULL,
                "reviewer_id" integer NOT NULL,
                "reviewed_id" integer NOT NULL,
                "role" varchar(10) NOT NULL,
                "rating" smallint NOT NULL,
                "comment" text NOT NULL,
                "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),

                CONSTRAINT "PK_reviews_id" PRIMARY KEY ("id"),

                CONSTRAINT "unique_review_per_handshake" UNIQUE ("handshake_id", "reviewer_id"),

                CONSTRAINT "CHK_review_rating" CHECK ("rating" BETWEEN 1 AND 5),
                CONSTRAINT "CHK_review_role" CHECK ("role" IN ('owner', 'roommate')),
                CONSTRAINT "CHK_review_comment_length" CHECK (char_length("comment") <= 500),
                CONSTRAINT "CHK_review_different_users" CHECK ("reviewer_id" <> "reviewed_id"),

                CONSTRAINT "FK_reviews_handshake" FOREIGN KEY ("handshake_id")
                    REFERENCES "handshakes" ("id") ON DELETE CASCADE,
                CONSTRAINT "FK_reviews_reviewer" FOREIGN KEY ("reviewer_id")
                    REFERENCES "user" ("id") ON DELETE CASCADE,
                CONSTRAINT "FK_reviews_reviewed" FOREIGN KEY ("reviewed_id")
                    REFERENCES "user" ("id") ON DELETE CASCADE
            )
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_reviews_reviewed_id" ON "reviews" ("reviewed_id")
        `);
    }

    // drops the table
    public async down(queryRunner: QueryRunner): Promise<void>
    {
        await queryRunner.query(`DROP TABLE "reviews"`);
    }
}

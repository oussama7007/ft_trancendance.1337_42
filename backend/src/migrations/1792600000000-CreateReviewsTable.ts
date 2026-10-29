import { MigrationInterface, QueryRunner } from 'typeorm';

// Creates the `reviews` table. One row = one review written about a user.
// The rules live in the table itself, so the database refuses bad data even
// if our code has a bug.
//
// Never edit a migration that has already been shared, write a new one.
export class CreateReviewsTables1792600000000 implements MigrationInterface
{
    name = 'CreateReviewsTables1792600000000';

    // Builds the table, then the index.
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

                -- One review per person for each handshake.
                CONSTRAINT "unique_review_per_handshake" UNIQUE ("handshake_id", "reviewer_id"),

                -- Stars go from 1 to 5, the role is one of two words,
                -- the text fits the popup counter (0 / 500),
                -- and nobody reviews themselves.
                CONSTRAINT "CHK_review_rating" CHECK ("rating" BETWEEN 1 AND 5),
                CONSTRAINT "CHK_review_role" CHECK ("role" IN ('owner', 'roommate')),
                CONSTRAINT "CHK_review_comment_length" CHECK (char_length("comment") <= 500),
                CONSTRAINT "CHK_review_different_users" CHECK ("reviewer_id" <> "reviewed_id"),

                -- Each id must exist in the other table. CASCADE: when the
                -- handshake or the user is deleted, their reviews go with it.
                CONSTRAINT "FK_reviews_handshake" FOREIGN KEY ("handshake_id")
                    REFERENCES "handshakes" ("id") ON DELETE CASCADE,
                CONSTRAINT "FK_reviews_reviewer" FOREIGN KEY ("reviewer_id")
                    REFERENCES "user" ("id") ON DELETE CASCADE,
                CONSTRAINT "FK_reviews_reviewed" FOREIGN KEY ("reviewed_id")
                    REFERENCES "user" ("id") ON DELETE CASCADE
            )
        `);

        // The profile page always asks "all reviews of user X". The index
        // makes that search fast, like a sorted phone book.
        await queryRunner.query(`
            CREATE INDEX "IDX_reviews_reviewed_id" ON "reviews" ("reviewed_id")
        `);
    }

    // Undoes `up`. Dropping the table drops its index too.
    public async down(queryRunner: QueryRunner): Promise<void>
    {
        await queryRunner.query(`DROP TABLE "reviews"`);
    }
}

import { MigrationInterface, QueryRunner } from 'typeorm';

// Creates the `friendships` table. TypeORM's synchronize is turned off in this
// project, so every table change has to go through a migration. It runs on its
// own when the backend container starts (npm run migration:run).
//
// One row = one link between two users:
//   no row               -> strangers
//   status = 'pending'   -> requester asked, addressee has not answered yet
//   status = 'accepted'  -> friends
// Rejecting, cancelling and removing all DELETE the row, so the two users
// become strangers again and can start over.
//
// Never edit a migration that has already been shared, write a new one.
export class CreateFriendshipsTable1792800000000 implements MigrationInterface {
  name = 'CreateFriendshipsTable1792800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // The rules live in the database too, so even a bug in our code (or two
    // clicks arriving at the same millisecond) cannot store bad data:
    //   - FK ... ON DELETE CASCADE: both ids must be real users, and when a
    //     user is deleted their friendships disappear with them.
    //   - CHK_friendship_not_self: nobody can befriend themselves.
    //   - CHK_friendship_status: only the two statuses we know about.
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

    // One row per PAIR, whatever the direction. LEAST/GREATEST turn both
    // (4 -> 9) and (9 -> 4) into (4, 9), so if Sara already asked Youssef,
    // Youssef cannot insert a second row asking Sara. This blocks duplicate
    // requests and "friends twice".
    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_friendships_pair"
        ON "friendships" (LEAST("requester_id", "addressee_id"), GREATEST("requester_id", "addressee_id"))
    `);

    // Makes "show me the requests I received" fast. Lookups by requester are
    // already covered by the start of the pair index for most rows.
    await queryRunner.query(`
      CREATE INDEX "IDX_friendships_addressee" ON "friendships" ("addressee_id")
    `);
  }

  // Undoes `up`. Used by migration:revert. Dropping the table drops its indexes.
  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "friendships"`);
  }
}

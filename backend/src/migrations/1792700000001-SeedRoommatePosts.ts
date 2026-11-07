import { MigrationInterface, QueryRunner } from 'typeorm';

const SAMPLE_POSTS = [
  { titleEn: 'Beautiful apartment in Agdal', monthlyShare: 1200, peopleWanted: 2, genderPreference: 'male' },
  { titleEn: 'Modern studio in central Casablanca', monthlyShare: 1600, peopleWanted: 1, genderPreference: 'female' },
  { titleEn: 'Spacious apartment near the university', monthlyShare: 700, peopleWanted: 2, genderPreference: 'any' },
];

export class SeedRoommatePosts1792700000001 implements MigrationInterface {
  name = 'SeedRoommatePosts1792700000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const post of SAMPLE_POSTS) {
      await queryRunner.query(
        `INSERT INTO "roommate_post" ("listingId", "monthlyShare", "peopleWanted", "genderPreference")
         SELECT "id", $2, $3, $4 FROM "listing" WHERE "titleEn" = $1`,
        [post.titleEn, post.monthlyShare, post.peopleWanted, post.genderPreference],
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM "roommate_post"`);
  }
}


import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateSeedListingCoordinates1794250292721
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      WITH seeded AS (
        SELECT
          id,
          ROW_NUMBER() OVER (
            PARTITION BY "cityEn"
            ORDER BY id
          ) - 1 AS idx,
          "lat" - (
            (ROW_NUMBER() OVER (
              PARTITION BY "cityEn"
              ORDER BY id
            ) - 1) * 0.001
          ) AS base_lat,
          "lng" - (
            (ROW_NUMBER() OVER (
              PARTITION BY "cityEn"
              ORDER BY id
            ) - 1) * 0.001
          ) AS base_lng
        FROM "listing"
        WHERE "ownerId" BETWEEN 201 AND 250
          AND "titleEn" LIKE 'Beautiful property in % number %'
      ),
      offsets(idx, lat_offset, lng_offset) AS (
        VALUES
          (0,  0.000,  0.000),
          (1,  0.004,  0.003),
          (2, -0.003,  0.005),
          (3,  0.006, -0.004),
          (4, -0.005, -0.003)
      )
      UPDATE "listing" AS l
      SET
        "lat" = seeded.base_lat + offsets.lat_offset,
        "lng" = seeded.base_lng + offsets.lng_offset
      FROM seeded
      JOIN offsets ON offsets.idx = seeded.idx
      WHERE l.id = seeded.id;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      WITH seeded AS (
        SELECT
          id,
          ROW_NUMBER() OVER (
            PARTITION BY "cityEn"
            ORDER BY id
          ) - 1 AS idx
        FROM "listing"
        WHERE "ownerId" BETWEEN 201 AND 250
          AND "titleEn" LIKE 'Beautiful property in % number %'
      ),
      offsets(idx, lat_offset, lng_offset) AS (
        VALUES
          (0,  0.000,  0.000),
          (1,  0.004,  0.003),
          (2, -0.003,  0.005),
          (3,  0.006, -0.004),
          (4, -0.005, -0.003)
      )
      UPDATE "listing" AS l
      SET
        "lat" = l."lat" - offsets.lat_offset + seeded.idx * 0.001,
        "lng" = l."lng" - offsets.lng_offset + seeded.idx * 0.001
      FROM seeded
      JOIN offsets ON offsets.idx = seeded.idx
      WHERE l.id = seeded.id;
    `);
  }
}

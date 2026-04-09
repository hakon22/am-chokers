import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSiteVersionToImage1775194810197 implements MigrationInterface {
  public name = 'AddSiteVersionToImage1775194810197';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "chokers"."image" ADD COLUMN "site_version" SMALLINT NULL');
    await queryRunner.query('UPDATE "chokers"."image" SET "site_version" = 1 WHERE "cover_order" IS NOT NULL');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "chokers"."image" DROP COLUMN "site_version"');
  }
}

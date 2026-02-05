import { MigrationInterface, QueryRunner } from 'typeorm';

export class BannerTable1769000000000 implements MigrationInterface {
  public name = 'BannerTable1769000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "chokers"."banner"(
        "id" SERIAL PRIMARY KEY,
        "created" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
        "updated" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
        "deleted" TIMESTAMP WITHOUT TIME ZONE,
        "name" CHARACTER VARYING NOT NULL,
        "link" CHARACTER VARYING,
        "copy_value" CHARACTER VARYING,
        "order" SMALLINT NOT NULL DEFAULT 0,
        "desktop_video_id" INTEGER NOT NULL,
        "mobile_video_id" INTEGER NOT NULL,
      CONSTRAINT "banner_desktop_video_id__fk"
        FOREIGN KEY ("desktop_video_id")
        REFERENCES "chokers"."image"("id")
          ON UPDATE CASCADE,
      CONSTRAINT "banner_mobile_video_id__fk"
        FOREIGN KEY ("mobile_video_id")
        REFERENCES "chokers"."image"("id")
          ON UPDATE CASCADE
    )`);
    await queryRunner.query('CREATE INDEX "banner__desktop_video_idx" ON "chokers"."banner" ("desktop_video_id")');
    await queryRunner.query('CREATE INDEX "banner__mobile_video_idx" ON "chokers"."banner" ("mobile_video_id")');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE "chokers"."banner"');
  }
}

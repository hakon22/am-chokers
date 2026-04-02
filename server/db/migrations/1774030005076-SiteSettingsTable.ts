import { MigrationInterface, QueryRunner } from 'typeorm';

export class SiteSettingsTable1774030005076 implements MigrationInterface {
  public name = 'SiteSettingsTable1774030005076';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "chokers"."site_settings" (
        "id" SERIAL PRIMARY KEY,
        "created" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
        "updated" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
        "key" CHARACTER VARYING NOT NULL,
        "value" CHARACTER VARYING NOT NULL,
        CONSTRAINT "site_settings_key__uq" UNIQUE ("key")
      )
    `);
    await queryRunner.query('INSERT INTO "chokers"."site_settings" ("key", "value") VALUES (\'siteVersion\', \'v1\')');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE "chokers"."site_settings"');
  }
}

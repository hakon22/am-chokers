import { MigrationInterface, QueryRunner } from 'typeorm';

export class SiteSettingsValueJsonb1776804091443 implements MigrationInterface {
  public name = 'SiteSettingsValueJsonb1776804091443';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "chokers"."site_settings"
      ALTER COLUMN "value" TYPE JSONB
      USING to_jsonb("value"::text)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "chokers"."site_settings"
      ALTER COLUMN "value" TYPE CHARACTER VARYING
      USING (
        CASE
          WHEN jsonb_typeof("value") = 'string' THEN "value" #>> '{}'
          ELSE "value"::text
        END
      )
    `);
  }
}

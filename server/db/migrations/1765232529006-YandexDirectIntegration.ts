import { MigrationInterface, QueryRunner } from 'typeorm';

export class YandexDirectIntegration1765232529006 implements MigrationInterface {
  public name = 'YandexDirectIntegration1765232529006';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "chokers"."yandex_direct_campaign" (
        "id" SERIAL PRIMARY KEY,
        "created" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        "updated" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        "deleted" TIMESTAMP WITH TIME ZONE,
        "name" CHARACTER VARYING NOT NULL,
        "type" CHARACTER VARYING NOT NULL,
        "yandex_campaign_id" CHARACTER VARYING NOT NULL
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "chokers"."yandex_direct_statistics" (
        "id" SERIAL PRIMARY KEY,
        "created" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        "updated" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        "deleted" TIMESTAMP WITH TIME ZONE,
        "date" TIMESTAMP WITH TIME ZONE NOT NULL,
        "clicks" INTEGER NOT NULL DEFAULT 0,
        "cost" FLOAT NOT NULL DEFAULT 0,
        "campaign_id" INTEGER NOT NULL,
        CONSTRAINT "campaign_id__fk"
          FOREIGN KEY ("campaign_id")
          REFERENCES "chokers"."yandex_direct_campaign"("id")
            ON UPDATE CASCADE
            ON DELETE CASCADE
      )
    `);

    await queryRunner.query('ALTER TABLE "chokers"."yandex_direct_statistics" ADD CONSTRAINT "UQ_yandex_direct_statistics__date__campaign_id" UNIQUE ("date", "campaign_id")');
    await queryRunner.query('ALTER TABLE "chokers"."yandex_direct_campaign" ADD CONSTRAINT "UQ_yandex_direct_campaign__yandex_campaign_id" UNIQUE ("yandex_campaign_id")');
    await queryRunner.query('CREATE INDEX "yandex_direct_statistics__date__idx" ON "chokers"."yandex_direct_statistics"("date")');
    await queryRunner.query('CREATE INDEX "yandex_direct_statistics__campaign_id__idx" ON "chokers"."yandex_direct_statistics"("campaign_id")');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE "chokers"."yandex_direct_statistics"');
    await queryRunner.query('DROP TABLE "chokers"."yandex_direct_campaign"');
  }
}

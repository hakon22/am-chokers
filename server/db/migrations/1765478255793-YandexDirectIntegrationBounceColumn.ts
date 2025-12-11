import { MigrationInterface, QueryRunner } from 'typeorm';

export class YandexDirectIntegrationBounceColumn1765478255793 implements MigrationInterface {
  public name = 'YandexDirectIntegrationBounceColumn1765478255793';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "chokers"."yandex_direct_statistics" ADD COLUMN "failure" INTEGER NOT NULL DEFAULT 0');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "chokers"."yandex_direct_statistics" DROP COLUMN "failure"');
  }
}

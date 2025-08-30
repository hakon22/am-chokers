import { MigrationInterface, QueryRunner } from 'typeorm';

export class DeliveryNameInsert1756507945822 implements MigrationInterface {
  public name = 'DeliveryNameInsert1756507945822';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('INSERT INTO "chokers"."delivery_credentials_translate" ("name", "lang", "delivery_credentials_id") VALUES ($4, $3, $1), ($5, $3, $2)', [1, 2, 'EN', 'Yandex Delivery', 'Russian Post']);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DELETE FROM "chokers"."delivery_credentials_translate" WHERE "lang" = $1', ['EN']);
  }
}

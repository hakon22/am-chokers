import { MigrationInterface, QueryRunner } from 'typeorm';

import { BaseMigration } from '@server/db/migrations/helpers/base-migration';
import { UserLangEnum } from '@server/types/user/enums/user.lang.enum';

const SCHEMA = 'chokers';
const TABLES = ['delivery', 'delivery_credentials'];
const COLUMN = 'type';
const ENUM_NAME = 'delivery_type_enum';

const OLD_VALUES = [
  'YANDEX_DELIVERY',
  'RUSSIAN_POST',
  'CDEK',
];

const NEW_VALUES = [
  ...OLD_VALUES,
  'PICKUP',
];

export class DeliveryPickup1773093788493 extends BaseMigration implements MigrationInterface {
  public name = 'DeliveryPickup1773093788493';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "chokers"."delivery" ADD COLUMN "telegram_nickname" CHARACTER VARYING');
    await queryRunner.query('ALTER TABLE "chokers"."delivery" ADD COLUMN "delivery_date_time" TIMESTAMP WITH TIME ZONE');

    await this.changeEnum({
      runner: queryRunner,
      schema: SCHEMA,
      tables: TABLES,
      column: COLUMN,
      enumName: ENUM_NAME,
      values: NEW_VALUES,
    });

    const [{ id }]: [{ id: number; }] = await queryRunner.query(
      'INSERT INTO "chokers"."delivery_credentials" ("login", "url", "type") VALUES ($1, $2, $3) RETURNING "id"',
      ['pickup', '', 'PICKUP'],
    );

    if (id) {
      await queryRunner.query(
        'INSERT INTO "chokers"."delivery_credentials_translate" ("name", "delivery_credentials_id", "lang") VALUES ($1, $2, $3), ($4, $2, $5)',
        ['Самовывоз', id, UserLangEnum.RU, 'Pickup', UserLangEnum.EN],
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const [{ id }]: [{ id: number; }] = await queryRunner.query(
      'SELECT "id" FROM "chokers"."delivery_credentials" WHERE "type" = $1',
      ['PICKUP'],
    );

    if (id) {
      await queryRunner.query(
        'DELETE FROM "chokers"."delivery_credentials_translate" WHERE "delivery_credentials_id" = $1',
        [id],
      );
      await queryRunner.query(
        'DELETE FROM "chokers"."delivery_credentials" WHERE "id" = $1',
        [id],
      );
    }

    await this.changeEnum({
      runner: queryRunner,
      schema: SCHEMA,
      tables: TABLES,
      column: COLUMN,
      enumName: ENUM_NAME,
      values: OLD_VALUES,
    });

    await queryRunner.query('ALTER TABLE "chokers"."delivery" DROP COLUMN "delivery_date_time"');
    await queryRunner.query('ALTER TABLE "chokers"."delivery" DROP COLUMN "telegram_nickname"');
  }
}

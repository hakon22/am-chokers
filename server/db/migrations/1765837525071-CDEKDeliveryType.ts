import { MigrationInterface, QueryRunner } from 'typeorm';

import { BaseMigration } from '@server/db/migrations/helpers/base-migration';

const SCHEMA = 'chokers';
const TABLES = ['delivery', 'delivery_credentials'];
const COLUMN = 'type';
const ENUM_NAME = 'delivery_type_enum';

const OLD_VALUES = [
  'YANDEX_DELIVERY',
  'RUSSIAN_POST',
];

const NEW_VALUES = [
  'YANDEX_DELIVERY',
  'RUSSIAN_POST',
  'CDEK', // new
];

export class CDEKDeliveryType1765837525071 extends BaseMigration implements MigrationInterface {
  public name = 'CDEKDeliveryType1765837525071';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await this.changeEnum({
      runner: queryRunner,
      schema: SCHEMA,
      tables: TABLES,
      column: COLUMN,
      enumName: ENUM_NAME,
      values: NEW_VALUES,
    });
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await this.changeEnum({
      runner: queryRunner,
      schema: SCHEMA,
      tables: TABLES,
      column: COLUMN,
      enumName: ENUM_NAME,
      values: OLD_VALUES,
    });
  }
}

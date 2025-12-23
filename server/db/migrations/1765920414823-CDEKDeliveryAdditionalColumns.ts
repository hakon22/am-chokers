import { MigrationInterface, QueryRunner } from 'typeorm';

import { BaseMigration } from '@server/db/migrations/helpers/base-migration';

const CDEK_DELIVERY_STATUSES = [
  'CREATED',
  'REMOVED',
  'RECEIVED_AT_SHIPMENT_WAREHOUSE',
  'READY_TO_SHIP_AT_SENDING_OFFICE',
  'READY_FOR_SHIPMENT_IN_TRANSIT_CITY',
  'RETURNED_TO_SENDER_CITY_WAREHOUSE',
  'PASSED_TO_CARRIER_AT_SENDING_OFFICE',
  'SEND_TO_TRANSIT_OFFICE',
  'MET_AT_TRANSIT_OFFICE',
  'ACCEPTED_AT_TRANSIT_WAREHOUSE',
  'RETURNED_TO_TRANSIT_WAREHOUSE',
  'READY_TO_SHIP_IN_TRANSIT_OFFICE',
  'PASSED_TO_CARRIER_AT_TRANSIT_OFFICE',
  'SENT_TO_SENDER_CITY',
  'MET_AT_SENDING_OFFICE',
  'MET_AT_RECIPIENT_OFFICE',
  'ACCEPTED_AT_RECIPIENT_CITY_WAREHOUSE',
  'ACCEPTED_AT_PICK_UP_POINT',
  'TAKEN_BY_COURIER',
  'RETURNED_TO_RECIPIENT_CITY_WAREHOUSE',
  'DELIVERED',
  'NOT_DELIVERED',
  'ENTERED_TO_OFFICE_TRANSIT_WAREHOUSE',
  'ENTERED_TO_DELIVERY_WAREHOUSE',
  'ENTERED_TO_WAREHOUSE_ON_DEMAND',
  'IN_CUSTOMS_INTERNATIONAL',
  'SHIPPED_TO_DESTINATION',
  'PASSED_TO_TRANSIT_CARRIER',
  'IN_CUSTOMS_LOCAL',
  'CUSTOMS_COMPLETE',
  'POSTOMAT_POSTED',
  'POSTOMAT_SEIZED',
  'POSTOMAT_RECEIVED',
  'READY_FOR_SHIPMENT_IN_SENDER_CITY',
  'TAKEN_BY_TRANSPORTER_FROM_SENDER_CITY',
  'SENT_TO_TRANSIT_CITY',
  'ACCEPTED_IN_TRANSIT_CITY',
  'TAKEN_BY_TRANSPORTER_FROM_TRANSIT_CITY',
  'SENT_TO_RECIPIENT_CITY',
  'ACCEPTED_IN_RECIPIENT_CITY',
];

export class CDEKDeliveryAdditionalColumns1765920414823 extends BaseMigration implements MigrationInterface {
  public name = 'CDEKDeliveryAdditionalColumns1765920414823';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TYPE "chokers"."cdek_delivery_status_enum" AS ${this.toPosgresEnum(CDEK_DELIVERY_STATUSES)}`);

    await queryRunner.query('ALTER TABLE "chokers"."delivery" ADD COLUMN "tariff_name" CHARACTER VARYING');
    await queryRunner.query('ALTER TABLE "chokers"."delivery" ADD COLUMN "tariff_description" CHARACTER VARYING');
    await queryRunner.query('ALTER TABLE "chokers"."delivery" ADD COLUMN "tariff_code" INTEGER');
    await queryRunner.query('ALTER TABLE "chokers"."delivery" ADD COLUMN "country_code" CHARACTER VARYING');

    await queryRunner.query('ALTER TABLE "chokers"."delivery" RENAME COLUMN "status" TO "yandex_status"');
    await queryRunner.query('ALTER TABLE "chokers"."delivery" ADD COLUMN "cdek_status" "chokers"."cdek_delivery_status_enum"');

    await queryRunner.query('ALTER TYPE "chokers"."delivery_status_enum" RENAME TO "yandex_delivery_status_enum"');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "chokers"."delivery" DROP COLUMN "tariff_name"');
    await queryRunner.query('ALTER TABLE "chokers"."delivery" DROP COLUMN "tariff_description"');
    await queryRunner.query('ALTER TABLE "chokers"."delivery" DROP COLUMN "tariff_code"');
    await queryRunner.query('ALTER TABLE "chokers"."delivery" DROP COLUMN "country_code"');
    await queryRunner.query('ALTER TABLE "chokers"."delivery" DROP COLUMN "cdek_status"');

    await queryRunner.query('DROP TYPE "chokers"."cdek_delivery_status_enum"');

    await queryRunner.query('ALTER TYPE "chokers"."yandex_delivery_status_enum" RENAME TO "delivery_status_enum"');

    await queryRunner.query('ALTER TABLE "chokers"."delivery" RENAME COLUMN "yandex_status" TO "status"');
  }
}

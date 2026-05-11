import { MigrationInterface, QueryRunner } from 'typeorm';

export class ItemYookassaInvoiceIdColumn1778452527257 implements MigrationInterface {
  public name = 'ItemYookassaInvoiceIdColumn1778452527257';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "chokers"."item" ADD COLUMN "yookassa_invoice_id" CHARACTER VARYING');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "chokers"."item" DROP COLUMN "yookassa_invoice_id"');
  }
}

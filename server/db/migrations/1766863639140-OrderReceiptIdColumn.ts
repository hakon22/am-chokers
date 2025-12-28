import { MigrationInterface, QueryRunner } from 'typeorm';

export class OrderReceiptIdColumn1766863639140 implements MigrationInterface {
  public name = 'OrderReceiptIdColumn1766863639140';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "chokers"."order" ADD COLUMN "receipt_id" CHARACTER VARYING');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "chokers"."order" DROP COLUMN "receipt_id"');
  }
}

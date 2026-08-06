import { MigrationInterface, QueryRunner } from 'typeorm';

export class QuotedDeliveryPriceOnOrder1785791421039 implements MigrationInterface {
  public name = 'QuotedDeliveryPriceOnOrder1785791421039';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "chokers"."order" ADD COLUMN "quoted_delivery_price" DOUBLE PRECISION');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "chokers"."order" DROP COLUMN "quoted_delivery_price"');
  }
}

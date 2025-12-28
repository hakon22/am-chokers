import { MigrationInterface, QueryRunner } from 'typeorm';

export class OutOfStockColumn1766957182528 implements MigrationInterface {
  public name = 'OutOfStockColumn1766957182528';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "chokers"."item" DROP COLUMN "is_absent"');

    await queryRunner.query('ALTER TABLE "chokers"."item" ADD COLUMN "out_stock" TIMESTAMP WITHOUT TIME ZONE');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "chokers"."item" DROP COLUMN "out_stock"');

    await queryRunner.query('ALTER TABLE "chokers"."item" ADD COLUMN "is_absent" BOOLEAN DEFAULT FALSE');
  }
}

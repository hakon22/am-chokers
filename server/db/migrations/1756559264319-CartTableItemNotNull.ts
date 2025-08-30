import { MigrationInterface, QueryRunner } from 'typeorm';

export class CartTableItemNotNull1756559264319 implements MigrationInterface {
  public name = 'CartTableItemNotNull1756559264319';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "chokers"."cart" ALTER COLUMN "item_id" SET NOT NULL');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "chokers"."cart" ALTER COLUMN "item_id" DROP NOT NULL');
  }
}

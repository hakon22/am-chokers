import { MigrationInterface, QueryRunner } from 'typeorm';

export class ItemGroupSortColumn1756761408702 implements MigrationInterface {
  public name = 'ItemGroupSortColumn1756761408702';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "chokers"."item_group" ADD COLUMN "order" SMALLINT NOT NULL DEFAULT 0');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "chokers"."item_group" DROP COLUMN "order"');
  }
}

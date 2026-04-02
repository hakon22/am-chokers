import { MigrationInterface, QueryRunner } from 'typeorm';

export class PromotionalBuyTwoGetOne1775153377420 implements MigrationInterface {
  public name = 'PromotionalBuyTwoGetOne1775153377420';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "chokers"."promotional" ADD COLUMN "buy_two_get_one" BOOLEAN NOT NULL DEFAULT FALSE');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "chokers"."promotional" DROP COLUMN "buy_two_get_one"');
  }
}

import { MigrationInterface, QueryRunner } from 'typeorm';

export class PromotionalSingleUse1785788061124 implements MigrationInterface {
  public name = 'PromotionalSingleUse1785788061124';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "chokers"."promotional" ADD COLUMN "single_use" BOOLEAN NOT NULL DEFAULT FALSE');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "chokers"."promotional" DROP COLUMN "single_use"');
  }
}

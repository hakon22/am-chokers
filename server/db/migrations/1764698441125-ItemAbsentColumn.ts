import { MigrationInterface, QueryRunner } from 'typeorm';

export class ItemAbsentColumn1764698441125 implements MigrationInterface {
  public name = 'ItemAbsentColumn1764698441125';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "chokers"."item" ADD COLUMN "is_absent" BOOLEAN NOT NULL DEFAULT FALSE');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "chokers"."item" DROP COLUMN "is_absent"');
  }
}

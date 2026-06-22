import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddYclidToOrder1782165230369 implements MigrationInterface {
  public name = 'AddYclidToOrder1782165230369';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "chokers"."order" ADD COLUMN "yclid" CHARACTER VARYING');
    await queryRunner.query('ALTER TABLE "chokers"."order" ADD COLUMN "metrica_purchase_sent_at" TIMESTAMP WITH TIME ZONE');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "chokers"."order" DROP COLUMN "metrica_purchase_sent_at"');
    await queryRunner.query('ALTER TABLE "chokers"."order" DROP COLUMN "yclid"');
  }
}

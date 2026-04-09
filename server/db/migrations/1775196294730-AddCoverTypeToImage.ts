import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCoverTypeToImage1775196294730 implements MigrationInterface {
  public name = 'AddCoverTypeToImage1775196294730';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE TYPE "chokers"."cover_type_enum" AS ENUM (\'IMAGE\', \'GROUP_IMAGE\', \'COLLECTION_IMAGE\')');

    await queryRunner.query('ALTER TABLE "chokers"."image" ADD COLUMN "cover_type" "chokers"."cover_type_enum"');

    await queryRunner.query('UPDATE "chokers"."image" SET "cover_type" = \'IMAGE\' WHERE "cover_order" IS NOT NULL AND "cover_order" <= 6');
    await queryRunner.query('UPDATE "chokers"."image" SET "cover_type" = \'COLLECTION_IMAGE\' WHERE "cover_order" IS NOT NULL AND "cover_order" >= 9');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "chokers"."image" DROP COLUMN "cover_type"');
    await queryRunner.query('DROP TYPE "chokers"."cover_type_enum"');
  }
}

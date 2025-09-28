import { MigrationInterface, QueryRunner } from 'typeorm';

export class ItemPublicationColumn1758737564042 implements MigrationInterface {
  public name = 'ItemPublicationColumn1758737564042';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "chokers"."item" ADD COLUMN "publication_date" TIMESTAMP WITHOUT TIME ZONE');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "chokers"."item" DROP COLUMN "publication_date"');
  }
}

import { MigrationInterface, QueryRunner } from 'typeorm';

export class DelayedTelegramPublicationUniqIndex1757876613060 implements MigrationInterface {
  public name = 'DelayedTelegramPublicationUniqIndex1757876613060';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX "chokers"."deferred_publication__item_idx"');

    await queryRunner.query('ALTER TABLE "chokers"."deferred_publication" ADD COLUMN "description" CHARACTER VARYING NOT NULL');

    await queryRunner.query(`
      CREATE UNIQUE INDEX "deferred_publication__item_uniq_idx" 
        ON "chokers"."deferred_publication" ("item_id") 
      WHERE "deleted" IS NULL;
    `);

    await queryRunner.query(`
      CREATE FUNCTION "chokers"."sync_deferred_publication_on_soft_delete"()
      RETURNS TRIGGER AS $$
      BEGIN
        IF NEW."deleted" IS NOT NULL AND OLD."deleted" IS NULL THEN
          UPDATE "chokers"."deferred_publication" 
          SET "deleted" = NEW."deleted" 
          WHERE "item_id" = NEW."id";
        END IF;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql
    `);

    await queryRunner.query(`
      CREATE TRIGGER "item_soft_delete_trigger"
      AFTER UPDATE ON "chokers"."item"
      FOR EACH ROW
      EXECUTE FUNCTION "chokers"."sync_deferred_publication_on_soft_delete"()
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "chokers"."deferred_publication" DROP COLUMN "description"');

    await queryRunner.query('DROP TRIGGER "item_soft_delete_trigger" ON "chokers"."item"');
    await queryRunner.query('DROP FUNCTION "chokers"."sync_deferred_publication_on_soft_delete"()');

    await queryRunner.query('DROP INDEX "chokers"."deferred_publication__item_uniq_idx"');

    await queryRunner.query('CREATE INDEX "deferred_publication__item_idx" ON "chokers"."deferred_publication" ("item_id")');
  }
}

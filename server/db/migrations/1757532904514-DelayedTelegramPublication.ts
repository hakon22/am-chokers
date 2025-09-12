import { MigrationInterface, QueryRunner } from 'typeorm';

export class DelayedTelegramPublication1757532904514 implements MigrationInterface {
  public name = 'DelayedTelegramPublication1757532904514';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "chokers"."deferred_publication"(
        "id" SERIAL PRIMARY KEY,
        "created" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
        "updated" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
        "deleted" TIMESTAMP WITHOUT TIME ZONE,
        "date" TIMESTAMP WITHOUT TIME ZONE NOT NULL,
        "is_published" BOOLEAN NOT NULL DEFAULT FALSE,
        "item_id" INTEGER NOT NULL,
      CONSTRAINT "item_id__fk"
        FOREIGN KEY ("item_id")
        REFERENCES "chokers"."item"("id")
          ON UPDATE CASCADE
          ON DELETE CASCADE
    )`);
    await queryRunner.query('CREATE INDEX "deferred_publication__item_idx" ON "chokers"."deferred_publication" ("item_id")');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE "chokers"."deferred_publication"');
  }
}

import { MigrationInterface, QueryRunner } from 'typeorm';

export class ItemHistoryTable1776022466291 implements MigrationInterface {
  public name = 'ItemHistoryTable1776022466291';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "chokers"."item_history" (
        "id" SERIAL PRIMARY KEY,
        "created" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        "field" CHARACTER VARYING NOT NULL,
        "old_value" TEXT,
        "new_value" TEXT,
        "item_id" INTEGER NOT NULL,
        "user_id" INTEGER,
        CONSTRAINT "item_history__item_fk"
        FOREIGN KEY ("item_id")
        REFERENCES "chokers"."item"("id")
          ON DELETE CASCADE
          ON UPDATE CASCADE,
        CONSTRAINT "item_history__user_fk"
        FOREIGN KEY ("user_id")
        REFERENCES "chokers"."user"("id")
          ON DELETE SET NULL
          ON UPDATE CASCADE
      )
    `);
    await queryRunner.query('CREATE INDEX "item_history__item_id_idx" ON "chokers"."item_history" ("item_id")');
    await queryRunner.query('CREATE INDEX "item_history__user_id_idx" ON "chokers"."item_history" ("user_id")');
    await queryRunner.query('CREATE INDEX "item_history__item_id_created_idx" ON "chokers"."item_history" ("item_id", "created" DESC)');

    await queryRunner.query(`
      INSERT INTO "chokers"."item_history" ("created", "field", "old_value", "new_value", "item_id", "user_id")
      SELECT "item"."created", 'created', NULL, NULL, "item"."id", NULL
      FROM "chokers"."item" AS "item"
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE "chokers"."item_history"');
  }
}

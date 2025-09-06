import { MigrationInterface, QueryRunner } from 'typeorm';

export class PromotionalItemsRelation1757015204501 implements MigrationInterface {
  public name = 'PromotionalItemsRelation1757015204501';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "chokers"."promotional_item"(
        "promotional_id" INTEGER NOT NULL,
        "item_id" INTEGER NOT NULL,
      CONSTRAINT "promotional_item__pk"
        PRIMARY KEY ("promotional_id", "item_id"),
      CONSTRAINT "promotional_id__fk"
        FOREIGN KEY ("promotional_id")
        REFERENCES "chokers"."promotional"("id")
          ON UPDATE CASCADE
          ON DELETE CASCADE,
      CONSTRAINT "item_id__fk"
        FOREIGN KEY ("item_id")
        REFERENCES "chokers"."item"("id")
          ON UPDATE CASCADE
          ON DELETE CASCADE
    )`);
    await queryRunner.query('CREATE INDEX "promotional_item__promotional_idx" ON "chokers"."promotional_item" ("promotional_id")');
    await queryRunner.query('CREATE INDEX "promotional_item__item_idx" ON "chokers"."promotional_item" ("item_id")');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE "chokers"."promotional_item"');
  }
}

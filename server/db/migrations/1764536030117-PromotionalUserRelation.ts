import { MigrationInterface, QueryRunner } from 'typeorm';

export class PromotionalUserRelation1764536030117 implements MigrationInterface {
  public name = 'PromotionalUserRelation1764536030117';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "chokers"."promotional_user"(
        "promotional_id" INTEGER NOT NULL,
        "user_id" INTEGER NOT NULL,
      CONSTRAINT "promotional_user__pk"
        PRIMARY KEY ("promotional_id", "user_id"),
      CONSTRAINT "promotional_id__fk"
        FOREIGN KEY ("promotional_id")
        REFERENCES "chokers"."promotional"("id")
          ON UPDATE CASCADE
          ON DELETE CASCADE,
      CONSTRAINT "user_id__fk"
        FOREIGN KEY ("user_id")
        REFERENCES "chokers"."user"("id")
          ON UPDATE CASCADE
          ON DELETE CASCADE
    )`);
    await queryRunner.query('CREATE INDEX "promotional_user__promotional_idx" ON "chokers"."promotional_user" ("promotional_id")');
    await queryRunner.query('CREATE INDEX "promotional_user__user_idx" ON "chokers"."promotional_user" ("user_id")');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE "chokers"."promotional_user"');
  }
}

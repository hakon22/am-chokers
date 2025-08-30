import { MigrationInterface, QueryRunner } from 'typeorm';

import { UserLangEnum } from '@server/types/user/enums/user.lang.enum';
import { BaseMigration } from '@server/db/migrations/helpers/base-migration';

export class TransferringNamesToSeparateTables1756162283129 extends BaseMigration implements MigrationInterface {
  public name = 'TransferringNamesToSeparateTables1756162283129';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TYPE "chokers"."user_lang_enum" AS ${this.toPosgresEnum(['RU', 'EN'])}`);

    await queryRunner.query('ALTER TABLE "chokers"."user" ADD COLUMN "lang" "chokers"."user_lang_enum" NOT NULL DEFAULT \'RU\'');

    await queryRunner.query(`
      CREATE TABLE "chokers"."color_translate" (
        "id" SERIAL PRIMARY KEY,
        "name" CHARACTER VARYING NOT NULL,
        "color_id" INTEGER NOT NULL,
        "lang" "chokers"."user_lang_enum" NOT NULL,
      CONSTRAINT "fk_color_translate_color_id" 
        FOREIGN KEY ("color_id") 
        REFERENCES "chokers"."color"("id") 
        ON UPDATE CASCADE 
        ON DELETE CASCADE,
      CONSTRAINT "unique_lang_color" 
        UNIQUE ("lang", "color_id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "chokers"."item_translate" (
        "id" SERIAL PRIMARY KEY,
        "name" CHARACTER VARYING NOT NULL,
        "description" CHARACTER VARYING NOT NULL,
        "length" CHARACTER VARYING NOT NULL,
        "item_id" INTEGER NOT NULL,
        "lang" "chokers"."user_lang_enum" NOT NULL,
      CONSTRAINT "fk_item_translate_item_id" 
        FOREIGN KEY ("item_id") 
        REFERENCES "chokers"."item"("id") 
        ON UPDATE CASCADE 
        ON DELETE CASCADE,
      CONSTRAINT "unique_lang_item" 
        UNIQUE ("lang", "item_id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "chokers"."item_group_translate" (
        "id" SERIAL PRIMARY KEY,
        "name" CHARACTER VARYING NOT NULL,
        "description" CHARACTER VARYING NOT NULL,
        "group_id" INTEGER NOT NULL,
        "lang" "chokers"."user_lang_enum" NOT NULL,
      CONSTRAINT "fk_item_group_translate_group_id" 
        FOREIGN KEY ("group_id") 
        REFERENCES "chokers"."item_group"("id") 
        ON UPDATE CASCADE 
        ON DELETE CASCADE,
      CONSTRAINT "unique_lang_item_group" 
        UNIQUE ("lang", "group_id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "chokers"."item_collection_translate" (
        "id" SERIAL PRIMARY KEY,
        "name" CHARACTER VARYING NOT NULL,
        "collection_id" INTEGER NOT NULL,
        "lang" "chokers"."user_lang_enum" NOT NULL,
      CONSTRAINT "fk_item_collection_translate_collection_id" 
        FOREIGN KEY ("collection_id") 
        REFERENCES "chokers"."item_collection"("id") 
        ON UPDATE CASCADE 
        ON DELETE CASCADE,
      CONSTRAINT "unique_lang_item_collection" 
        UNIQUE ("lang", "collection_id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "chokers"."composition_translate" (
        "id" SERIAL PRIMARY KEY,
        "name" CHARACTER VARYING NOT NULL,
        "composition_id" INTEGER NOT NULL,
        "lang" "chokers"."user_lang_enum" NOT NULL,
      CONSTRAINT "fk_composition_translate_composition_id" 
        FOREIGN KEY ("composition_id") 
        REFERENCES "chokers"."composition"("id") 
        ON UPDATE CASCADE 
        ON DELETE CASCADE,
      CONSTRAINT "unique_lang_composition" 
        UNIQUE ("lang", "composition_id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "chokers"."delivery_credentials_translate" (
        "id" SERIAL PRIMARY KEY,
        "name" CHARACTER VARYING NOT NULL,
        "delivery_credentials_id" INTEGER NOT NULL,
        "lang" "chokers"."user_lang_enum" NOT NULL,
      CONSTRAINT "fk_delivery_credentials_translate_delivery_credentials_id" 
        FOREIGN KEY ("delivery_credentials_id") 
        REFERENCES "chokers"."delivery_credentials"("id") 
        ON UPDATE CASCADE 
        ON DELETE CASCADE,
      CONSTRAINT "unique_lang_delivery_credentials" 
        UNIQUE ("lang", "delivery_credentials_id")
      )
    `);

    await queryRunner.query(
      `INSERT INTO "chokers"."item_translate" ("name", "description", "length", "item_id", "lang")
         SELECT "name", "description", "length", "id", $1 
         FROM "chokers"."item"`,
      [UserLangEnum.RU],
    );

    await queryRunner.query(
      `INSERT INTO "chokers"."item_group_translate" ("name", "description", "group_id", "lang")
         SELECT "name", "description", "id", $1 
         FROM "chokers"."item_group"`,
      [UserLangEnum.RU],
    );

    await queryRunner.query(
      `INSERT INTO "chokers"."item_collection_translate" ("name", "collection_id", "lang")
         SELECT "name", "id", $1 
         FROM "chokers"."item_collection"`,
      [UserLangEnum.RU],
    );

    await queryRunner.query(
      `INSERT INTO "chokers"."color_translate" ("name", "color_id", "lang")
         SELECT "name", "id", $1 
         FROM "chokers"."color"`,
      [UserLangEnum.RU],
    );

    await queryRunner.query(
      `INSERT INTO "chokers"."composition_translate" ("name", "composition_id", "lang")
         SELECT "name", "id", $1 
         FROM "chokers"."composition"`,
      [UserLangEnum.RU],
    );

    await queryRunner.query(
      `INSERT INTO "chokers"."delivery_credentials_translate" ("name", "delivery_credentials_id", "lang")
         SELECT "name", "id", $1 
         FROM "chokers"."delivery_credentials"`,
      [UserLangEnum.RU],
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const TABLES = [
      'item_translate',
      'item_group_translate',
      'item_collection_translate',
      'color_translate',
      'composition_translate',
      'delivery_credentials_translate',
    ];

    for (const TABLE of TABLES) {
      await queryRunner.query(`DROP TABLE "chokers"."${TABLE}"`);
    }

    await queryRunner.query('ALTER TABLE "chokers"."user" DROP COLUMN "lang"');

    await queryRunner.query('DROP TYPE "chokers"."user_lang_enum"');
  }
}

import { MigrationInterface, QueryRunner } from 'typeorm';

const OLD_TABLES = [
  'color_copy',
  'composition_copy',
  'item_copy',
  'item_group_copy',
  'item_collection_copy',
  'delivery_credentials_copy',
];

export class UserRefreshTokenTransfer1756834212309 implements MigrationInterface {
  public name = 'UserRefreshTokenTransfer1756834212309';

  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const table of OLD_TABLES) {
      await queryRunner.query(`DROP TABLE "chokers"."${table}"`);
    }

    await queryRunner.query('ALTER TABLE "chokers"."acquiring_transaction" ALTER COLUMN "order_id" SET NOT NULL');
    await queryRunner.query('ALTER TABLE "chokers"."grade" ALTER COLUMN "user_id" SET NOT NULL');
    await queryRunner.query('ALTER TABLE "chokers"."grade" ALTER COLUMN "position_id" SET NOT NULL');
    await queryRunner.query('ALTER TABLE "chokers"."item" ALTER COLUMN "group_id" SET NOT NULL');
    await queryRunner.query('ALTER TABLE "chokers"."order" ALTER COLUMN "user_id" SET NOT NULL');
    await queryRunner.query('ALTER TABLE "chokers"."order_position" ALTER COLUMN "item_id" SET NOT NULL');

    await queryRunner.query(`
      CREATE TABLE "chokers"."user_refresh_token" (
        "id" SERIAL NOT NULL,
        "created" TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
        "refresh_token" CHARACTER VARYING NOT NULL,
        "user_id" INTEGER NOT NULL,
        PRIMARY KEY ("id"),
      CONSTRAINT "user_id" FOREIGN KEY ("user_id")
        REFERENCES "chokers"."user"("id")
        ON UPDATE CASCADE
        ON DELETE CASCADE
      )
    `);

    const users: { id: number; refresh_token: string[]; }[] = await queryRunner.query(`
      SELECT "id", "refresh_token" FROM "chokers"."user"
    `);

    for (const { id, refresh_token } of users) {
      for (const token of refresh_token) {
        await queryRunner.query(`
          INSERT INTO "chokers"."user_refresh_token" ("refresh_token", "user_id")
          VALUES ($1, $2)
        `, [token, id]);
      }
    }

    await queryRunner.query('ALTER TABLE "chokers"."user" DROP COLUMN "refresh_token"');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "chokers"."user" ADD COLUMN "refresh_token" CHARACTER VARYING[] NOT NULL DEFAULT \'{}\'');

    const tokens: { refresh_token: string; user_id: number; }[] = await queryRunner.query('SELECT "refresh_token", "user_id" FROM "chokers"."user_refresh_token"');

    const groupedTokens = tokens.reduce((acc, { refresh_token, user_id }) => {
      if (!acc[user_id]) {
        acc[user_id] = [];
      }
      acc[user_id].push(refresh_token);

      return acc;
    }, {} as Record<number, string[]>);

    for (const [userId, refreshTokens] of Object.entries(groupedTokens)) {
      await queryRunner.query('UPDATE "chokers"."user" SET "refresh_token" = $1 WHERE "id" = $2', [refreshTokens, userId]);
    }

    await queryRunner.query('DROP TABLE "chokers"."user_refresh_token"');

    await queryRunner.query('ALTER TABLE "chokers"."acquiring_transaction" ALTER COLUMN "order_id" DROP NOT NULL');
    await queryRunner.query('ALTER TABLE "chokers"."grade" ALTER COLUMN "user_id" DROP NOT NULL');
    await queryRunner.query('ALTER TABLE "chokers"."grade" ALTER COLUMN "position_id" DROP NOT NULL');
    await queryRunner.query('ALTER TABLE "chokers"."item" ALTER COLUMN "group_id" DROP NOT NULL');
    await queryRunner.query('ALTER TABLE "chokers"."order" ALTER COLUMN "user_id" DROP NOT NULL');
    await queryRunner.query('ALTER TABLE "chokers"."order_position" ALTER COLUMN "item_id" DROP NOT NULL');
  }
}

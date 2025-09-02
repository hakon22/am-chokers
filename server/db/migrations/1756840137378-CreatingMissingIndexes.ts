import { MigrationInterface, QueryRunner } from 'typeorm';

const TABLES = [
  'color',
  'composition',
  'item',
  'item_group',
  'item_collection',
  'delivery_credentials',
];

export class CreatingMissingIndexes1756840137378 implements MigrationInterface {
  public name = 'CreatingMissingIndexes1756840137378';

  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const table of TABLES) {
      const column = table.includes('item_') && table !== 'item_id' ? table.replace('item_', '') : table;
      await queryRunner.query(`CREATE INDEX "${table}_translate__${column}_idx" ON "chokers"."${table}_translate" ("${column}_id")`);
    }
    await queryRunner.query('CREATE INDEX "user_refresh_token__user_idx" ON "chokers"."user_refresh_token" ("user_id")');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    for (const table of TABLES) {
      await queryRunner.query(`DROP INDEX "chokers"."${table}_translate__${table}_idx"`);
    }
    await queryRunner.query('DROP INDEX "chokers"."user_refresh_token"."user_refresh_token__user_idx"');
  }
}

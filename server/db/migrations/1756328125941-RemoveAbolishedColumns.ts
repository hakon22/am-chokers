import { MigrationInterface, QueryRunner } from 'typeorm';

const VALUES = [
  ['color', ['name']],
  ['composition', ['name']],
  ['item', ['name', 'description', 'length']],
  ['item_group', ['name', 'description']],
  ['item_collection', ['name']],
  ['delivery_credentials', ['name']],
];

export class RemoveAbolishedColumns1756328125941 implements MigrationInterface {
  public name = 'RemoveAbolishedColumns1756328125941';

  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const [table, columns] of VALUES) {
      await queryRunner.query(`CREATE TABLE "chokers"."${table}_copy" AS (SELECT * FROM "chokers"."${table}")`);

      let uniqName = '';

      switch (table) {
      case 'item':
        uniqName = 'UQ_c6ae12601fed4e2ee5019544ddf';
        break;
      case 'item_collection':
        uniqName = 'UQ_ecae699fd3aa3588c9010f286b1';
        break;
      }

      if (uniqName) {
        await queryRunner.query(`ALTER TABLE "chokers"."${table}" DROP CONSTRAINT "${uniqName}"`);
      }

      for (const column of columns) {
        await queryRunner.query(`ALTER TABLE "chokers"."${table}" DROP COLUMN "${column}"`);
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    for (const [table, columns] of VALUES) {
      let uniqName = '';

      switch (table) {
      case 'item':
        uniqName = 'UQ_c6ae12601fed4e2ee5019544ddf';
        break;
      case 'item_collection':
        uniqName = 'UQ_ecae699fd3aa3588c9010f286b1';
        break;
      }

      for (const column of columns) {
        await queryRunner.query(`ALTER TABLE "chokers"."${table}" ADD COLUMN "${column}" CHARACTER VARYING`);

        if (uniqName && column === 'name') {
          await queryRunner.query(`ALTER TABLE "chokers"."${table}" ADD CONSTRAINT "${uniqName}" UNIQUE ("${column}")`);
        }
      }

      const oldValues: { id: number; name: string; description?: string; length?: string; }[] = await queryRunner.query(`
        SELECT * FROM "chokers"."${table}_copy"
      `);

      for (const value of oldValues) {
        if (table === 'item') {
          await queryRunner.query(`UPDATE "chokers"."${table}" SET "name" = $1, "description" = $2, "length" = $3 WHERE "id" = $4`, [value.name, value.description, value.length, value.id]);
        } else if (table === 'item_group') {
          await queryRunner.query(`UPDATE "chokers"."${table}" SET "name" = $1, "description" = $2 WHERE "id" = $3`, [value.name, value.description, value.id]);
        } else {
          await queryRunner.query(`UPDATE "chokers"."${table}" SET "name" = $1 WHERE "id" = $2`, [value.name, value.id]);
        }
      }
    }

    for (const [table, columns] of VALUES) {
      for (const column of columns) {
        await queryRunner.query(`ALTER TABLE "chokers"."${table}" ALTER COLUMN "${column}" SET NOT NULL`);
      }

      await queryRunner.query(`DROP TABLE "chokers"."${table}_copy"`);
    }
  }
}

import { MigrationInterface, QueryRunner } from 'typeorm';

import { BaseMigration } from '@server/db/migrations/helpers/base-migration';

const SCHEMA = 'ai';
const ENUM_NAME = 'provider_type_enum';

const OLD_VALUES = [
  'ROUTER_AI',
  'CODING_MANTRA',
];

const NEW_VALUES = [
  'ROUTER_AI',
  'CODING_MANTRA',
  'GENLOOK',
];

export class GenlookTryOnProvider1784157071083 extends BaseMigration implements MigrationInterface {
  public name = 'GenlookTryOnProvider1784157071083';

  /**
   * Добавляет GENLOOK в provider_type_enum и сидит inactive generation-агент
   * @param queryRunner - TypeORM query runner
   * @returns Promise при завершении
   */
  public async up(queryRunner: QueryRunner): Promise<void> {
    await this.changeEnum({
      runner: queryRunner,
      schema: SCHEMA,
      enumName: ENUM_NAME,
      values: NEW_VALUES,
      columns: [
        { table: 'agent', column: 'provider' },
        { table: 'try_on_log', column: 'validation_provider' },
        { table: 'try_on_log', column: 'generation_provider' },
      ],
    });

    await queryRunner.query(`
      INSERT INTO "ai"."agent" ("name", "provider", "purpose", "model", "temperature", "base_url", "requires_proxy", "is_active")
      VALUES (
        'Try-on generation (Genlook)',
        'GENLOOK',
        'TRY_ON_GENERATION',
        'default',
        0,
        'https://api.genlook.app',
        TRUE,
        FALSE
      )
    `);
  }

  /**
   * Удаляет Genlook-агента и откатывает provider_type_enum
   * @param queryRunner - TypeORM query runner
   * @returns Promise при завершении
   */
  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE "ai"."try_on_log"
      SET "generation_provider" = NULL
      WHERE "generation_provider" = 'GENLOOK'
    `);
    await queryRunner.query(`
      UPDATE "ai"."try_on_log"
      SET "validation_provider" = NULL
      WHERE "validation_provider" = 'GENLOOK'
    `);
    await queryRunner.query(`
      DELETE FROM "ai"."agent"
      WHERE "provider" = 'GENLOOK' AND "purpose" = 'TRY_ON_GENERATION'
    `);

    await this.changeEnum({
      runner: queryRunner,
      schema: SCHEMA,
      enumName: ENUM_NAME,
      values: OLD_VALUES,
      columns: [
        { table: 'agent', column: 'provider' },
        { table: 'try_on_log', column: 'validation_provider' },
        { table: 'try_on_log', column: 'generation_provider' },
      ],
    });
  }
}

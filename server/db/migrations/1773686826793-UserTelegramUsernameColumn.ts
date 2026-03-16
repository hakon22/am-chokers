import { MigrationInterface, QueryRunner } from 'typeorm';

export class UserTelegramUsernameColumn1773686826793 implements MigrationInterface {
  public name = 'UserTelegramUsernameColumn1773686826793';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "chokers"."user" ADD COLUMN "telegram_username" CHARACTER VARYING');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "chokers"."user" DROP COLUMN "telegram_username"');
  }
}

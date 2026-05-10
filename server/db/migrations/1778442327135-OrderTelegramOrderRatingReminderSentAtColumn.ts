import { MigrationInterface, QueryRunner } from 'typeorm';

export class OrderTelegramOrderRatingReminderSentAtColumn1778442327135 implements MigrationInterface {
  public name = 'OrderTelegramOrderRatingReminderSentAtColumn1778442327135';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "chokers"."order" ADD COLUMN "telegram_order_rating_reminder_sent_at" TIMESTAMP WITH TIME ZONE',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "chokers"."order" DROP COLUMN "telegram_order_rating_reminder_sent_at"',
    );
  }
}

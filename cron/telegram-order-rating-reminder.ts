import { Container } from 'typescript-ioc';
import moment from 'moment-timezone';
import _ from 'lodash';
import 'dotenv/config';

import { OrderEntity } from '@server/db/entities/order.entity';
import { OrderStatusEnum } from '@server/types/order/enums/order.status.enum';
import { UserLangEnum } from '@server/types/user/enums/user.lang.enum';
import { LoggerService } from '@server/services/app/logger.service';
import { DatabaseService } from '@server/db/database.service';
import { TelegramService } from '@server/services/integration/telegram.service';
import { TelegramBotService } from '@server/services/integration/telegram-bot.service';
import { resolveTelegramWebAppPublicOrigin } from '@server/utilities/telegram-web-app-public-origin';

const TAG = 'TelegramOrderRatingReminderCron';

const MOSCOW_TIMEZONE_NAME = 'Europe/Moscow';

const RATING_REMINDER_WINDOW_END_MINUTE_EXCLUSIVE = 10;

/** Ежедневное напоминание об оценке товаров по завершённым заказам (13:00 Europe/Moscow) */
class TelegramOrderRatingReminderCron {
  public readonly loggerService = Container.get(LoggerService);

  private readonly databaseService = Container.get(DatabaseService);

  private readonly telegramService = Container.get(TelegramService);

  private readonly telegramBotService = Container.get(TelegramBotService);

  public start = async () => {
    const moscowNow = moment.tz(MOSCOW_TIMEZONE_NAME);

    if (moscowNow.hour() !== 13 || moscowNow.minute() >= RATING_REMINDER_WINDOW_END_MINUTE_EXCLUSIVE) {
      this.loggerService.info(
        TAG,
        `Пропуск: текущее время в Москве ${moscowNow.format('HH:mm')} вне окна 13:00–13:${String(RATING_REMINDER_WINDOW_END_MINUTE_EXCLUSIVE).padStart(2, '0')}`,
      );
      process.exit(0);
    }

    if (_.isEmpty(process.env.TELEGRAM_TOKEN ?? '')) {
      this.loggerService.warn(TAG, 'Пропуск: не задан TELEGRAM_TOKEN');
      process.exit(0);
    }

    if (_.isEmpty(resolveTelegramWebAppPublicOrigin())) {
      this.loggerService.warn(TAG, 'Пропуск: не задан публичный URL Mini App (NEXT_PUBLIC_TELEGRAM_WEB_APP_ORIGIN / serverHost)');
      process.exit(0);
    }

    await this.databaseService.init();

    await this.telegramBotService.init({ mode: 'outboundOnly' });

    this.loggerService.info(TAG, 'Процесс запущен');

    const thresholdUtc = moment.tz(MOSCOW_TIMEZONE_NAME).subtract(7, 'days').toDate();

    const manager = this.databaseService.getManager();

    const orders = await manager
      .createQueryBuilder(OrderEntity, 'order')
      .setParameters({
        status: OrderStatusEnum.COMPLETED,
        threshold: thresholdUtc,
      })
      .select(['order.id'])
      .leftJoin('order.user', 'user')
      .addSelect([
        'user.id',
        'user.telegramId',
        'user.lang',
      ])
      .where('order.status = :status')
      .andWhere('user.telegramId IS NOT NULL')
      .andWhere('order.telegramOrderRatingReminderSentAt IS NULL')
      .andWhere('order.updated <= :threshold')
      .andWhere(`EXISTS (
        SELECT 1
        FROM "chokers"."order_position" AS "order_position"
        WHERE "order_position"."order_id" = "order"."id"
          AND "order_position"."deleted" IS NULL
          AND NOT EXISTS (
            SELECT 1
            FROM "chokers"."grade" AS "grade"
            WHERE "grade"."position_id" = "order_position"."id"
              AND "grade"."user_id" = "user"."id"
              AND "grade"."deleted" IS NULL
          )
      )`)
      .getMany();

    this.loggerService.info(TAG, `Найдено заказов для напоминания: ${orders.length}`);

    const orderIdsReminderSentSuccessfully: number[] = [];

    for (const order of orders) {
      const { telegramId, lang } = order.user;

      if (_.isEmpty(telegramId) || _.isNil(telegramId)) {
        continue;
      }

      const telegramChatId = telegramId;

      const userLang = _.isNil(lang) ? UserLangEnum.RU : lang;

      try {
        const sendResult = await this.telegramService.sendCompletedOrderRatingReminder(
          order.id,
          telegramChatId,
          userLang,
        );

        if (!_.isNil(sendResult)) {
          orderIdsReminderSentSuccessfully.push(order.id);
        } else {
          this.loggerService.warn(TAG, `Заказ ${order.id}: Telegram не вернул message_id, флаг не выставлен`);
        }
      } catch (error) {
        this.loggerService.error(TAG, `Ошибка отправки для заказа ${order.id}, telegramId=${telegramId}`, error);
      }
    }

    if (!_.isEmpty(orderIdsReminderSentSuccessfully)) {
      const reminderSentAt = new Date();

      await manager
        .createQueryBuilder()
        .update(OrderEntity)
        .set({ telegramOrderRatingReminderSentAt: reminderSentAt })
        .where('id IN (:...orderIds)', { orderIds: orderIdsReminderSentSuccessfully })
        .execute();
    }

    this.loggerService.info(TAG, `Отправлено напоминаний: ${orderIdsReminderSentSuccessfully.length}. Процесс завершён`);

    process.exit(0);
  };
}

const cron = new TelegramOrderRatingReminderCron();

await cron.start().catch((error) => {
  cron.loggerService.error(TAG, error);
  process.exit(1);
});

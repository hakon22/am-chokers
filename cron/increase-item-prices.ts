import { Container } from 'typescript-ioc';
import 'dotenv/config';
import _ from 'lodash';

import { ItemEntity } from '@server/db/entities/item.entity';
import { LoggerService } from '@server/services/app/logger.service';
import { DatabaseService } from '@server/db/database.service';
import { RedisService } from '@server/db/redis.service';
import { RedisKeyEnum } from '@server/types/db/enums/redis-key.enum';
import { adjustPriceByPercentAndMultiple } from '@server/utilities/item-price-adjust';
import { ItemHistoryService, ITEM_HISTORY_FIELD_PRICE } from '@server/services/item/item.history.service';

const TAG = 'IncreaseItemPrices';

/** Увеличивает или уменьшает цены всех товаров на процент с округлением до заданной кратности */
class IncreaseItemPricesCron {

  public readonly loggerService = Container.get(LoggerService);

  private readonly databaseService = Container.get(DatabaseService);

  private readonly redisService = Container.get(RedisService);

  private readonly itemHistoryService = Container.get(ItemHistoryService);

  public start = async () => {
    await this.databaseService.init();
    await this.redisService.init({ withoutSubscribles: true });

    // Получаем аргументы из командной строки
    const percentageArg = process.argv[2];
    const multipleArg = process.argv[3];

    if (_.isEmpty(percentageArg) || _.isEmpty(multipleArg)) {
      this.loggerService.error(TAG, 'Необходимо указать два аргумента: процент (положительный — рост, отрицательный — снижение) и кратность');
      process.exit(1);
    }

    const percentage = parseFloat(percentageArg);
    const multiple = parseInt(multipleArg, 10);

    if (Number.isNaN(percentage) || Number.isNaN(multiple) || multiple <= 0) {
      this.loggerService.error(TAG, 'Аргументы должны быть корректными числами. Кратность должна быть больше 0');
      process.exit(1);
    }

    this.loggerService.info(TAG, `Процесс запущен. Процент: ${percentage}%, Кратность: ${multiple}`);

    // Получаем все товары
    const itemIds = await ItemEntity.find({ select: ['id'], withDeleted: true });

    if (_.isEmpty(itemIds)) {
      this.loggerService.info(TAG, 'Товары не найдены');
      process.exit(0);
    }

    const items = await this.redisService.getItemsByIds<ItemEntity>(RedisKeyEnum.ITEM_BY_ID, itemIds.map(({ id }) => id));

    let updatedCount = 0;

    // Обновляем цены товаров
    const itemsToUpdate: ItemEntity[] = [];
    const priceChangeLog: { id: number; oldPrice: number; newPrice: number; }[] = [];

    for (const item of items) {
      const oldPrice = item.price;
      const newPrice = adjustPriceByPercentAndMultiple(oldPrice, percentage, multiple);

      if (oldPrice !== newPrice) {
        item.price = newPrice;
        itemsToUpdate.push(item);
        priceChangeLog.push({ id: item.id, oldPrice, newPrice });
        updatedCount += 1;

        this.loggerService.info(TAG, `Товар ID ${item.id}: ${oldPrice} -> ${newPrice}`);
      }
    }

    // Сохраняем изменения
    if (updatedCount) {
      await ItemEntity.save(itemsToUpdate.map(({ id, price }) => ({ id, price } as ItemEntity)));
      const manager = this.databaseService.getManager();
      for (const { id, oldPrice, newPrice } of priceChangeLog) {
        await this.itemHistoryService.persistSingleDelta(manager, id, null, {
          field: ITEM_HISTORY_FIELD_PRICE,
          oldValue: String(oldPrice),
          newValue: String(newPrice),
        });
      }
      await this.redisService.setItems(RedisKeyEnum.ITEM_BY_ID, itemsToUpdate);
    }

    this.loggerService.info(TAG, `Процесс завершён. Обновлено товаров: ${updatedCount}`);
    process.exit(0);
  };
}

const cron = new IncreaseItemPricesCron();

await cron.start().catch((e) => {
  cron.loggerService.error(TAG, e);
  process.exit(1);
});

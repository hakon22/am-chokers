import { Container } from 'typescript-ioc';
import 'dotenv/config';

import { ItemEntity } from '@server/db/entities/item.entity';
import { LoggerService } from '@server/services/app/logger.service';
import { DatabaseService } from '@server/db/database.service';
import { RedisService } from '@server/db/redis.service';
import { RedisKeyEnum } from '@server/types/db/enums/redis-key.enum';

const TAG = 'IncreaseItemPrices';

/** Увеличивает цены всех товаров на определённый процент с округлением до заданной кратности */
class IncreaseItemPricesCron {

  public readonly loggerService = Container.get(LoggerService);

  private readonly databaseService = Container.get(DatabaseService);

  private readonly redisService = Container.get(RedisService);

  /**
   * Рассчитывает новую цену товара
   * @param price - текущая цена товара
   * @param percentage - процент увеличения (например, 10 для 10%)
   * @param multiple - кратность для округления (например, 100)
   * @returns новая цена, округлённая до кратного значения в большую сторону
   */
  private calculateNewPrice = (price: number, percentage: number, multiple: number): number => {
    // Увеличиваем цену на процент
    const priceWithPercentage = price * (1 + percentage / 100);

    // Округляем до кратного значения в большую сторону
    const newPrice = Math.ceil(priceWithPercentage / multiple) * multiple;

    return newPrice;
  };

  public start = async () => {
    await this.databaseService.init();
    await this.redisService.init({ withoutSubscribles: true });

    // Получаем аргументы из командной строки
    const percentageArg = process.argv[2];
    const multipleArg = process.argv[3];

    if (!percentageArg || !multipleArg) {
      this.loggerService.error(TAG, 'Необходимо указать два аргумента: процент увеличения и кратность');
      process.exit(1);
    }

    const percentage = parseFloat(percentageArg);
    const multiple = parseInt(multipleArg, 10);

    if (isNaN(percentage) || isNaN(multiple) || multiple <= 0) {
      this.loggerService.error(TAG, 'Аргументы должны быть корректными числами. Кратность должна быть больше 0');
      process.exit(1);
    }

    this.loggerService.info(TAG, `Процесс запущен. Процент: ${percentage}%, Кратность: ${multiple}`);

    // Получаем все товары
    const itemIds = await ItemEntity.find({ select: ['id'], withDeleted: true });

    if (!itemIds.length) {
      this.loggerService.info(TAG, 'Товары не найдены');
      process.exit(0);
    }

    const items = await this.redisService.getItemsByIds<ItemEntity>(RedisKeyEnum.ITEM_BY_ID, itemIds.map(({ id }) => id));

    let updatedCount = 0;

    // Обновляем цены товаров
    const itemsToUpdate: ItemEntity[] = [];

    for (const item of items) {
      const oldPrice = item.price;
      const newPrice = this.calculateNewPrice(oldPrice, percentage, multiple);

      if (oldPrice !== newPrice) {
        item.price = newPrice;
        itemsToUpdate.push(item);
        updatedCount += 1;

        this.loggerService.info(TAG, `Товар ID ${item.id}: ${oldPrice} -> ${newPrice}`);
      }
    }

    // Сохраняем изменения
    if (updatedCount) {
      await ItemEntity.save(itemsToUpdate.map(({ id, price }) => ({ id, price } as ItemEntity)));
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

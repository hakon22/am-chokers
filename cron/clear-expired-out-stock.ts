import { Container } from 'typescript-ioc';
import 'dotenv/config';
import _ from 'lodash';

import { LoggerService } from '@server/services/app/logger.service';
import { DatabaseService } from '@server/db/database.service';
import { RedisService } from '@server/db/redis.service';
import { ItemService } from '@server/services/item/item.service';

const TAG = 'ClearExpiredOutStock';

/** Снимает «Нет в наличии» у товаров, которые с текущего дня уже можно купить */
class ClearExpiredOutStockCron {
  public readonly loggerService = Container.get(LoggerService);

  private readonly databaseService = Container.get(DatabaseService);

  private readonly redisService = Container.get(RedisService);

  private readonly itemService = Container.get(ItemService);

  /**
   * Инициализирует БД и Redis, снимает истёкший `outStock` и завершает процесс
   * @returns `Promise`, завершающийся выходом процесса
   */
  public start = async () => {
    await this.databaseService.init();
    await this.redisService.init({ withoutSubscribles: true });

    this.loggerService.info(TAG, 'Процесс запущен');

    const { affectedCount, itemIds } = await this.itemService.clearExpiredOutStock();

    if (_.isEmpty(itemIds)) {
      this.loggerService.info(TAG, 'Нет товаров для снятия «Нет в наличии»');
      process.exit(0);
    }

    this.loggerService.info(TAG, `Снято «Нет в наличии»: ${affectedCount} (${itemIds.join(', ')})`);
    this.loggerService.info(TAG, 'Процесс завершён');

    process.exit(0);
  };
}

const cron = new ClearExpiredOutStockCron();

await cron.start().catch((error) => {
  cron.loggerService.error(TAG, error);
  process.exit(1);
});

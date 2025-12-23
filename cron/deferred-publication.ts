import path from 'path';

import moment from 'moment';
import { Container } from 'typescript-ioc';
import { Between, IsNull } from 'typeorm';
import 'dotenv/config';

import { DeferredPublicationEntity } from '@server/db/entities/deferred.publication.entity'; 
import { LoggerService } from '@server/services/app/logger.service';
import { DatabaseService } from '@server/db/database.service';
import { RedisService } from '@server/db/redis.service';
import { BullMQQueuesService } from '@microservices/sender/queues/bull-mq-queues.service';
import { UserLangEnum } from '@server/types/user/enums/user.lang.enum';
import { ItemEntity } from '@server/db/entities/item.entity';
import { catalogPath, routes } from '@/routes';
import { RedisKeyEnum } from '@server/types/db/enums/redis-key.enum';

const TAG = 'DeferredPublication';

/** Публикация товаров из отложенного списка */
class DeferredPublicationCron {

  public readonly loggerService = Container.get(LoggerService);

  private readonly databaseService = Container.get(DatabaseService);

  private readonly redisService = Container.get(RedisService);

  private readonly bullMQQueuesService = Container.get(BullMQQueuesService);

  public start = async () => {

    await this.databaseService.init();
    await this.redisService.init({ withoutSubscribles: true });

    this.loggerService.info(TAG, 'Процесс запущен');

    const now = moment();

    const from = now.clone().subtract(3, 'minute').toDate();
    const to = now.clone().add(3, 'minute').toDate();

    const [deferredPublications, publicationItems] = await Promise.all([
      DeferredPublicationEntity.find({
        where: {
          date: Between(from, to),
          isPublished: false,
          item: {
            publicationDate: IsNull(),
          },
        },
        relations: ['item'],
      }),
      ItemEntity.find({
        where: {
          publicationDate: Between(from, to),
        },
        relations: ['translations'],
      }),
    ]);

    if (!deferredPublications.length && !publicationItems.length) {
      this.loggerService.info(TAG, 'Нет товаров для публикации');
      process.exit(0);
    }

    const items = deferredPublications.length
      ? await this.redisService.getItemsByIds<ItemEntity>(RedisKeyEnum.ITEM_BY_ID, deferredPublications.map(({ item }) => item.id))
      : [];

    for (const item of items) {
      const deferredValue = deferredPublications.find((deferredPublication) => deferredPublication.item.id === item.id);

      if (!deferredValue) {
        continue;
      }

      await DeferredPublicationEntity.update(deferredValue.id, { isPublished: true });

      if (item.deferredPublication) {
        item.deferredPublication.isPublished = true;
        await this.redisService.updateItemById(RedisKeyEnum.ITEM_BY_ID, item);
      }

      this.publishProcess(item, deferredValue.description);

      await new Promise((resolve) => setTimeout(resolve, 3000));
    }

    if (publicationItems.length) {
      const ids = publicationItems.map(({ id }) => id);

      await ItemEntity
        .createQueryBuilder('item')
        .update()
        .set({ publicationDate: null })
        .where('"item"."id" IN(:...ids)', { ids })
        .execute();

      const needUpdateItems = await this.redisService.getItemsByIds<ItemEntity>(RedisKeyEnum.ITEM_BY_ID, ids);

      needUpdateItems.forEach((item) => {
        item.publicationDate = null;
      });
      await this.redisService.setItems(RedisKeyEnum.ITEM_BY_ID, needUpdateItems);
    }

    if (items.length) {
      this.loggerService.info(TAG, `Опубликованных товаров в Telegram: ${items.length} (${items.map(({ translations }) => translations.find(({ lang }) => lang === UserLangEnum.RU)?.name).join(', ').trim()})`);
    }
    if (publicationItems.length) {
      this.loggerService.info(TAG, `Опубликованных товаров на сайт: ${publicationItems.length} (${publicationItems.map(({ translations }) => translations.find(({ lang }) => lang === UserLangEnum.RU)?.name).join(', ').trim()})`);
    }

    this.loggerService.info(TAG, 'Процесс завершён');

    process.exit(0);
  };

  private publishProcess = (item: ItemEntity, description?: string) => {
    if (!process.env.TELEGRAM_GROUP_ID) {
      return;
    }
  
    const url = this.getUrl(item);
  
    const values: string[] = (description || item.translations.find((translation) => translation.lang === UserLangEnum.RU)?.description as string).split('\n');
  
    const message = [
      ...values,
      '',
      ...(item?.collection ? [`Коллекция: <b>${item.collection.translations.find((translation) => translation.lang === UserLangEnum.RU)?.name}</b>`] : []),
      `Цена: <b>${item.price - item.discountPrice} ₽</b>`,
      '',
      `${process.env.NEXT_PUBLIC_PRODUCTION_HOST}${url}`,
    ];

    this.bullMQQueuesService.sendTelegramMessage({ message, item, telegramId: process.env.TELEGRAM_GROUP_ID, images: item.images.map(({ src }) => `${process.env.NEXT_PUBLIC_PRODUCTION_HOST}${src}`) });
  };
  
  private getUrl = (item: Pick<ItemEntity, 'group' | 'translateName'>) => path.join(routes.page.base.homePage, catalogPath.slice(1), item.group.code, item.translateName).replaceAll('\\', '/');
}

const cron = new DeferredPublicationCron();

await cron.start().catch((e) => {
  cron.loggerService.error(TAG, e);
  process.exit(0);
});

import path from 'path';

import moment from 'moment';
import { Container } from 'typescript-ioc';
import { Between, In, IsNull } from 'typeorm';
import 'dotenv/config';

import { DeferredPublicationEntity } from '@server/db/entities/deferred.publication.entity'; 
import { LoggerService } from '@server/services/app/logger.service';
import { DatabaseService } from '@server/db/database.service';
import { TelegramService } from '@server/services/integration/telegram.service';
import { UserLangEnum } from '@server/types/user/enums/user.lang.enum';
import { ItemEntity } from '@server/db/entities/item.entity';
import { catalogPath, routes } from '@/routes';

const TAG = 'DeferredPublication';

/** Публикация товаров из отложенного списка */
class DeferredPublicationCron {

  public readonly loggerService = Container.get(LoggerService);

  private readonly databaseService = Container.get(DatabaseService);

  private readonly telegramService = Container.get(TelegramService);

  public start = async () => {

    await this.databaseService.init();

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
      ? await ItemEntity.find({
        where: { id: In(deferredPublications.map(({ item }) => item.id)) },
        relations: [
          'translations',
          'group',
          'collection',
          'collection.translations',
          'images',
        ],
      })
      : [];

    for (const item of items) {
      const deferredValue = deferredPublications.find((deferredPublication) => deferredPublication.item.id === item.id);

      if (!deferredValue) {
        continue;
      }

      await this.publishProcess(item, deferredValue.description);
      await DeferredPublicationEntity.update(deferredValue.id, { isPublished: true });

      await new Promise((resolve) => setTimeout(resolve, 3000));
    }

    if (publicationItems.length) {
      await ItemEntity
        .createQueryBuilder('item')
        .update()
        .set({ publicationDate: null })
        .where('item.id IN(:...ids)', { ids: publicationItems.map(({ id }) => id) })
        .execute();
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

  private publishProcess = async (item: ItemEntity, description?: string) => {
    if (!process.env.TELEGRAM_GROUP_ID) {
      return;
    }
  
    const url = this.getUrl(item);
  
    const values: string[] = (description || item.translations.find((translation) => translation.lang === UserLangEnum.RU)?.description as string).split('\n');
  
    const text = [
      ...values,
      '',
      ...(item?.collection ? [`Коллекция: <b>${item.collection.translations.find((translation) => translation.lang === UserLangEnum.RU)?.name}</b>`] : []),
      `Цена: <b>${item.price - item.discountPrice} ₽</b>`,
      '',
      `${process.env.NEXT_PUBLIC_PRODUCTION_HOST}${url}`,
    ];
  
    const message = await this.telegramService.sendMessageWithPhotos(text, item.images.map(({ src }) => `${process.env.NEXT_PUBLIC_PRODUCTION_HOST}${src}`), process.env.TELEGRAM_GROUP_ID);
  
    if (message?.history) {
      await ItemEntity.update(item.id, { message: message.history });
      item.message = message.history;
    }
  };
  
  private getUrl = (item: Pick<ItemEntity, 'group' | 'translateName'>) => path.join(routes.page.base.homePage, catalogPath.slice(1), item.group.code, item.translateName).replaceAll('\\', '/');
}

const cron = new DeferredPublicationCron();

await cron.start().catch((e) => {
  cron.loggerService.error(TAG, e);
  process.exit(0);
});

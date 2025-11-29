import { Container, Singleton } from 'typescript-ioc';

import { ItemCollectionEntity } from '@server/db/entities/item.collection.entity';
import { ItemCollectionTranslateEntity } from '@server/db/entities/item.collection.translate.entity';
import { TranslationHelper } from '@server/utilities/translation.helper';
import { ItemService } from '@server/services/item/item.service';
import { ItemEntity } from '@server/db/entities/item.entity';
import { UserLangEnum } from '@server/types/user/enums/user.lang.enum';
import { RedisKeyEnum } from '@server/types/db/enums/redis-key.enum';
import type { ItemCollectionQueryInterface } from '@server/types/item/item.collection.query.interface';
import type { ParamsIdInterface } from '@server/types/params.id.interface';
import type { ItemCollectionOptionsInterface } from '@server/types/item/item.collection.options.interface';

@Singleton
export class ItemCollectionService extends TranslationHelper {
  private readonly itemService = Container.get(ItemService);

  private createQueryBuilder = (query?: ItemCollectionQueryInterface, options?: ItemCollectionOptionsInterface) => {
    const manager = options?.manager || this.databaseService.getManager();

    const builder = manager.createQueryBuilder(ItemCollectionEntity, 'itemCollection')
      .select([
        'itemCollection.id',
        'itemCollection.description',
        'itemCollection.deleted',
      ])
      .leftJoin('itemCollection.translations', 'translations')
      .addSelect([
        'translations.id',
        'translations.name',
        'translations.lang',
      ])
      .orderBy('itemCollection.id', 'DESC');

    if (query?.withDeleted) {
      builder.withDeleted();
    }
    if (query?.names?.length) {
      builder.andWhere('translations.name IN(:...names)', { names: query.names });
    }
    if (query?.excludeIds?.length) {
      builder.andWhere('itemCollection.id NOT IN(:...excludeIds)', { excludeIds: query.excludeIds });
    }

    return builder;
  };

  public exist = async (query: ItemCollectionQueryInterface, options?: ItemCollectionOptionsInterface) => {
    const builder = this.createQueryBuilder(query, options).withDeleted();

    const isExist = await builder.getExists();

    return isExist;
  };

  public createOne = async (body: ItemCollectionEntity) => {
    const isExist = await this.exist({ names: body.translations.map((translation) => translation.name) });

    if (isExist) {
      return { code: 2 };
    }

    const itemCollection = await this.createEntityWithTranslations(ItemCollectionEntity, ItemCollectionTranslateEntity, body, 'collection');

    return { code: 1, itemCollection };
  };

  public findOne = async (params: ParamsIdInterface, lang: UserLangEnum, query?: ItemCollectionQueryInterface, options?: ItemCollectionOptionsInterface) => {
    const builder = this.createQueryBuilder(query, options)
      .andWhere('itemCollection.id = :id', { id: params.id });

    const itemCollection = await builder.getOne();

    if (!itemCollection) {
      throw new Error(lang === UserLangEnum.RU
        ? `Коллекции товаров с номером #${params.id} не существует.`
        : `Product collection with number #${params.id} does not exist.`);
    }

    return itemCollection;
  };

  public findMany = async (query?: ItemCollectionQueryInterface) => {
    const builder = this.createQueryBuilder(query);

    return builder.getMany();
  };

  public updateOne = async (params: ParamsIdInterface, body: ItemCollectionEntity, lang: UserLangEnum) => {
    const { translations: oldTranslations, ...itemCollection } = await this.findOne(params, lang, { withDeleted: true });

    const isExist = await this.exist({ names: body.translations.map((translation) => translation.name), excludeIds: [itemCollection.id] });

    if (isExist) {
      return { code: 2 };
    }

    const updated = await this.databaseService.getManager().transaction(async (manager) => {
      const itemCollectionRepo = manager.getRepository(ItemCollectionEntity);
      const itemCollectionTranslateRepo = manager.getRepository(ItemCollectionTranslateEntity);

      const { translations, ...rest } = body;

      await this.syncTranslations(itemCollectionTranslateRepo, translations, oldTranslations, itemCollection, 'collection');

      await itemCollectionRepo.update(params, rest);

      return this.findOne(params, lang, undefined, { manager });
    });

    const items = await this.itemService.findMany({ collectionIds: [itemCollection.id], withDeleted: true }, { withoutCache: true, withGrades: true, fullItem: true });
    await this.redisService.setItems(RedisKeyEnum.ITEM_BY_ID, items);

    return { code: 1, itemCollection: updated };
  };

  public deleteOne = async (params: ParamsIdInterface, lang: UserLangEnum) => {
    const itemCollection = await this.findOne(params, lang);

    const items = await this.itemService.findMany({ collectionIds: [itemCollection.id], withDeleted: true });
    items.forEach((item) => {
      item.collection = null;
    });

    const deletedItemCollection = await this.databaseService.getManager().transaction(async (manager) => {
      const itemRepo = manager.getRepository(ItemEntity);
      const itemCollectionRepo = manager.getRepository(ItemCollectionEntity);

      if (items.length) {
        await itemRepo
          .createQueryBuilder('item')
          .update()
          .set({ collection: null })
          .where('item.id IN(:...ids)', { ids: items.map(({ id }) => id) })
          .execute();

        await this.redisService.setItems(RedisKeyEnum.ITEM_BY_ID, items);
      }

      await itemCollectionRepo.softRemove(itemCollection);

      itemCollection.deleted = new Date();
      return itemCollection;
    });

    return deletedItemCollection;
  };

  public restoreOne = async (params: ParamsIdInterface, lang: UserLangEnum) => {
    const deletedItemCollection = await this.findOne(params, lang, { withDeleted: true });

    await deletedItemCollection.recover();

    deletedItemCollection.deleted = null;

    return deletedItemCollection;
  };
}

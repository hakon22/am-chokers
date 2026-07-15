import path from 'path';

import _ from 'lodash';
import { Container, Singleton } from 'typescript-ioc';
import type { EntityManager } from 'typeorm';

import { ItemGroupEntity } from '@server/db/entities/item.group.entity';
import { ItemGroupTranslateEntity } from '@server/db/entities/item.group.translate.entity';
import { AiItemGroupTryOnEntity } from '@server/db/entities/ai/ai-item-group-try-on.entity';
import { TranslationHelper } from '@server/utilities/translation.helper';
import { ItemService } from '@server/services/item/item.service';
import { UploadPathService } from '@server/services/storage/upload.path.service';
import { ItemEntity } from '@server/db/entities/item.entity';
import { UserLangEnum } from '@server/types/user/enums/user.lang.enum';
import { AiTryOnVtoTypeEnum } from '@server/types/ai/enums/ai-try-on-vto-type.enum';
import { AiPromptTypeEnum } from '@server/types/ai/enums/ai-prompt-type.enum';
import { catalogPath, routes } from '@/routes';
import { RedisKeyEnum } from '@server/types/db/enums/redis-key.enum';
import type { ItemGroupQueryInterface } from '@server/types/item/item.group.query.interface';
import type { ParamsIdInterface } from '@server/types/params.id.interface';
import type { ItemGroupOptionsInterface } from '@server/types/item/item.group.options.interface';

/** Тело create/update группы: сущность + вложенный конфиг примерки */
type ItemGroupBodyWithTryOn = ItemGroupEntity & {
  tryOn?: {
    isEnabled?: boolean;
    vtoType?: AiTryOnVtoTypeEnum | null;
  };
};

@Singleton
export class ItemGroupService extends TranslationHelper {
  private readonly itemService = Container.get(ItemService);

  private readonly uploadPathService = Container.get(UploadPathService);

  /**
   * Собирает QueryBuilder групп с переводами и конфигом AI-примерки
   * @param query - фильтры выборки
   * @param options - менеджер транзакции / onlyIds / кэш
   * @returns QueryBuilder ItemGroupEntity
   */
  private createQueryBuilder = (query?: ItemGroupQueryInterface, options?: ItemGroupOptionsInterface) => {
    const manager = options?.manager || this.databaseService.getManager();

    const builder = manager.createQueryBuilder(ItemGroupEntity, 'itemGroup');

    if (options?.onlyIds) {
      builder
        .select('itemGroup.id')
        .distinct(true);
    } else {
      builder.select([
        'itemGroup.id',
        'itemGroup.code',
        'itemGroup.order',
        'itemGroup.deleted',
      ])
        .leftJoin('itemGroup.translations', 'translations')
        .addSelect([
          'translations.id',
          'translations.name',
          'translations.description',
          'translations.lang',
        ])
        .leftJoin('itemGroup.tryOn', 'tryOn')
        .addSelect([
          'tryOn.id',
          'tryOn.isEnabled',
          'tryOn.vtoType',
          'tryOn.validationPromptType',
        ])
        .orderBy('itemGroup.order', 'ASC');
    }

    if (query?.withDeleted) {
      builder.withDeleted();
    }
    if (query?.code) {
      builder.andWhere('itemGroup.code = :code', { code: query.code });
    }
    if (query?.excludeIds?.length) {
      builder.andWhere('itemGroup.id NOT IN(:...excludeIds)', { excludeIds: query.excludeIds });
    }
    if (query?.includeIds?.length) {
      builder.andWhere('itemGroup.id IN(:...includeIds)', { includeIds: query.includeIds });
    }

    return builder;
  };

  /**
   * Проверяет существование группы по фильтрам
   * @param query - фильтры (code, excludeIds и т.д.)
   * @param options - опции запроса
   * @returns true, если группа есть
   */
  public exist = async (query: ItemGroupQueryInterface, options?: ItemGroupOptionsInterface) => {
    const builder = this.createQueryBuilder(query, options).withDeleted();

    const isExist = await builder.getExists();

    return isExist;
  };

  /**
   * Создаёт группу товаров и строку конфига AI-примерки
   * @param body - код, переводы и опциональный tryOn
   * @returns код результата и созданная группа
   */
  public createOne = async (body: ItemGroupBodyWithTryOn) => {
    const { tryOn: tryOnBody, ...groupBody } = body;

    const [isExist, count] = await Promise.all([
      this.exist({ code: groupBody.code }),
      ItemGroupEntity.count({ withDeleted: true }),
    ]);

    if (isExist) {
      return { code: 2 };
    }

    const isEnabled = Boolean(tryOnBody?.isEnabled);
    const vtoType = tryOnBody?.vtoType ?? null;

    if (isEnabled && _.isNil(vtoType)) {
      this.loggerService.warn('ItemGroupService', `Создание группы «${groupBody.code}»: AI-примерка включена без vtoType`);
      return { code: 3 };
    }

    groupBody.order = count;

    const itemGroup = await this.databaseService.getManager().transaction(async (manager) => {
      const created = await this.createEntityWithTranslations(
        ItemGroupEntity,
        ItemGroupTranslateEntity,
        groupBody as ItemGroupEntity,
        'group',
        manager,
      );

      await this.upsertTryOnConfig(manager, created.id, {
        isEnabled,
        vtoType,
      });

      return this.findOne({ id: created.id }, UserLangEnum.RU, undefined, { withoutCache: true, manager });
    });

    this.loggerService.info('ItemGroupService', `Создана группа #${itemGroup.id} «${itemGroup.code}», tryOn.isEnabled=${isEnabled}`);

    this.uploadPathService.createSitemap(this.getUrl(itemGroup), true);

    await this.redisService.updateItemById(RedisKeyEnum.ITEM_GROUP_BY_ID, itemGroup);

    return { code: 1, itemGroup };
  };

  /**
   * Находит группу по id (из кэша или БД)
   * @param params - id группы
   * @param lang - язык сообщений об ошибках
   * @param query - дополнительные фильтры
   * @param options - withoutCache / manager
   * @returns группа товаров
   */
  public findOne = async (params: ParamsIdInterface, lang: UserLangEnum, query?: ItemGroupQueryInterface, options?: ItemGroupOptionsInterface) => {
    if (!options?.withoutCache) {
      if (!options) {
        options = {};
      }
      options.onlyIds = true;
    }

    const builder = this.createQueryBuilder(query, options)
      .andWhere('itemGroup.id = :id', { id: params.id });

    const itemGroup = await builder.getOne();

    if (!itemGroup) {
      throw new Error(lang === UserLangEnum.RU
        ? `Группы товаров с номером #${params.id} не существует.`
        : `Item group with number #${params.id} does not exist.`);
    }

    if (options?.withoutCache) {
      return itemGroup;
    }

    const redisItemGroup = await this.redisService.getItemById<ItemGroupEntity>(RedisKeyEnum.ITEM_GROUP_BY_ID, itemGroup.id);

    if (!redisItemGroup) {
      throw new Error(lang === UserLangEnum.RU
        ? `Группы товаров с номером #${params.id} не существует в кэше.`
        : `Item group with number #${params.id} does not exist in cache.`);
    }

    return redisItemGroup;
  };

  /**
   * Список групп (из кэша или БД)
   * @param query - фильтры
   * @param options - withoutCache / onlyIds
   * @returns массив групп
   */
  public findMany = async (query?: ItemGroupQueryInterface, options?: ItemGroupOptionsInterface) => {
    if (!options?.withoutCache) {
      if (!options) {
        options = {};
      }
      options.onlyIds = true;
    }
    const builder = this.createQueryBuilder(query, options);

    const itemGroups = await builder.getMany();

    return options?.withoutCache
      ? itemGroups
      : this.redisService.getItemsByIds<ItemGroupEntity>(RedisKeyEnum.ITEM_GROUP_BY_ID, itemGroups.map(({ id }) => id));
  };

  /**
   * Находит группу по коду
   * @param query - должен содержать code
   * @param lang - язык сообщений об ошибках
   * @param options - withoutCache / manager
   * @returns группа товаров
   */
  public getByCode = async (query: ItemGroupQueryInterface, lang: UserLangEnum, options?: ItemGroupOptionsInterface) => {
    if (!options?.withoutCache) {
      if (!options) {
        options = {};
      }
      options.onlyIds = true;
    }

    const builder = this.createQueryBuilder(query, options);

    const itemGroup = await builder.getOne();

    if (!itemGroup) {
      throw new Error(lang === UserLangEnum.RU
        ? `Группы товаров с кодом ${query.code} не существует.`
        : `Item group with code ${query.code} does not exist.`);
    }

    if (options?.withoutCache) {
      return itemGroup;
    }

    const redisItemGroup = await this.redisService.getItemById<ItemGroupEntity>(RedisKeyEnum.ITEM_GROUP_BY_ID, itemGroup.id);

    if (!redisItemGroup) {
      throw new Error(lang === UserLangEnum.RU
        ? `Группы товаров с кодом ${query.code} не существует в кэше.`
        : `Item group with code ${query.code} does not exist in cache.`);
    }

    return redisItemGroup;
  };

  /**
   * Обновляет группу и конфиг AI-примерки
   * @param params - id группы
   * @param body - код, переводы и tryOn
   * @param lang - язык сообщений
   * @returns код результата и обновлённая группа
   */
  public updateOne = async (params: ParamsIdInterface, body: ItemGroupBodyWithTryOn, lang: UserLangEnum) => {
    const { translations: oldTranslations, ...itemGroup } = await this.findOne(params, lang, { withDeleted: true });

    const { tryOn: tryOnBody, translations, ...rest } = body;

    const isExist = await this.exist({ code: rest.code, excludeIds: [itemGroup.id] });

    if (isExist) {
      return { code: 2 };
    }

    const isEnabled = Boolean(tryOnBody?.isEnabled);
    const vtoType = tryOnBody?.vtoType ?? null;

    if (isEnabled && _.isNil(vtoType)) {
      this.loggerService.warn('ItemGroupService', `Обновление группы #${params.id}: AI-примерка включена без vtoType`);
      return { code: 3 };
    }

    const updated = await this.databaseService.getManager().transaction(async (manager) => {
      const itemGroupRepo = manager.getRepository(ItemGroupEntity);
      const itemGroupTranslateRepo = manager.getRepository(ItemGroupTranslateEntity);

      await this.syncTranslations(itemGroupTranslateRepo, translations, oldTranslations, itemGroup, 'group');

      await itemGroupRepo.update(params, rest);

      await this.upsertTryOnConfig(manager, params.id, {
        isEnabled,
        vtoType,
      });

      return this.findOne(params, lang, { withDeleted: true }, { withoutCache: true, manager });
    });

    this.loggerService.info(
      'ItemGroupService',
      `Обновлена группа #${updated.id} «${updated.code}», tryOn.isEnabled=${isEnabled}, vtoType=${vtoType ?? 'null'}`,
    );

    if (itemGroup.code !== updated.code) {
      this.uploadPathService.updateSitemap(this.getUrl(itemGroup), this.getUrl(updated), true);
    }

    const items = await this.itemService.findMany({ groupIds: [itemGroup.id], withDeleted: true }, { withoutCache: true, withGrades: true, fullItem: true });
    await this.redisService.setItems(RedisKeyEnum.ITEM_BY_ID, items);

    await this.redisService.updateItemById(RedisKeyEnum.ITEM_GROUP_BY_ID, updated);

    return { code: 1, itemGroup: updated };
  };

  /**
   * Мягко удаляет группу и связанные товары
   * @param params - id группы
   * @param lang - язык сообщений
   * @returns удалённая группа
   */
  public deleteOne = async (params: ParamsIdInterface, lang: UserLangEnum) => {
    const itemGroup = await this.findOne(params, lang);

    const items = await this.itemService.findMany({ groupIds: [itemGroup.id], withDeleted: true });

    const deletedItemGroup = await this.databaseService.getManager().transaction(async (manager) => {
      const itemRepo = manager.getRepository(ItemEntity);
      const itemGroupRepo = manager.getRepository(ItemGroupEntity);

      const deleted = new Date();

      items.forEach((value) => {
        value.deleted = deleted;
      });

      if (items.length) {
        await itemRepo
          .createQueryBuilder('item')
          .update()
          .set({ deleted })
          .where('"item"."id" IN(:...ids)', { ids: items.map(({ id }) => id) })
          .execute();

        await this.redisService.setItems(RedisKeyEnum.ITEM_BY_ID, items);
      }

      await itemGroupRepo.softRemove(itemGroup);

      return this.findOne(params, lang, { withDeleted: true }, { withoutCache: true, manager });
    });

    await this.redisService.updateItemById(RedisKeyEnum.ITEM_GROUP_BY_ID, deletedItemGroup);

    return deletedItemGroup;
  };

  /**
   * Восстанавливает группу и связанные товары
   * @param params - id группы
   * @param lang - язык сообщений
   * @returns восстановленная группа
   */
  public restoreOne = async (params: ParamsIdInterface, lang: UserLangEnum) => {
    const deletedItemGroup = await this.findOne(params, lang, { withDeleted: true });

    const items = await this.itemService.findMany({ groupIds: [deletedItemGroup.id], withDeleted: true });

    const itemGroup = await this.databaseService.getManager().transaction(async (manager) => {
      const itemRepo = manager.getRepository(ItemEntity);
      const itemGroupRepo = manager.getRepository(ItemGroupEntity);

      items.forEach((value) => {
        value.deleted = null;
      });

      if (items.length) {
        await itemRepo
          .createQueryBuilder('item')
          .update()
          .set({ deleted: null })
          .where('"item"."id" IN(:...ids)', { ids: items.map(({ id }) => id) })
          .execute();

        await this.redisService.setItems(RedisKeyEnum.ITEM_BY_ID, items);
      }

      await itemGroupRepo.recover(deletedItemGroup);

      return this.findOne(params, lang, { withDeleted: true }, { withoutCache: true, manager });
    });

    await this.redisService.updateItemById(RedisKeyEnum.ITEM_GROUP_BY_ID, itemGroup);

    return itemGroup;
  };

  /**
   * Сохраняет порядок групп после DnD
   * @param body - массив { id } в новом порядке
   * @param query - фильтры (withDeleted и т.д.)
   * @returns обновлённый список групп
   */
  public sort = async (body: { id: number; }[], query: ItemGroupQueryInterface) => {
    const updated: Pick<ItemGroupEntity, 'id' | 'order'>[] = [];

    body.forEach(({ id }, order) => {
      updated.push({ id, order });
    });

    await ItemGroupEntity.save(updated as ItemGroupEntity[]);

    const itemGroups = await this.findMany({ includeIds: body.map(({ id }) => id), ...query }, { withoutCache: true });

    await this.redisService.setItems(RedisKeyEnum.ITEM_GROUP_BY_ID, itemGroups);

    return itemGroups;
  };

  /**
   * Создаёт или обновляет конфиг AI-примерки для группы
   * @param manager - менеджер транзакции
   * @param itemGroupId - id группы каталога
   * @param tryOn - флаг включения и тип VTO
   * @returns сохранённая сущность конфига
   */
  private upsertTryOnConfig = async (
    manager: EntityManager,
    itemGroupId: number,
    tryOn: { isEnabled: boolean; vtoType: AiTryOnVtoTypeEnum | null; },
  ): Promise<AiItemGroupTryOnEntity> => {
    const { isEnabled, vtoType } = tryOn;
    const tryOnRepo = manager.getRepository(AiItemGroupTryOnEntity);

    const existing = await tryOnRepo
      .createQueryBuilder('config')
      .where('config.itemGroup = :itemGroupId', { itemGroupId })
      .getOne();

    const validationPromptType = _.isNil(vtoType)
      ? null
      : this.resolveValidationPromptType(vtoType);

    if (existing) {
      existing.isEnabled = isEnabled;
      existing.vtoType = vtoType;
      existing.validationPromptType = validationPromptType;
      return tryOnRepo.save(existing);
    }

    return tryOnRepo.save({
      itemGroup: { id: itemGroupId } as ItemGroupEntity,
      isEnabled,
      vtoType,
      validationPromptType,
    });
  };

  /**
   * Возвращает тип system-промпта validation по VTO
   * @param vtoType - тип примерки
   * @returns AiPromptTypeEnum
   */
  private resolveValidationPromptType = (vtoType: AiTryOnVtoTypeEnum): AiPromptTypeEnum => {
    switch (vtoType) {
    case AiTryOnVtoTypeEnum.EARRING:
      return AiPromptTypeEnum.TRY_ON_VALIDATION_SYSTEM_EARRING;
    case AiTryOnVtoTypeEnum.NECKLACE:
    default:
      return AiPromptTypeEnum.TRY_ON_VALIDATION_SYSTEM_NECKLACE;
    }
  };

  /**
   * Собирает URL каталога группы для sitemap
   * @param itemGroup - группа с code
   * @returns относительный URL
   */
  private getUrl = (itemGroup: Pick<ItemGroupEntity, 'code'>) => path.join(routes.page.base.homePage, catalogPath.slice(1), itemGroup.code).replaceAll('\\', '/');
}

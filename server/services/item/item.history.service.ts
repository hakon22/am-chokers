import { Singleton } from 'typescript-ioc';
import _ from 'lodash';
import moment from 'moment';
import type { EntityManager } from 'typeorm';

import { BaseService } from '@server/services/app/base.service';
import { ItemHistoryEntity } from '@server/db/entities/item.history.entity';
import { ItemEntity } from '@server/db/entities/item.entity';
import { UserEntity } from '@server/db/entities/user.entity';
import { ImageEntity } from '@server/db/entities/image.entity';
import { CompositionEntity } from '@server/db/entities/composition.entity';
import { ColorEntity } from '@server/db/entities/color.entity';
import { ItemCollectionEntity } from '@server/db/entities/item.collection.entity';
import { ItemGroupEntity } from '@server/db/entities/item.group.entity';
import { UserLangEnum } from '@server/types/user/enums/user.lang.enum';
import type { PassportRequestInterface } from '@server/types/user/user.request.interface';
import type { ItemHistoryDeltaInterface } from '@server/types/item/item.history.delta.interface';
import type { ItemHistoryQueryInterface } from '@server/types/item/item.history.query.interface';

/** Ключ `field` для события «товар создан» */
export const ITEM_HISTORY_FIELD_PRODUCT_CREATED = 'created';

/** Ключ `field` для пометки товара как удалённого */
export const ITEM_HISTORY_FIELD_DELETED = 'deleted';

/** Ключ `field` для изменения цены */
export const ITEM_HISTORY_FIELD_PRICE = 'price';

/** Ключ `field` для даты «нет в наличии» */
export const ITEM_HISTORY_FIELD_OUT_STOCK = 'out_stock';

/** Разделитель элементов списка в `old_value` / `new_value` (многострочный текст) */
const ITEM_HISTORY_LIST_LINE_BREAK = '\n';

type TranslatedNameRow = { lang: UserLangEnum; name: string };

@Singleton
export class ItemHistoryService extends BaseService {

  /**
   * Сравнивает два состояния товара и возвращает список дельт для истории
   * @param beforeItem - сущность до изменений (с переводами и связями `group` / `collection`, если доступны)
   * @param afterItem - сущность после изменений
   * @returns массив изменённых полей
   */
  public buildDeltasBetweenItems = (beforeItem: ItemEntity, afterItem: ItemEntity): ItemHistoryDeltaInterface[] => {
    const deltas: ItemHistoryDeltaInterface[] = [];

    this.recordPairsIfChanged(deltas, [
      ['price', beforeItem.price, afterItem.price],
      ['discount', beforeItem.discount, afterItem.discount],
      ['discount_price', beforeItem.discountPrice, afterItem.discountPrice],
      ['translate_name', beforeItem.translateName, afterItem.translateName],
      ['bestseller', beforeItem.bestseller, afterItem.bestseller],
      ['new', beforeItem.new, afterItem.new],
      ['order', beforeItem.order, afterItem.order],
      ['publication_date', beforeItem.publicationDate, afterItem.publicationDate],
      ['out_stock', beforeItem.outStock, afterItem.outStock],
      ['deleted', beforeItem.deleted, afterItem.deleted],
      ['group', this.serializeGroupLabel(beforeItem.group), this.serializeGroupLabel(afterItem.group)],
      ['collection', this.serializeCollectionLabel(beforeItem.collection), this.serializeCollectionLabel(afterItem.collection)],
      ['images', this.serializeImagesForHistory(beforeItem.images), this.serializeImagesForHistory(afterItem.images)],
      ['compositions', this.serializeCompositionsForHistory(beforeItem.compositions), this.serializeCompositionsForHistory(afterItem.compositions)],
      ['colors', this.serializeColorsForHistory(beforeItem.colors), this.serializeColorsForHistory(afterItem.colors)],
    ]);

    for (const lang of Object.values(UserLangEnum)) {
      const beforeTr = beforeItem.translations?.find((translation) => translation.lang === lang);
      const afterTr = afterItem.translations?.find((translation) => translation.lang === lang);
      const suffix = lang.toLowerCase();
      this.recordPairsIfChanged(deltas, [
        [`name_${suffix}`, beforeTr?.name, afterTr?.name],
        [`description_${suffix}`, beforeTr?.description, afterTr?.description],
        [`length_${suffix}`, beforeTr?.length, afterTr?.length],
      ]);
    }

    return deltas;
  };

  /**
   * Сохраняет строки истории в БД в рамках переданного менеджера
   * @param manager - менеджер транзакции или общий `EntityManager`
   * @param itemId - идентификатор товара
   * @param user - текущий пользователь или `undefined` / `null` для системных действий
   * @param deltas - список изменений
   * @param recordedAt - явное время события (если не задано — время определяет БД / TypeORM)
   * @returns `Promise`, завершающийся после вставки
   */
  public persistDeltas = async (
    manager: EntityManager,
    itemId: number,
    user: PassportRequestInterface | null | undefined,
    deltas: ItemHistoryDeltaInterface[],
    recordedAt?: Date,
  ): Promise<void> => {
    if (_.isEmpty(deltas)) {
      return;
    }
    const repo = manager.getRepository(ItemHistoryEntity);
    const userId = user?.id ?? null;
    const rows = deltas.map((delta) => repo.create({
      field: delta.field,
      oldValue: delta.oldValue,
      newValue: delta.newValue,
      item: { id: itemId } as ItemEntity,
      user: !_.isNil(userId) ? ({ id: userId } as UserEntity) : null,
      ...(!_.isNil(recordedAt) ? { created: recordedAt } : {}),
    }));

    await repo.insert(rows);
  };

  /**
   * Записывает событие «товар создан» одной строкой
   * @param manager - менеджер транзакции
   * @param itemId - идентификатор товара
   * @param user - автор создания (для бэкофила миграции — `null` уже в БД)
   * @param createdAt - время создания товара для колонки `created`
   * @returns `Promise`, завершающийся после вставки
   */
  public recordItemCreated = async (
    manager: EntityManager,
    itemId: number,
    user: PassportRequestInterface | null | undefined,
    createdAt: Date,
  ): Promise<void> => {
    const repo = manager.getRepository(ItemHistoryEntity);
    const userId = user?.id ?? null;
    const row = repo.create({
      field: ITEM_HISTORY_FIELD_PRODUCT_CREATED,
      oldValue: null,
      newValue: null,
      created: createdAt,
      item: { id: itemId } as ItemEntity,
      user: !_.isNil(userId) ? ({ id: userId } as UserEntity) : null,
    });

    await repo.insert(row);
  };

  /**
   * Записывает одну дельту вне пачки (удобно для cron и простых случаев)
   * @param manager - менеджер БД
   * @param itemId - идентификатор товара
   * @param user - пользователь или `null` / `undefined`
   * @param delta - одно изменение
   * @returns `Promise`, завершающийся после вставки
   */
  public persistSingleDelta = async (
    manager: EntityManager,
    itemId: number,
    user: PassportRequestInterface | null | undefined,
    delta: ItemHistoryDeltaInterface,
  ): Promise<void> => {
    await this.persistDeltas(manager, itemId, user, [delta]);
  };

  /**
   * Возвращает историю изменений товара с пагинацией и общим количеством строк
   * @param query - параметры выборки: `itemId` — товар, `limit` — размер страницы, `offset` — смещение
   * @returns кортеж из списка сущностей с подгруженным `user` и общего числа записей
   */
  public findManyByItemId = async (query: ItemHistoryQueryInterface): Promise<[ItemHistoryEntity[], number]> => {
    const { itemId, limit, offset } = query;
    const manager = this.databaseService.getManager();
    const qb = manager
      .createQueryBuilder(ItemHistoryEntity, 'history')
      .select([
        'history.id',
        'history.created',
        'history.field',
        'history.oldValue',
        'history.newValue',
      ])
      .leftJoin('history.user', 'user')
      .addSelect(['user.id', 'user.name'])
      .leftJoin('history.item', 'item')
      .where('item.id = :itemId', { itemId })
      .orderBy('history.created', 'DESC')
      .skip(offset)
      .take(limit);

    return qb.getManyAndCount();
  };

  /**
   * Преобразует значение поля товара в строку для колонок `old_value` / `new_value`
   * @param value - произвольное скалярное значение или дата
   * @returns строка или `NULL` в БД через `null`
   */
  private serializeValue = (value: unknown): string | null => {
    if (_.isNil(value)) {
      return null;
    }
    if (value instanceof Date) {
      return moment(value).toISOString();
    }
    if (typeof value === 'boolean') {
      return value ? 'true' : 'false';
    }
    if (typeof value === 'number') {
      return String(value);
    }
    return String(value);
  };

  /**
   * Для каждой тройки «ключ поля — было — стало» при отличии сериализованных значений добавляет дельту в `deltas`
   * @param deltas - накапливаемый список дельт (изменяется по ссылке)
   * @param pairs - список `[field, beforeValue, afterValue]`
   */
  private recordPairsIfChanged = (
    deltas: ItemHistoryDeltaInterface[],
    pairs: readonly [string, unknown, unknown][],
  ): void => {
    pairs.forEach(([field, beforeVal, afterVal]) => {
      const oldSerialized = this.serializeValue(beforeVal);
      const newSerialized = this.serializeValue(afterVal);
      if (oldSerialized !== newSerialized) {
        deltas.push({ field, oldValue: oldSerialized, newValue: newSerialized });
      }
    });
  };

  /**
   * Возвращает локализованное имя из массива переводов (приоритет RU, затем EN)
   * @param translations - строки с полями `lang` и `name`
   * @returns строка имени или пустая строка
   */
  private pickTranslatedName = (translations: TranslatedNameRow[] | undefined | null): string => {
    if (!translations?.length) {
      return '';
    }
    const preferred =
      translations.find((translation) => translation.lang === UserLangEnum.RU)
      ?? translations.find((translation) => translation.lang === UserLangEnum.EN)
      ?? translations[0];
    return preferred?.name ?? '';
  };

  /**
   * Подпись группы для истории (название или код)
   * @param group - сущность группы
   * @returns строка для сравнения в диффе
   */
  private serializeGroupLabel = (group: ItemGroupEntity | undefined | null): string => {
    if (_.isNil(group)) {
      return '';
    }
    const name = this.pickTranslatedName(group.translations as TranslatedNameRow[]);
    if (name) {
      return name;
    }
    return group.code ?? String(group.id);
  };

  /**
   * Подпись коллекции для истории
   * @param collection - сущность коллекции
   * @returns строка для сравнения в диффе
   */
  private serializeCollectionLabel = (collection: ItemCollectionEntity | undefined | null): string => {
    if (_.isNil(collection)) {
      return '';
    }
    const name = this.pickTranslatedName(collection.translations as TranslatedNameRow[]);
    return name || String(collection.id);
  };

  /**
   * Список имён фотографий товара (по порядку), разделённых переводом строки
   * @param images - изображения товара
   * @returns многострочная строка или пустая
   */
  private serializeImagesForHistory = (images: ImageEntity[] | undefined | null): string => {
    if (!images?.length) {
      return '';
    }
    return [...images]
      .filter((image) => _.isNil(image.deleted))
      .sort((a, b) => (a.order ?? a.id) - (b.order ?? b.id) || a.id - b.id)
      .map((image) => {
        const label = image.name?.trim();
        if (label) {
          return label;
        }
        return image.path?.trim() || `image#${image.id}`;
      })
      .join(ITEM_HISTORY_LIST_LINE_BREAK);
  };

  /**
   * Список названий составов (компонентов), разделённых переводом строки
   * @param compositions - связанные составы
   * @returns многострочная строка или пустая
   */
  private serializeCompositionsForHistory = (compositions: CompositionEntity[] | undefined | null): string => {
    if (!compositions?.length) {
      return '';
    }
    return [...compositions]
      .filter((composition) => _.isNil(composition.deleted))
      .sort((a, b) => a.id - b.id)
      .map((composition) => {
        const name = this.pickTranslatedName(composition.translations as TranslatedNameRow[]);
        return name || `#${composition.id}`;
      })
      .join(ITEM_HISTORY_LIST_LINE_BREAK);
  };

  /**
   * Список названий цветов (или hex), разделённых переводом строки
   * @param colors - связанные цвета
   * @returns многострочная строка или пустая
   */
  private serializeColorsForHistory = (colors: ColorEntity[] | undefined | null): string => {
    if (!colors?.length) {
      return '';
    }
    return [...colors]
      .filter((color) => _.isNil(color.deleted))
      .sort((a, b) => a.id - b.id)
      .map((color) => {
        const name = this.pickTranslatedName(color.translations as TranslatedNameRow[]);
        return name || color.hex || `#${color.id}`;
      })
      .join(ITEM_HISTORY_LIST_LINE_BREAK);
  };
}

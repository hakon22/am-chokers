import { isEmpty } from 'lodash';
import { Container } from 'typescript-ioc';
import { v4 as uuidv4 } from 'uuid';

import { ItemGroupService } from '@server/services/item/item.group.service';
import { ItemService } from '@server/services/item/item.service';
import { LoggerService } from '@server/services/app/logger.service';
import { mapLanguageCodeToUserLang } from '@/lib/server/map-language-code-to-user-lang';
import { isCatalogNumericPageQuery } from '@/utilities/shouldCatalogFiltersNoindex';
import type { LanguageCode } from '@shared/language-config';
import type { ItemGroupInterface, ItemInterface } from '@/types/item/Item';
import type { PaginationInterface } from '@/types/PaginationInterface';
import type { ItemQueryInterface } from '@server/types/item/item.query.interface';

interface CatalogListQueryInterface {
  groupIds?: number | number[];
  collectionIds?: number | number[];
  compositionIds?: number | number[];
  colorIds?: number | number[];
  from?: number;
  to?: number;
  search?: string;
  new?: boolean;
  bestseller?: boolean;
  inStock?: boolean;
  sort?: string;
  page?: number | string | string[];
}

interface CatalogListParamsInterface {
  path?: string[];
}

export interface CatalogListPageDataInterface {
  items: ItemInterface[];
  paginationParams: PaginationInterface;
  itemGroup: ItemGroupInterface | null;
  statistics: Record<number, number>;
  uuid: string;
}

export interface ProductPageDataInterface {
  item: ItemInterface;
  paginationParams: PaginationInterface;
}

const normalizeIdArray = (value?: number | number[]): number[] | undefined => {
  if (value === undefined) {
    return undefined;
  }

  return Array.isArray(value) ? value : [value];
};

const buildCatalogFilters = (query?: CatalogListQueryInterface): Partial<ItemQueryInterface> => ({
  ...(query?.collectionIds ? { collectionIds: normalizeIdArray(query.collectionIds) } : {}),
  ...(query?.compositionIds ? { compositionIds: normalizeIdArray(query.compositionIds) } : {}),
  ...(query?.colorIds ? { colorIds: normalizeIdArray(query.colorIds) } : {}),
  ...(query?.from ? { from: query.from } : {}),
  ...(query?.to ? { to: query.to } : {}),
  ...(query?.search ? { search: query.search } : {}),
  ...(query?.new ? { new: query.new } : {}),
  ...(query?.bestseller ? { bestseller: query.bestseller } : {}),
  ...(query?.inStock ? { inStock: query.inStock } : {}),
});

/**
 * Загружает данные листинга каталога прямыми вызовами сервисов
 * @param params - сегменты пути каталога
 * @param query - query-параметры фильтров и пагинации
 * @param languageCode - язык интерфейса из cookie
 * @returns props листинга каталога
 */
export const loadCatalogListPageData = async (
  { params, query }: { params: CatalogListParamsInterface; query?: CatalogListQueryInterface; },
  languageCode: LanguageCode,
): Promise<CatalogListPageDataInterface> => {
  const loggerService = Container.get(LoggerService);
  const startedAt = Date.now();

  const itemService = Container.get(ItemService);
  const itemGroupService = Container.get(ItemGroupService);
  const userLang = mapLanguageCodeToUserLang(languageCode);

  const { path } = params ?? { path: [undefined] };
  const [groupCode] = path ?? [];

  const chunkNumber = 8;
  const filters = buildCatalogFilters(query);

  const rawPageQuery = query?.page;
  const pageQueryValue = rawPageQuery === undefined
    ? undefined
    : Array.isArray(rawPageQuery)
      ? rawPageQuery[0]
      : String(rawPageQuery);
  const pageNumber = pageQueryValue !== undefined && isCatalogNumericPageQuery(pageQueryValue)
    ? Math.max(1, parseInt(pageQueryValue, 10))
    : 1;
  const limit = pageNumber * chunkNumber;

  const listQuery: ItemQueryInterface = {
    limit,
    offset: 0,
    ...(query?.groupIds || !isEmpty(filters) ? {} : { groupCode }),
    ...(query?.groupIds ? { groupIds: normalizeIdArray(query.groupIds) } : {}),
    ...(query?.sort ? { sort: query.sort as ItemQueryInterface['sort'] } : {}),
    ...filters,
  };

  const [listResult, statistics, itemGroup] = await Promise.all([
    itemService.getList(listQuery),
    itemService.getStatistics(filters),
    groupCode
      ? itemGroupService.getByCode({ code: groupCode }, userLang).catch(() => null)
      : Promise.resolve(null),
  ]);

  const [payloadItems, count] = listResult;

  loggerService.info('SSR', `loadCatalogListPageData completed in ${Date.now() - startedAt}ms`);

  return {
    items: payloadItems,
    paginationParams: {
      limit: chunkNumber,
      offset: limit !== chunkNumber ? limit - chunkNumber : 0,
      count,
    },
    itemGroup,
    statistics,
    uuid: uuidv4(),
  };
};

/**
 * Загружает данные карточки товара прямыми вызовами сервисов
 * @param translateName - slug товара из URL
 * @param languageCode - язык интерфейса из cookie
 * @returns props карточки товара или null, если товар не найден
 */
export const loadProductPageData = async (translateName: string, languageCode: LanguageCode): Promise<ProductPageDataInterface | null> => {
  const loggerService = Container.get(LoggerService);
  const startedAt = Date.now();

  const itemService = Container.get(ItemService);
  const userLang = mapLanguageCodeToUserLang(languageCode);

  try {
    const item = await itemService.getByName({ translateName }, userLang);
    const [grades, gradesCount] = await itemService.getGrades({ id: item.id }, { limit: 10, offset: 0 });

    item.grades = grades;

    loggerService.info('SSR', `loadProductPageData completed in ${Date.now() - startedAt}ms`);

    return {
      item,
      paginationParams: {
        limit: 10,
        offset: 0,
        count: gradesCount,
      },
    };
  } catch {
    return null;
  }
};

/**
 * Возвращает допустимые сегменты URL каталога для валидации маршрута
 * @returns список slug групп и товаров
 */
export const loadCatalogLinks = async (): Promise<string[]> => {
  const itemService = Container.get(ItemService);
  return itemService.getLinks();
};
